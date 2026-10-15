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

      const updatedReport = await prisma.provincialFloodReport.update({
        where: { id: reportId },
        data: {
          reportDate: data.reportDate ? new Date(data.reportDate) : existingReport.reportDate,
          provinceId,
          districtId: data.districtId !== undefined ? (data.districtId ? Number(data.districtId) : null) : existingReport.districtId,
          communesCount: data.communesCount !== undefined ? toInt(data.communesCount) : existingReport.communesCount,
          affectedFamilies: data.affectedFamilies !== undefined ? toInt(data.affectedFamilies) : existingReport.affectedFamilies,
          affectedRiceCrops: data.affectedRiceCrops !== undefined ? toFloat(data.affectedRiceCrops) : existingReport.affectedRiceCrops,
          damagedRiceCrops: data.damagedRiceCrops !== undefined ? toFloat(data.damagedRiceCrops) : existingReport.damagedRiceCrops,
          note: data.note !== undefined ? data.note : existingReport.note,
          waterInfrastructures: data.waterInfrastructures && Array.isArray(data.waterInfrastructures) ? {
            deleteMany: {},
            create: data.waterInfrastructures.map((wi: any) => ({
              name: wi.name || null,
              damLength: toFloat(wi.damLength),
              mainCanalLength: toFloat(wi.mainCanalLength),
              subCanalLength: toFloat(wi.subCanalLength),
              tertiaryCanalLength: toFloat(wi.tertiaryCanalLength),
              spillwayLength: toFloat(wi.spillwayLength),
              waterGateCount: toInt(wi.waterGateCount),
              pipeCulvertCount: toInt(wi.pipeCulvertCount),
              note: wi.note || null,
            })),
          } : undefined,
        },
      });

      return res.status(200).json(updatedReport);
    } catch (error: any) {
      console.error("Update flood report error:", error);
      return res.status(500).json({ error: error?.message || "Failed to update flood report" });
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
