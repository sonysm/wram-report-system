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
      const { structureId, sourceOrigin, limit } = req.query;
      const takeCount = limit ? parseInt(String(limit), 10) : 50;

      const whereClause: any = { basinId: basin.id };
      if (structureId) whereClause.structureId = parseInt(String(structureId), 10);
      if (sourceOrigin && typeof sourceOrigin === "string") whereClause.sourceOrigin = sourceOrigin;

      // 1. Get 4 Diversion Weirs status
      const weirs = await prisma.hydraulicStructure.findMany({
        where: { basinId: basin.id, structureType: "DIVERSION_WEIR" },
        include: {
          district: { select: { id: true, name: true, khmerName: true } },
        },
        orderBy: { code: "asc" },
      });

      // 2. Telemetry logs
      const telemetryLogs = await prisma.inflowTelemetryLog.findMany({
        where: whereClause,
        include: {
          structure: { select: { id: true, code: true, name: true, khmerName: true } },
        },
        orderBy: { timestamp: "desc" },
        take: takeCount,
      });

      // 3. Reach & Flow Analytics: 55 km main river & 24 km tributaries
      // Calculate conveyance efficiency and water loss
      const totalInflowM3s = weirs.reduce((sum, w) => sum + w.currentDischargeM3s, 0);
      const mainRiverLengthKm = basin.mainRiverLengthKm; // 55 km
      const tributaryLengthKm = basin.tributaryLengthKm; // 24 km

      // Model conveyance loss: seepage (~0.22% per km unlined/open) + evaporation
      const mainRiverLossM3s = +(totalInflowM3s * (mainRiverLengthKm * 0.0022)).toFixed(2);
      const tributaryLossM3s = +((totalInflowM3s * 0.3) * (tributaryLengthKm * 0.0028)).toFixed(2);
      const mainConveyanceEfficiency = +(100 - (mainRiverLossM3s / (totalInflowM3s || 1)) * 100).toFixed(1);
      const tributaryConveyanceEfficiency = +(100 - (tributaryLossM3s / ((totalInflowM3s * 0.3) || 1)) * 100).toFixed(1);

      // 4. Anomaly detection alerts count
      const anomalyCount = telemetryLogs.filter((t) => t.anomalyDetected).length;

      return res.status(200).json({
        weirs,
        telemetryLogs,
        reachAnalytics: {
          mainRiver: {
            name: "ស្ទឹងថ្មពួកមេ (Stueng Tmar Pouk Main Stem)",
            lengthKm: mainRiverLengthKm,
            currentFlowM3s: +totalInflowM3s.toFixed(2),
            estimatedLossM3s: mainRiverLossM3s,
            conveyanceEfficiencyPercent: Math.max(70, Math.min(98, mainConveyanceEfficiency)),
            monitoringReachStatus: "OPTIMAL",
          },
          tributaries: {
            name: "ស្ទឹង និងអូររងបែកខ្នែង (Tributary Stream Network)",
            lengthKm: tributaryLengthKm,
            currentFlowM3s: +(totalInflowM3s * 0.3).toFixed(2),
            estimatedLossM3s: tributaryLossM3s,
            conveyanceEfficiencyPercent: Math.max(68, Math.min(95, tributaryConveyanceEfficiency)),
            monitoringReachStatus: "NORMAL",
          },
        },
        inflowSources: [
          {
            sourceKey: "CROSS_BORDER_THAILAND",
            title: "លំហូរឆ្លងដែនពីប្រទេសថៃ (Cross-Border Inflow Thailand)",
            status: "MONITORED",
            averageDischargeM3s: 14.8,
            thresholdMaxM3s: 40.0,
          },
          {
            sourceKey: "ODDAR_MEANCHEY_PLATEAU",
            title: "ទឹកហូរធ្លាក់ពីខ្ពង់រាបឧត្តរមានជ័យ / ដងរែក (Plateau Runoff Oddar Meanchey)",
            status: anomalyCount > 0 ? "SURGE_WATCH" : "NORMAL",
            averageDischargeM3s: 38.2,
            thresholdMaxM3s: 45.0,
          },
        ],
        totalInflowM3s: +totalInflowM3s.toFixed(2),
        anomalyCount,
      });
    } catch (error: any) {
      console.error("Telemetry error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch telemetry data" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const {
        structureId,
        sourceOrigin,
        dischargeM3s,
        gateOpeningPercent,
        waterLevelM,
        turbidityNtu,
        notes,
      } = data;

      const discharge = parseFloat(dischargeM3s || "0");
      const gateOpen = parseFloat(gateOpeningPercent || "0");
      const waterLevel = parseFloat(waterLevelM || "0");
      const turbidity = turbidityNtu ? parseFloat(turbidityNtu) : null;

      // Anomaly detection rules
      let anomalyDetected = false;
      let anomalyReason: string | null = null;

      if (sourceOrigin === "ODDAR_MEANCHEY_PLATEAU" && discharge > 40.0) {
        anomalyDetected = true;
        anomalyReason = `High plateau runoff detected: ${discharge} m³/s exceeds watch threshold (40.0 m³/s). Possible flash surge from Dangrek range.`;
      } else if (sourceOrigin === "CROSS_BORDER_THAILAND" && discharge > 35.0) {
        anomalyDetected = true;
        anomalyReason = `Cross-border inflow surge from Thailand: ${discharge} m³/s exceeds normal upper limit (35.0 m³/s).`;
      } else if (waterLevel > 5.2) {
        anomalyDetected = true;
        anomalyReason = `Critical water level reached: ${waterLevel}m exceeds safety margin (5.2m).`;
      }

      // Log telemetry
      const log = await prisma.inflowTelemetryLog.create({
        data: {
          basinId: basin.id,
          structureId: structureId ? parseInt(String(structureId), 10) : null,
          sourceOrigin: sourceOrigin || "STUENG_TMAR_POUK_MAIN",
          dischargeM3s: discharge,
          gateOpeningPercent: gateOpen,
          waterLevelM: waterLevel,
          turbidityNtu: turbidity,
          anomalyDetected,
          anomalyReason,
          notes: notes || null,
        },
      });

      // Update structure if structureId provided
      if (structureId) {
        await prisma.hydraulicStructure.update({
          where: { id: parseInt(String(structureId), 10) },
          data: {
            currentGateOpeningPercent: gateOpen,
            currentDischargeM3s: discharge,
            upstreamWaterLevelM: waterLevel,
            status: anomalyDetected ? "ALERT" : "OPERATIONAL",
          },
        });
      }

      // If high surge anomaly detected, automatically record or update active FloodSurgeAlert
      if (anomalyDetected && discharge >= 50.0) {
        await prisma.floodSurgeAlert.create({
          data: {
            basinId: basin.id,
            alertLevel: discharge >= 80 ? "EMERGENCY_CRITICAL" : "WARNING",
            sourceLocation: sourceOrigin || "Highland Inflow",
            peakInflowM3s: discharge,
            diversionPlanKh: `ស្វ័យប្រវត្តិតាមការចាប់សញ្ញា៖ លំហូរទឹកកើនឡើងដល់ ${discharge} m³/s។ បើកទ្វារពង្វាង WEIR-01/02 ៨០% និងបញ្ជូនទឹកលើសទៅកាន់អាងត្រពាំងថ្មដើម្បីកាត់បន្ថយគ្រោះទឹកជំនន់ ៨០%។`,
            riskReductionPercent: 80.0,
            activeAlert: true,
          },
        });
      }

      return res.status(201).json({ success: true, log, anomalyDetected, anomalyReason });
    } catch (error: any) {
      console.error("Telemetry insert error:", error);
      return res.status(500).json({ error: error?.message || "Failed to record telemetry" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
