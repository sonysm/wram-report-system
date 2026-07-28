import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { hashPassword } from "../../lib/auth";
import { getAuthPayload } from "../../lib/requestAuth";

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parseInteger(value: unknown): number | null {
    if (typeof value === "number" && Number.isInteger(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isInteger(parsed)) {
            return parsed;
        }
    }

    return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = getAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (authUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }

    if (req.method === "GET") {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                provinceId: true,
                province: {
                    select: {
                        name: true,
                        khmerName: true,
                    },
                },
            },
            orderBy: [{ role: "asc" }, { username: "asc" }],
            take: 500,
        });

        return res.json({
            users: users.map((user) => ({
                id: user.id,
                username: user.username,
                role: user.role,
                provinceId: user.provinceId,
                provinceName: user.province?.khmerName || user.province?.name || null,
            })),
        });
    }

    if (req.method === "POST") {
        const username = normalizeText(req.body?.username);
        const password = normalizeText(req.body?.password);
        const provinceId = parseInteger(req.body?.provinceId);

        if (!username || !password || provinceId === null) {
            return res.status(400).json({ error: "Username, password, and province are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const province = await prisma.province.findUnique({ where: { id: provinceId } });
        if (!province) {
            return res.status(400).json({ error: "Province not found" });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ error: "Username already exists" });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                role: "user",
                provinceId: province.id,
            },
            include: {
                province: {
                    select: {
                        name: true,
                        khmerName: true,
                    },
                },
            },
        });

        return res.status(201).json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                provinceId: user.provinceId,
                provinceName: user.province?.khmerName || user.province?.name || null,
            },
        });
    }

    if (req.method === "PATCH") {
        const userId = parseInteger(req.body?.userId);
        const newPassword = normalizeText(req.body?.newPassword);

        if (userId === null || !newPassword) {
            return res.status(400).json({ error: "User and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
            },
        });

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (targetUser.role !== "user") {
            return res.status(400).json({ error: "Only province users can be reset from this action" });
        }

        const nextPasswordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: nextPasswordHash },
        });

        return res.json({
            message: `Password reset for ${targetUser.username}`,
        });
    }

    return res.status(405).json({ error: "Method not allowed" });
}