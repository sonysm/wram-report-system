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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const reportId = parseNumber(req.query.id);
    if (!reportId) {
        return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = await prisma.stationReport.findUnique({
        where: { id: reportId },
        include: { station: true },
    });

    if (!report) {
        return res.status(404).json({ error: "Report not found" });
    }

    if (authUser.role !== "admin" && report.station.provinceId !== authUser.provinceId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "GET") {
        return res.json({ report });
    }

    if (req.method === "PUT") {
        const updated = await prisma.stationReport.update({
            where: { id: reportId },
            data: {
                waterLevel: req.body?.waterLevel !== undefined ? parseNumber(req.body.waterLevel) ?? report.waterLevel : report.waterLevel,
                waterLevelYesterday: req.body?.waterLevelYesterday !== undefined ? parseNumber(req.body.waterLevelYesterday) : report.waterLevelYesterday,
                waterLevelLastYear: req.body?.waterLevelLastYear !== undefined ? parseNumber(req.body.waterLevelLastYear) : report.waterLevelLastYear,
                reportDate: req.body?.reportDate ? new Date(req.body.reportDate) : report.reportDate,
            },
            include: { station: true },
        });

        return res.json({ report: updated });
    }

    if (req.method === "DELETE") {
        await prisma.stationReport.delete({ where: { id: reportId } });
        return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
}
