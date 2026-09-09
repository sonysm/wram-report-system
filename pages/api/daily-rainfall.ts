import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { getActiveAuthPayload } from "../../lib/requestAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "POST") {
        const { reportDate, stationName, rainfall, districtId, provinceId } = req.body;
        const targetProvinceId = authUser.role === "admin" && provinceId ? Number(provinceId) : authUser.provinceId;
        
        if (!targetProvinceId) return res.status(400).json({ error: "No province context" });

        const parsedDate = new Date(reportDate);

        const r = await prisma.dailyRainfall.create({
            data: {
                reportDate: parsedDate,
                stationName,
                rainfall: Number(rainfall),
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
