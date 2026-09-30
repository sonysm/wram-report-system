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

      const newReport = await prisma.provincialFloodReport.create({
        data: {
          reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
          provinceId,
          districtId: data.districtId ? Number(data.districtId) : null,
          communesCount: data.communesCount ? Number(data.communesCount) : 0,
          affectedFamilies: data.affectedFamilies ? Number(data.affectedFamilies) : 0,
          affectedRiceCrops: data.affectedRiceCrops ? Number(data.affectedRiceCrops) : 0,
          damagedRiceCrops: data.damagedRiceCrops ? Number(data.damagedRiceCrops) : 0,
          note: data.note || null,
          userId: user.id,
          waterInfrastructures: {
            create: data.waterInfrastructures && Array.isArray(data.waterInfrastructures) 
              ? data.waterInfrastructures.map((wi: any) => ({
                  type: wi.type || null,
                  name: wi.name || null,
                  locationX: wi.locationX || null,
                  locationY: wi.locationY || null,
                  damagedLength: wi.damagedLength ? Number(wi.damagedLength) : 0,
                  status: wi.status || null,
                  note: wi.note || null,
                }))
              : [],
          },
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
