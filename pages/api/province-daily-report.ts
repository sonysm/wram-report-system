import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { getActiveAuthPayload } from "../../lib/requestAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { reportDate, provinceId } = req.query;
    const targetProvinceId = authUser.role === "admin" && provinceId ? Number(provinceId) : authUser.provinceId;

    if (!targetProvinceId || !reportDate || typeof reportDate !== "string") {
        return res.status(400).json({ error: "Invalid parameters" });
    }

    const parsedDate = new Date(reportDate);

    // 1. Fetch Temperature
    const temperature = await prisma.dailyTemperature.findUnique({
        where: { provinceId_reportDate: { provinceId: targetProvinceId, reportDate: parsedDate } },
        select: { id: true, reportDate: true, maxTemp: true, minTemp: true }
    });

    // 2. Fetch Rainfalls
    const rainfalls = await prisma.dailyRainfall.findMany({
        where: { provinceId: targetProvinceId, reportDate: parsedDate },
        select: { id: true, stationName: true, rainfall: true, districtId: true },
        orderBy: { id: 'asc' }
    });

    // 3. Fetch Forecast
    const forecast = await prisma.dailyForecast.findUnique({
        where: { provinceId_reportDate: { provinceId: targetProvinceId, reportDate: parsedDate } },
        select: { id: true, reportDate: true, forecastText: true }
    });

    // 4. Fetch Stations
    const stations = await prisma.station.findMany({
        where: { provinceId: targetProvinceId },
        select: { id: true, name: true, khmerName: true, river: true, category: true, warningLevel: true, maxCapacityLevel: true, order: true },
        orderBy: { order: 'asc' }
    });

    // 5. Fetch WaterLevels (StationReports)
    const stationIds = stations.map(s => s.id);
    const stationReports = await prisma.stationReport.findMany({
        where: {
            stationId: { in: stationIds },
            reportDate: parsedDate
        },
        select: {
            id: true,
            waterLevel: true,
            waterLevelYesterday: true,
            waterLevelLastYear: true,
            stationId: true
        }
    });

    const waterLevels = stationReports.map(sr => {
        const st = stations.find(s => s.id === sr.stationId);
        return {
            id: sr.id,
            waterLevel: sr.waterLevel,
            waterLevelYesterday: sr.waterLevelYesterday,
            waterLevelLastYear: sr.waterLevelLastYear,
            station: st
        };
    }).filter(wl => wl.station); // ensure station exists

    return res.status(200).json({
        temperature: temperature ? { ...temperature, reportDate: temperature.reportDate.toISOString() } : null,
        rainfalls,
        forecast: forecast ? { ...forecast, reportDate: forecast.reportDate.toISOString() } : null,
        stations,
        waterLevels
    });
}
