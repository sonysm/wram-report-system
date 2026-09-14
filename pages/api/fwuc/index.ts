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
      const fwucs = await prisma.fwuc.findMany({
        where: user.role === "admin" ? undefined : { provinceId: user.provinceId! },
        include: {
          province: { select: { id: true, name: true, khmerName: true, sortOrder: true } },
          district: { select: { id: true, name: true, khmerName: true } },
          commune: { select: { id: true, name: true, khmerName: true } },
          user: { select: { id: true, username: true } },
        },
        orderBy: [
          { province: { sortOrder: 'asc' } },
          { createdAt: 'desc' }
        ],
      });
      return res.status(200).json(fwucs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch FWUC entries" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const provinceId = user.role === "admin" ? data.provinceId : user.provinceId;

      const newFwuc = await prisma.fwuc.create({
        data: {
          name: data.name,
          provinceId,
          districtId: data.districtId ? Number(data.districtId) : null,
          communeId: data.communeId ? Number(data.communeId) : null,
          longitude: data.longitude ? Number(data.longitude) : null,
          latitude: data.latitude ? Number(data.latitude) : null,
          registrationPlace: data.registrationPlace,
          registrationNumber: data.registrationNumber,
          registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
          irrigatedDryArea: data.irrigatedDryArea ? Number(data.irrigatedDryArea) : 0,
          irrigatedWetArea: data.irrigatedWetArea ? Number(data.irrigatedWetArea) : 0,
          efficiency: data.efficiency,
          note: data.note,
          userId: user.id,
        },
      });

      return res.status(201).json(newFwuc);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create FWUC entry" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
