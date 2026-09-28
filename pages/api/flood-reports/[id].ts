import { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  const reportId = Number(id);

  if (!reportId || isNaN(reportId)) {
    return res.status(400).json({ error: "Invalid report ID" });
  }

  const existingReport = await prisma.provincialFloodReport.findUnique({
    where: { id: reportId },
  });

  if (!existingReport) {
    return res.status(404).json({ error: "Flood report not found" });
  }

  // Check permissions: users can only modify their own province data unless admin
  if (user.role !== "admin" && existingReport.provinceId !== user.provinceId) {
    return res.status(403).json({ error: "Forbidden: You can only modify data for your province" });
  }

  if (req.method === "PUT") {
    try {
      const data = req.body;
      const provinceId = user.role === "admin" && data.provinceId ? Number(data.provinceId) : existingReport.provinceId;

      const updatedReport = await prisma.provincialFloodReport.update({
        where: { id: reportId },
        data: {
          reportDate: data.reportDate ? new Date(data.reportDate) : existingReport.reportDate,
          provinceId,
          districtId: data.districtId !== undefined ? (data.districtId ? Number(data.districtId) : null) : existingReport.districtId,
          communesCount: data.communesCount !== undefined ? Number(data.communesCount) : existingReport.communesCount,
          affectedFamilies: data.affectedFamilies !== undefined ? Number(data.affectedFamilies) : existingReport.affectedFamilies,
          affectedWaterInfrastructure: data.affectedWaterInfrastructure !== undefined ? Number(data.affectedWaterInfrastructure) : existingReport.affectedWaterInfrastructure,
          affectedRiceCrops: data.affectedRiceCrops !== undefined ? Number(data.affectedRiceCrops) : existingReport.affectedRiceCrops,
          damagedRiceCrops: data.damagedRiceCrops !== undefined ? Number(data.damagedRiceCrops) : existingReport.damagedRiceCrops,
          note: data.note !== undefined ? data.note : existingReport.note,
          reservoirName: data.reservoirName !== undefined ? data.reservoirName : existingReport.reservoirName,
          damLength: data.damLength !== undefined ? Number(data.damLength) : existingReport.damLength,
          mainCanalLength: data.mainCanalLength !== undefined ? Number(data.mainCanalLength) : existingReport.mainCanalLength,
          subCanalLength: data.subCanalLength !== undefined ? Number(data.subCanalLength) : existingReport.subCanalLength,
          tertiaryCanalLength: data.tertiaryCanalLength !== undefined ? Number(data.tertiaryCanalLength) : existingReport.tertiaryCanalLength,
          spillwayLength: data.spillwayLength !== undefined ? Number(data.spillwayLength) : existingReport.spillwayLength,
          waterGateCount: data.waterGateCount !== undefined ? Number(data.waterGateCount) : existingReport.waterGateCount,
          pipeCulvertCount: data.pipeCulvertCount !== undefined ? Number(data.pipeCulvertCount) : existingReport.pipeCulvertCount,
        },
      });

      return res.status(200).json(updatedReport);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update flood report" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.provincialFloodReport.delete({
        where: { id: reportId },
      });
      return res.status(204).end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete flood report" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
