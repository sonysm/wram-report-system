import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { getActiveAuthPayload } from "../../lib/requestAuth";

function parseNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function normalizeName(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        const districtIdFromQuery = parseNumber(req.query.districtId);

        if (authUser.role !== "admin") {
            if (!authUser.provinceId) {
                return res.status(403).json({ error: "This account has no province assigned" });
            }

            const communes = await prisma.commune.findMany({
                where: {
                    provinceId: authUser.provinceId,
                    ...(districtIdFromQuery !== null ? { districtId: districtIdFromQuery } : {}),
                },
                select: { id: true, name: true, provinceId: true, districtId: true },
                orderBy: { name: "asc" },
            });

            return res.json({ communes });
        }

        const provinceIdFromQuery = parseNumber(req.query.provinceId);

        const communes = await prisma.commune.findMany({
            where: {
                ...(provinceIdFromQuery !== null ? { provinceId: provinceIdFromQuery } : {}),
                ...(districtIdFromQuery !== null ? { districtId: districtIdFromQuery } : {}),
            },
            select: { id: true, name: true, provinceId: true, districtId: true },
            orderBy: { name: "asc" },
            take: 2000,
        });

        return res.json({ communes });
    }

    if (req.method === "POST") {
        const communeName = normalizeName(req.body?.name);
        const districtIdFromBody = parseNumber(req.body?.districtId);

        if (!communeName) {
            return res.status(400).json({ error: "Commune name is required" });
        }

        let targetProvinceId = authUser.provinceId;
        const provinceIdFromBody = parseNumber(req.body?.provinceId);
        if (authUser.role === "admin" && provinceIdFromBody !== null) {
            targetProvinceId = provinceIdFromBody;
        }

        if (!targetProvinceId) {
            return res.status(400).json({ error: "Province is required" });
        }

        const existing = await prisma.commune.findFirst({
            where: {
                provinceId: targetProvinceId,
                name: { equals: communeName, mode: "insensitive" },
            },
        });

        if (existing) {
            return res.json({ commune: existing, created: false });
        }

        const commune = await prisma.commune.create({
            data: {
                name: communeName,
                provinceId: targetProvinceId,
                districtId: districtIdFromBody,
                createdByUserId: authUser.isDemo ? null : authUser.id,
            },
        });

        return res.status(201).json({ commune, created: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
