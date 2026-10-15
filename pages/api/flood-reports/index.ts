import { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const reports = await prisma.provincialFloodReport.findMany({
        where: user.role === "admin" ? undefined : { provinceId: user.provinceId! },
        include: {
          province: { select: { id: true, name: true, khmerName: true, sortOrder: true } },
          district: { select: { id: true, name: true, khmerName: true } },
          user: { select: { id: true, username: true } },
          waterInfrastructures: true,
        },
        orderBy: [
          { province: { sortOrder: 'asc' } },
          { createdAt: 'desc' }
        ],
      });
      return res.status(200).json(reports);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch flood reports" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const provinceId = user.role === "admin" ? Number(data.provinceId) : user.provinceId;

      if (!provinceId) {
          return res.status(400).json({ error: "Province ID is required" });
      }

      const toFloat = (val: any) => {
        if (val === undefined || val === null || val === "") return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };

      const toInt = (val: any) => {
        if (val === undefined || val === null || val === "") return 0;
        const num = Math.round(Number(val));
        return isNaN(num) ? 0 : num;
      };

      const newReport = await prisma.provincialFloodReport.create({
        data: {
          reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
          provinceId,
          districtId: data.districtId ? Number(data.districtId) : null,
          communesCount: toInt(data.communesCount),
          affectedFamilies: toInt(data.affectedFamilies),
          affectedRiceCrops: toFloat(data.affectedRiceCrops),
          damagedRiceCrops: toFloat(data.damagedRiceCrops),
          note: data.note || null,
          userId: user.id,
          waterInfrastructures: {
            create: data.waterInfrastructures && Array.isArray(data.waterInfrastructures) 
              ? data.waterInfrastructures.map((wi: any) => ({
                  name: wi.name || null,
                  damLength: toFloat(wi.damLength),
                  mainCanalLength: toFloat(wi.mainCanalLength),
                  subCanalLength: toFloat(wi.subCanalLength),
                  tertiaryCanalLength: toFloat(wi.tertiaryCanalLength),
                  spillwayLength: toFloat(wi.spillwayLength),
                  waterGateCount: toInt(wi.waterGateCount),
                  pipeCulvertCount: toInt(wi.pipeCulvertCount),
                  note: wi.note || null,
                }))
              : [],
          },
        },
      });

      return res.status(201).json(newReport);
    } catch (error: any) {
      console.error("Create flood report error:", error);
      return res.status(500).json({ error: error?.message || "Failed to create flood report" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
