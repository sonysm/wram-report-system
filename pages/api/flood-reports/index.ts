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

      const newReport = await prisma.provincialFloodReport.create({
        data: {
          reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
          provinceId,
          districtId: data.districtId ? Number(data.districtId) : null,
          communesCount: data.communesCount ? Number(data.communesCount) : 0,
          affectedFamilies: data.affectedFamilies ? Number(data.affectedFamilies) : 0,
          affectedWaterInfrastructure: data.affectedWaterInfrastructure ? Number(data.affectedWaterInfrastructure) : 0,
          affectedRiceCrops: data.affectedRiceCrops ? Number(data.affectedRiceCrops) : 0,
          damagedRiceCrops: data.damagedRiceCrops ? Number(data.damagedRiceCrops) : 0,
          note: data.note || null,
          reservoirName: data.reservoirName || null,
          damLength: data.damLength ? Number(data.damLength) : 0,
          mainCanalLength: data.mainCanalLength ? Number(data.mainCanalLength) : 0,
          subCanalLength: data.subCanalLength ? Number(data.subCanalLength) : 0,
          tertiaryCanalLength: data.tertiaryCanalLength ? Number(data.tertiaryCanalLength) : 0,
          spillwayLength: data.spillwayLength ? Number(data.spillwayLength) : 0,
          waterGateCount: data.waterGateCount ? Number(data.waterGateCount) : 0,
          pipeCulvertCount: data.pipeCulvertCount ? Number(data.pipeCulvertCount) : 0,
          userId: user.id,
        },
      });

      return res.status(201).json(newReport);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create flood report" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
