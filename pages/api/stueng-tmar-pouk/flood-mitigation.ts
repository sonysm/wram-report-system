import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const basin = await prisma.basin.findFirst({
    where: { code: "BASIN-TMP-01" },
  });

  if (!basin) {
    return res.status(404).json({ error: "Stueng Tmar Pouk Sub-basin not found." });
  }

  if (req.method === "GET") {
    try {
      const alerts = await prisma.floodSurgeAlert.findMany({
        where: { basinId: basin.id },
        orderBy: { createdAt: "desc" },
      });

      // Get structures involved in flood mitigation
      const floodStructures = await prisma.hydraulicStructure.findMany({
        where: {
          basinId: basin.id,
          floodMitigationRole: true,
        },
        orderBy: { code: "asc" },
      });

      // Calculate aggregated flood risk reduction capability
      const activeAlert = alerts.find((a) => a.activeAlert);

      return res.status(200).json({
        alerts,
        activeAlert: activeAlert || null,
        floodStructures,
        mitigationCapability: {
          maxRiskReductionPercent: 80.0,
          diversionCapacityM3s: 185.0,
          primaryRetentionReservoir: "អាងស្តុកទឹកត្រពាំងថ្ម (Ang Trapeng Thmor Reservoir)",
          operationalWeirCount: 4,
          drainageGateCount: 4,
          highlandSurgeOrigin: "ជួរភ្នំដងរែក និងខ្ពង់រាបឧត្តរមានជ័យ (Dangrek Plateau)",
        },
      });
    } catch (error: any) {
      console.error("Flood mitigation error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch flood mitigation data" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const { action, alertId, alertLevel, sourceLocation, peakInflowM3s, diversionPlanKh, coordinatedGates } = data;

      if (action === "RESOLVE_ALERT") {
        if (!alertId) {
          return res.status(400).json({ error: "alertId is required to resolve alert" });
        }
        const updated = await prisma.floodSurgeAlert.update({
          where: { id: parseInt(String(alertId), 10) },
          data: {
            activeAlert: false,
            resolvedAt: new Date(),
          },
        });
        return res.status(200).json({ success: true, message: "Flood alert resolved", alert: updated });
      }

      if (action === "APPLY_DIVERSION_COORDINATION") {
        // Adjust the gates of the diversion dams and drainage gates
        const updates = [];
        if (Array.isArray(coordinatedGates)) {
          for (const gate of coordinatedGates) {
            const structure = await prisma.hydraulicStructure.findUnique({
              where: { code: gate.code },
            });
            if (structure) {
              const updated = await prisma.hydraulicStructure.update({
                where: { code: gate.code },
                data: {
                  currentGateOpeningPercent: parseFloat(String(gate.gateOpening || 75)),
                  status: "OPERATIONAL",
                },
              });
              updates.push(updated);
            }
          }
        }
        return res.status(200).json({ success: true, message: "Gate diversion settings applied", updates });
      }

      // Default: Create new surge alert
      const newAlert = await prisma.floodSurgeAlert.create({
        data: {
          basinId: basin.id,
          alertLevel: alertLevel || "WARNING",
          sourceLocation: sourceLocation || "ជួរភ្នំដងរែក និងខ្ពង់រាបឧត្តរមានជ័យ (Dangrek Plateau)",
          peakInflowM3s: parseFloat(String(peakInflowM3s || 120)),
          diversionPlanKh: diversionPlanKh || "សម្របសម្រួលបើកទ្វារទឹកពង្វាង និងទ្វារដោះទឹក ដើម្បីកាត់បន្ថយគ្រោះទឹកជំនន់ ៨០%។",
          riskReductionPercent: 80.0,
          gatesCoordinated: coordinatedGates || [
            { code: "WEIR-TMP-01", gateOpening: 85, mode: "High-level flood diversion" },
            { code: "WEIR-TMP-04", gateOpening: 75, mode: "Emergency intake to Trapeng Thmor reservoir" },
            { code: "CTRL-TMP-04", gateOpening: 90, mode: "Drainage spillway bypass" },
            { code: "CTRL-TMP-08", gateOpening: 90, mode: "Drainage spillway bypass" },
          ],
          activeAlert: true,
        },
      });

      return res.status(201).json({ success: true, alert: newAlert });
    } catch (error: any) {
      console.error("Flood alert action error:", error);
      return res.status(500).json({ error: error?.message || "Failed to process flood mitigation action" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
