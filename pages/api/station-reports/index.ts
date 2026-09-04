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

    if (req.method === "GET") {
        let targetProvinceId = authUser.provinceId;
        const provinceIdFromQuery = parseNumber(req.query.provinceId);
        
        if (authUser.role === "admin" && provinceIdFromQuery !== null) {
            targetProvinceId = provinceIdFromQuery;
        }

        const dateQuery = typeof req.query.reportDate === "string" ? new Date(req.query.reportDate) : null;
        
        let dateFilter = {};
        if (dateQuery && !isNaN(dateQuery.getTime())) {
            dateFilter = {
                reportDate: {
                    gte: new Date(dateQuery.setHours(0,0,0,0)),
                    lt: new Date(dateQuery.setHours(23,59,59,999)),
                }
            };
        }

        const reports = await prisma.stationReport.findMany({
            where: {
                ...(targetProvinceId ? { station: { provinceId: targetProvinceId } } : {}),
                ...dateFilter
            },
            include: { 
                station: { 
                    select: { name: true, category: true, warningLevel: true, province: { select: { name: true, khmerName: true } } } 
                },
                user: { select: { username: true } }
            },
            orderBy: { reportDate: "desc" },
        });

        return res.json({ reports });
    }

    if (req.method === "POST") {
        const stationId = parseNumber(req.body?.stationId);
        const waterLevel = parseNumber(req.body?.waterLevel);
        const reportDate = req.body?.reportDate ? new Date(req.body.reportDate) : new Date();

        if (!stationId || waterLevel === null) {
            return res.status(400).json({ error: "Station ID and water level are required" });
        }

        const station = await prisma.station.findUnique({ where: { id: stationId } });
        if (!station) {
            return res.status(404).json({ error: "Station not found" });
        }

        if (authUser.role !== "admin" && station.provinceId !== authUser.provinceId) {
            return res.status(403).json({ error: "Forbidden" });
        }
        
        // Find yesterday and last year's water level
        const yesterday = new Date(reportDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastYear = new Date(reportDate);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        
        // Get yesterday's report
        const yesterdayReport = await prisma.stationReport.findFirst({
            where: {
                stationId,
                reportDate: {
                    gte: new Date(yesterday.setHours(0,0,0,0)),
                    lt: new Date(yesterday.setHours(23,59,59,999)),
                }
            }
        });
        
        // Get last year's report
        const lastYearReport = await prisma.stationReport.findFirst({
            where: {
                stationId,
                reportDate: {
                    gte: new Date(lastYear.setHours(0,0,0,0)),
                    lt: new Date(lastYear.setHours(23,59,59,999)),
                }
            }
        });
        
        const waterLevelYesterday = yesterdayReport ? yesterdayReport.waterLevel : parseNumber(req.body?.waterLevelYesterday);
        const waterLevelLastYear = lastYearReport ? lastYearReport.waterLevel : parseNumber(req.body?.waterLevelLastYear);

        const report = await prisma.stationReport.create({
            data: {
                stationId,
                reportDate,
                waterLevel,
                waterLevelYesterday,
                waterLevelLastYear,
                userId: authUser.isDemo ? null : authUser.id,
            },
            include: { station: true },
        });

        return res.status(201).json({ report });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
