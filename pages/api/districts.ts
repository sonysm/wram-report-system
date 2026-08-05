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
        const provinceIdFromQuery = parseNumber(req.query.provinceId);

        if (authUser.role !== "admin") {
            if (!authUser.provinceId) {
                return res.status(403).json({ error: "This account has no province assigned" });
            }

            const districts = await prisma.district.findMany({
                where: { provinceId: authUser.provinceId },
                select: { id: true, name: true, provinceId: true },
                orderBy: { name: "asc" },
            });

            return res.json({ districts });
        }

        if (provinceIdFromQuery !== null) {
            const districts = await prisma.district.findMany({
                where: { provinceId: provinceIdFromQuery },
                select: { id: true, name: true, provinceId: true },
                orderBy: { name: "asc" },
            });
            return res.json({ districts });
        }

        const districts = await prisma.district.findMany({
            select: {
                id: true,
                name: true,
                provinceId: true,
                province: { select: { name: true, khmerName: true } },
            },
            orderBy: [{ province: { khmerName: "asc" } }, { name: "asc" }],
            take: 500,
        });

        return res.json({ districts });
    }

    if (req.method === "POST") {
        const districtName = normalizeName(req.body?.name);
        const provinceIdFromBody = parseNumber(req.body?.provinceId);

        if (!districtName) {
            return res.status(400).json({ error: "District name is required" });
        }

        let targetProvinceId = authUser.provinceId;
        if (authUser.role === "admin" && provinceIdFromBody !== null) {
            targetProvinceId = provinceIdFromBody;
        }

        if (!targetProvinceId) {
            return res.status(400).json({ error: "Province is required" });
        }

        const existing = await prisma.district.findFirst({
            where: {
                provinceId: targetProvinceId,
                name: { equals: districtName, mode: "insensitive" },
            },
        });

        if (existing) {
            return res.json({ district: existing, created: false });
        }

        const district = await prisma.district.create({
            data: {
                name: districtName,
                provinceId: targetProvinceId,
                createdByUserId: authUser.isDemo ? null : authUser.id,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "DISTRICT_CREATE",
                entityType: "District",
                entityId: district.id,
                actorUserId: authUser.isDemo ? null : authUser.id,
                actorUsername: authUser.username,
                provinceId: targetProvinceId,
                changes: {
                    districtName: district.name,
                },
            },
        });

        return res.status(201).json({ district, created: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}