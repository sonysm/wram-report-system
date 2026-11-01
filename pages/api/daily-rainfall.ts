import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { getActiveAuthPayload } from "../../lib/requestAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "POST") {
        const { reportDate, stationName, rainfall, districtId, provinceId, entries } = req.body;
        const targetProvinceId = authUser.role === "admin" && provinceId ? Number(provinceId) : authUser.provinceId;
        
        if (!targetProvinceId) return res.status(400).json({ error: "No province context" });

        const parsedDate = new Date(reportDate);

        // Batch update/create
        if (Array.isArray(entries)) {
            const results = [];
            for (const item of entries) {
                const itemStationName = item.stationName ? String(item.stationName).trim() : "";
                const itemRainfall = Number(item.rainfall) || 0;
                const itemDistrictId = item.districtId ? Number(item.districtId) : null;

                if (!itemStationName && !itemDistrictId) continue;

                let existing = null;
                if (item.id) {
                    existing = await prisma.dailyRainfall.findUnique({ where: { id: Number(item.id) } });
                } else if (itemDistrictId) {
                    existing = await prisma.dailyRainfall.findFirst({
                        where: {
                            reportDate: parsedDate,
                            provinceId: targetProvinceId,
                            districtId: itemDistrictId
                        }
                    });
                }

                if (existing) {
                    const updated = await prisma.dailyRainfall.update({
                        where: { id: existing.id },
                        data: {
                            stationName: itemStationName || existing.stationName,
                            rainfall: itemRainfall,
                            districtId: itemDistrictId,
                            userId: authUser.id
                        }
                    });
                    results.push(updated);
                } else {
                    const created = await prisma.dailyRainfall.create({
                        data: {
                            reportDate: parsedDate,
                            stationName: itemStationName || `ស្រុក${itemDistrictId}`,
                            rainfall: itemRainfall,
                            districtId: itemDistrictId,
                            provinceId: targetProvinceId,
                            userId: authUser.id
                        }
                    });
                    results.push(created);
                }
            }
            return res.status(200).json({ success: true, count: results.length, entries: results });
        }

        // Single entry upsert
        let existing = null;
        if (req.body.id) {
            existing = await prisma.dailyRainfall.findUnique({ where: { id: Number(req.body.id) } });
        } else if (districtId) {
            existing = await prisma.dailyRainfall.findFirst({
                where: {
                    reportDate: parsedDate,
                    provinceId: targetProvinceId,
                    districtId: Number(districtId)
                }
            });
        }

        if (existing) {
            const updated = await prisma.dailyRainfall.update({
                where: { id: existing.id },
                data: {
                    stationName: stationName ? String(stationName).trim() : existing.stationName,
                    rainfall: Number(rainfall) || 0,
                    districtId: districtId ? Number(districtId) : null,
                    userId: authUser.id
                }
            });
            return res.status(200).json(updated);
        }

        const r = await prisma.dailyRainfall.create({
            data: {
                reportDate: parsedDate,
                stationName: String(stationName).trim(),
                rainfall: Number(rainfall) || 0,
                districtId: districtId ? Number(districtId) : null,
                provinceId: targetProvinceId,
                userId: authUser.id
            }
        });

        return res.status(200).json(r);
    } else if (req.method === "DELETE") {
        const id = Number(req.query.id);
        if (!id) return res.status(400).json({ error: "Missing ID" });

        const r = await prisma.dailyRainfall.findUnique({ where: { id } });
        if (!r) return res.status(404).json({ error: "Not found" });

        if (authUser.role !== "admin" && r.provinceId !== authUser.provinceId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await prisma.dailyRainfall.delete({ where: { id } });
        return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: "Method not allowed" });
}
