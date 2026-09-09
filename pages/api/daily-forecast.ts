import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import { getActiveAuthPayload } from "../../lib/requestAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "POST") {
        const { reportDate, forecastText, provinceId } = req.body;
        const targetProvinceId = authUser.role === "admin" && provinceId ? Number(provinceId) : authUser.provinceId;
        
        if (!targetProvinceId) return res.status(400).json({ error: "No province context" });

        const parsedDate = new Date(reportDate);

        const forecast = await prisma.dailyForecast.upsert({
            where: {
                provinceId_reportDate: { provinceId: targetProvinceId, reportDate: parsedDate }
            },
            update: {
                forecastText,
                userId: authUser.id
            },
            create: {
                reportDate: parsedDate,
                forecastText,
                provinceId: targetProvinceId,
                userId: authUser.id
            }
        });

        return res.status(200).json(forecast);
    }
    
    res.status(405).json({ error: "Method not allowed" });
}
