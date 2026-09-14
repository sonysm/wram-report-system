import { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  const fwucId = Number(id);

  if (isNaN(fwucId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const existing = await prisma.fwuc.findUnique({
    where: { id: fwucId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Not found" });
  }

  if (user.role !== "admin" && existing.provinceId !== user.provinceId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PUT") {
    try {
      const data = req.body;
      const updated = await prisma.fwuc.update({
        where: { id: fwucId },
        data: {
          name: data.name,
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
        },
      });
      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update FWUC entry" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.fwuc.delete({
        where: { id: fwucId },
      });
      return res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete FWUC entry" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
