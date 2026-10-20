import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const basin = await prisma.basin.findFirst({
      where: { code: "BASIN-TMP-01" },
      include: {
        province: { select: { id: true, name: true, khmerName: true } },
        hydraulicStructures: {
          include: {
            district: { select: { id: true, name: true, khmerName: true } },
          },
          orderBy: { code: "asc" },
        },
        canals: {
          orderBy: { code: "asc" },
        },
        waterUserGroups: {
          include: {
            district: { select: { id: true, name: true, khmerName: true } },
            canal: { select: { id: true, code: true, name: true, khmerName: true } },
          },
        },
        seasonalAllocations: {
          orderBy: { year: "desc" },
        },
        floodSurgeAlerts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        inspectionTickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        protectedZones: true,
      },
    });

    if (!basin) {
      return res.status(404).json({ error: "Stueng Tmar Pouk Sub-basin not found. Please seed the database." });
    }

    // Aggregations
    const weirs = basin.hydraulicStructures.filter((s) => s.structureType === "DIVERSION_WEIR");
    const controlStructures = basin.hydraulicStructures.filter((s) => s.structureType !== "DIVERSION_WEIR");
    const mainCanals = basin.canals.filter((c) => c.canalType === "MAIN");
    const secondaryCanals = basin.canals.filter((c) => c.canalType !== "MAIN");

    const totalMainCanalLengthKm = mainCanals.reduce((sum, c) => sum + c.lengthKm, 0);
    const totalSecondaryCanalLengthKm = secondaryCanals.reduce((sum, c) => sum + c.lengthKm, 0);
    const avgConveyanceEfficiency = basin.canals.length
      ? +(basin.canals.reduce((sum, c) => sum + c.conveyanceEfficiencyPercent, 0) / basin.canals.length).toFixed(1)
      : 85.0;

    const currentTotalDischargeM3s = +weirs.reduce((sum, w) => sum + w.currentDischargeM3s, 0).toFixed(2);
    const activeAlertsCount = basin.floodSurgeAlerts.filter((a) => a.activeAlert).length;
    const openTicketsCount = basin.inspectionTickets.filter(
      (t) => t.status === "REPORTED" || t.status === "INVESTIGATING" || t.status === "WORK_ORDER_APPROVED"
    ).length;

    // Get telemetry recent logs count and latest logs
    const recentTelemetry = await prisma.inflowTelemetryLog.findMany({
      where: { basinId: basin.id },
      orderBy: { timestamp: "desc" },
      take: 6,
    });

    // ISC Billing Summary
    const billingRecords = await prisma.iscBillingRecord.findMany({
      where: { waterUserGroup: { basinId: basin.id } },
    });
    const totalBilledKhr = billingRecords.reduce((sum, b) => sum + b.totalAmountKhr, 0);
    const totalCollectedKhr = billingRecords.reduce((sum, b) => sum + b.collectedAmountKhr, 0);

    return res.status(200).json({
      basin,
      metrics: {
        weirCount: weirs.length,
        controlStructureCount: controlStructures.length,
        mainCanalCount: mainCanals.length,
        mainCanalLengthKm: +totalMainCanalLengthKm.toFixed(1),
        secondaryCanalCount: secondaryCanals.length,
        secondaryCanalLengthKm: +totalSecondaryCanalLengthKm.toFixed(1),
        avgConveyanceEfficiency,
        currentTotalDischargeM3s,
        drySeasonCapacityHa: basin.drySeasonCapacityHa,
        wetSeasonCapacityHa: basin.wetSeasonCapacityHa,
        avgParcelAreaHa: basin.avgParcelAreaHa,
        mainRiverLengthKm: basin.mainRiverLengthKm,
        tributaryLengthKm: basin.tributaryLengthKm,
        activeAlertsCount,
        openTicketsCount,
        totalBilledKhr,
        totalCollectedKhr,
        collectionRatePercent: totalBilledKhr ? +((totalCollectedKhr / totalBilledKhr) * 100).toFixed(1) : 0,
      },
      recentTelemetry,
      protectedZones: basin.protectedZones,
    });
  } catch (error: any) {
    console.error("Stueng Tmar Pouk overview error:", error);
    return res.status(500).json({ error: error?.message || "Failed to load sub-basin data" });
  }
}
