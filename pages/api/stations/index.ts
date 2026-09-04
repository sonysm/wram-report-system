import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db";
import { getActiveAuthPayload } from "../../../lib/requestAuth";

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

function normalizeString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        let targetProvinceId = authUser.provinceId;
        const provinceIdFromQuery = parseNumber(req.query.provinceId);

        if (authUser.role === "admin" && provinceIdFromQuery !== null) {
            targetProvinceId = provinceIdFromQuery;
        }

        const stations = await prisma.station.findMany({
            where: targetProvinceId ? { provinceId: targetProvinceId } : {},
            include: {
                province: { select: { name: true } },
                district: { select: { name: true, khmerName: true } },
                commune: { select: { name: true, khmerName: true } }
            },
            orderBy: { order: "asc" },
        });

        return res.json({ stations });
    }

    if (req.method === "POST") {
        const name = normalizeString(req.body?.name);
        if (!name) {
            return res.status(400).json({ error: "Station name is required" });
        }

        let targetProvinceId = authUser.provinceId;
        const provinceIdFromBody = parseNumber(req.body?.provinceId);

        if (authUser.role === "admin" && provinceIdFromBody !== null) {
            targetProvinceId = provinceIdFromBody;
        }

        if (!targetProvinceId) {
            return res.status(400).json({ error: "Province is required" });
        }

        const station = await prisma.station.create({
            data: {
                name,
                khmerName: normalizeString(req.body?.khmerName) || "",
                river: normalizeString(req.body?.river) || null,
                category: normalizeString(req.body?.category) || null,
                monitoringFunctions: normalizeString(req.body?.monitoringFunctions) || null,
                warningLevel: parseNumber(req.body?.warningLevel),
                latitude: parseNumber(req.body?.latitude),
                longitude: parseNumber(req.body?.longitude),
                order: parseNumber(req.body?.order) ?? 0,
                provinceId: targetProvinceId,
                districtId: parseNumber(req.body?.districtId),
                communeId: parseNumber(req.body?.communeId),
                createdByUserId: authUser.isDemo ? null : authUser.id,
            },
            include: {
                province: { select: { name: true } },
                district: { select: { name: true } },
                commune: { select: { name: true } }
            },
        });

        return res.status(201).json({ station });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
