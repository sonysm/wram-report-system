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

    const stationId = parseNumber(req.query.id);
    if (!stationId) {
        return res.status(400).json({ error: "Invalid station ID" });
    }

    const station = await prisma.station.findUnique({
        where: { id: stationId },
        include: { 
            province: { select: { name: true } },
            district: { select: { name: true } },
            commune: { select: { name: true } }
        },
    });

    if (!station) {
        return res.status(404).json({ error: "Station not found" });
    }

    if (authUser.role !== "admin" && station.provinceId !== authUser.provinceId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "GET") {
        return res.json({ station });
    }

    if (req.method === "PUT") {
        const updated = await prisma.station.update({
            where: { id: stationId },
            data: {
                name: normalizeString(req.body?.name) || station.name,
                khmerName: req.body?.khmerName !== undefined ? normalizeString(req.body.khmerName) : station.khmerName,
                river: req.body?.river !== undefined ? normalizeString(req.body.river) : station.river,
                category: req.body?.category !== undefined ? normalizeString(req.body.category) : station.category,
                monitoringFunctions: req.body?.monitoringFunctions !== undefined ? normalizeString(req.body.monitoringFunctions) : station.monitoringFunctions,
                warningLevel: req.body?.warningLevel !== undefined ? parseNumber(req.body.warningLevel) : station.warningLevel,
                latitude: req.body?.latitude !== undefined ? parseNumber(req.body.latitude) : station.latitude,
                longitude: req.body?.longitude !== undefined ? parseNumber(req.body.longitude) : station.longitude,
                order: req.body?.order !== undefined ? parseNumber(req.body.order) ?? station.order : station.order,
                districtId: req.body?.districtId !== undefined ? parseNumber(req.body.districtId) : station.districtId,
                communeId: req.body?.communeId !== undefined ? parseNumber(req.body.communeId) : station.communeId,
            },
            include: { 
                province: { select: { name: true } },
                district: { select: { name: true } },
                commune: { select: { name: true } }
            },
        });

        return res.json({ station: updated });
    }

    if (req.method === "DELETE") {
        await prisma.station.delete({ where: { id: stationId } });
        return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
}
