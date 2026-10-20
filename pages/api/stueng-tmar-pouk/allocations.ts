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
      const allocations = await prisma.seasonalWaterAllocation.findMany({
        where: { basinId: basin.id },
        orderBy: [{ year: "desc" }, { startDate: "desc" }],
      });

      // Command Area Metrics
      const dryCapacityHa = basin.drySeasonCapacityHa; // 5,000 ha
      const wetCapacityHa = basin.wetSeasonCapacityHa; // 30,000 ha
      const avgParcelHa = basin.avgParcelAreaHa; // 5 ha / farmer

      // Crop Calendar Definitions
      const croppingCalendar = [
        {
          code: "S1_APR_JUL",
          titleKh: "រដូវទី១ (ដើមរដូវវស្សា / ស្រូវស្រាល)",
          titleEn: "Season 1 (Early Wet Season Rice)",
          startMonth: "April (មេសា)",
          endMonth: "July (កក្កដា)",
          targetAreaHa: 14000,
          waterRequirementM3PerHa: 7000,
          recommendedConveyance: "Open Canals (78%) + Pipe Systems (22%)",
        },
        {
          code: "S2_OCT_DEC",
          titleKh: "រដូវទី២ (ចុងរដូវវស្សា / ស្រូវកណ្តាល-ធ្ងន់)",
          titleEn: "Season 2 (Main Wet / Recession Rice)",
          startMonth: "October (តុលា)",
          endMonth: "December (ធ្នូ)",
          targetAreaHa: 30000,
          waterRequirementM3PerHa: 7000,
          recommendedConveyance: "Open Canals (75%) + Pipe Systems (25%)",
        },
        {
          code: "DRY_SEASON_EXPANSION",
          titleKh: "រដូវប្រាំង (ពង្រីកពី ៣,០០០ ហ.ត ទៅ ៥,០០០ ហ.ត)",
          titleEn: "Dry Season Intensification",
          startMonth: "January (មករា)",
          endMonth: "April (មេសា)",
          targetAreaHa: 5000,
          waterRequirementM3PerHa: 8500,
          recommendedConveyance: "High Efficiency Pressurized Pipes (30%) + Lined Canals (70%)",
        },
      ];

      return res.status(200).json({
        allocations,
        commandAreaScaling: {
          drySeasonCapacityHa: dryCapacityHa,
          wetSeasonCapacityHa: wetCapacityHa,
          avgParcelAreaHa: avgParcelHa,
          totalFarmersDry: Math.round(dryCapacityHa / avgParcelHa),
          totalFarmersWet: Math.round(wetCapacityHa / avgParcelHa),
        },
        croppingCalendar,
      });
    } catch (error: any) {
      console.error("Allocations error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch water allocations" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const {
        seasonName,
        year,
        cropSeasonCode,
        plannedAreaHa,
        allocatedWaterM3,
        dispatchedWaterM3,
        openCanalSharePercent,
        pipeDistributionSharePercent,
        startDate,
        endDate,
        status,
      } = data;

      if (!seasonName || !year || !cropSeasonCode || !plannedAreaHa) {
        return res.status(400).json({ error: "Missing required allocation parameters" });
      }

      const newAlloc = await prisma.seasonalWaterAllocation.create({
        data: {
          basinId: basin.id,
          seasonName,
          year: parseInt(String(year), 10),
          cropSeasonCode,
          plannedAreaHa: parseFloat(String(plannedAreaHa)),
          allocatedWaterM3: parseFloat(String(allocatedWaterM3 || (plannedAreaHa * 7000))),
          dispatchedWaterM3: parseFloat(String(dispatchedWaterM3 || 0)),
          openCanalSharePercent: parseFloat(String(openCanalSharePercent || 75.0)),
          pipeDistributionSharePercent: parseFloat(String(pipeDistributionSharePercent || 25.0)),
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now() + 90 * 24 * 3600 * 1000),
          status: status || "ACTIVE",
        },
      });

      return res.status(201).json({ success: true, allocation: newAlloc });
    } catch (error: any) {
      console.error("Create allocation error:", error);
      return res.status(500).json({ error: error?.message || "Failed to create allocation" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
