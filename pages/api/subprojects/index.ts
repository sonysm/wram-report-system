import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

function toFloat(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function toInt(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const num = Math.round(Number(val));
  return isNaN(num) ? null : num;
}

function cleanStr(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const { provinceId, status, search } = req.query;

      let targetProvinceId: number | undefined;
      if (user.role === "admin") {
        if (provinceId && provinceId !== "all") targetProvinceId = Number(provinceId);
      } else {
        if (!user.provinceId) {
          return res.status(403).json({ error: "User has no province assigned" });
        }
        targetProvinceId = user.provinceId;
      }

      const whereClause: any = {};
      if (targetProvinceId) {
        whereClause.provinceId = targetProvinceId;
      }
      if (status && typeof status === "string" && status.trim() !== "" && status !== "ALL") {
        whereClause.status = status.trim();
      }
      if (search && typeof search === "string" && search.trim() !== "") {
        const query = search.trim();
        whereClause.OR = [
          { subprojectName: { contains: query, mode: "insensitive" } },
          { subprojectEnglishName: { contains: query, mode: "insensitive" } },
          { subprojectCode: { contains: query, mode: "insensitive" } },
          { riverBasinName: { contains: query, mode: "insensitive" } },
        ];
      }

      const subprojects = await prisma.subprojectPlan.findMany({
        where: whereClause,
        include: {
          province: { select: { id: true, name: true, khmerName: true, sortOrder: true } },
          district: { select: { id: true, name: true, khmerName: true } },
          commune: { select: { id: true, name: true, khmerName: true } },
          user: { select: { id: true, username: true } },
        },
        orderBy: [
          { province: { sortOrder: "asc" } },
          { updatedAt: "desc" },
        ],
      });

      return res.status(200).json(subprojects);
    } catch (error: any) {
      console.error("Get subprojects error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch subprojects" });
    }
  }

  if (req.method === "POST") {
    try {
      const d = req.body;
      const provinceId = user.role === "admin" && d.provinceId ? Number(d.provinceId) : user.provinceId;

      if (!provinceId) {
        return res.status(400).json({ error: "សូមជ្រើសរើសខេត្ត (Province is required)" });
      }
      if (!d.subprojectName || typeof d.subprojectName !== "string" || !d.subprojectName.trim()) {
        return res.status(400).json({ error: "ឈ្មោះអនុគម្រោងត្រូវបានទាមទារ (Subproject name is required)" });
      }

      // Generate a subproject code if not provided
      let subprojectCode = cleanStr(d.subprojectCode);
      if (!subprojectCode) {
        const count = await prisma.subprojectPlan.count({ where: { provinceId } });
        const prov = await prisma.province.findUnique({ where: { id: provinceId }, select: { code: true, name: true } });
        const prefix = prov?.code ? prov.code.replace(/[^A-Za-z0-9]/g, "") : `P${provinceId}`;
        subprojectCode = `SP-${prefix}-${String(count + 1).padStart(3, "0")}`;
      }

      const newPlan = await prisma.subprojectPlan.create({
        data: {
          subprojectCode,
          subprojectName: d.subprojectName.trim(),
          subprojectEnglishName: cleanStr(d.subprojectEnglishName),
          provinceId,
          districtId: toInt(d.districtId),
          communeId: toInt(d.communeId),
          userId: user.id,
          status: cleanStr(d.status) || "PROPOSED",

          // Chapter 1: Subproject Location
          riverBasinName: cleanStr(d.riverBasinName) || "",
          coordinateX: toFloat(d.coordinateX),
          coordinateY: toFloat(d.coordinateY),
          latitude: toFloat(d.latitude),
          longitude: toFloat(d.longitude),
          keyLocationsDescription: cleanStr(d.keyLocationsDescription),

          // Chapter 2: Overview of River Basin
          catchmentRainfallSource: cleanStr(d.catchmentRainfallSource),
          mainRiverLengthKm: toFloat(d.mainRiverLengthKm),
          tributaryLengthKm: toFloat(d.tributaryLengthKm),
          existingDrySeasonAreaHa: toFloat(d.existingDrySeasonAreaHa),
          existingWetSeasonAreaHa: toFloat(d.existingWetSeasonAreaHa),
          postProjectDrySeasonAreaHa: toFloat(d.postProjectDrySeasonAreaHa),
          postProjectWetSeasonAreaHa: toFloat(d.postProjectWetSeasonAreaHa),
          avgLandPerPersonHa: toFloat(d.avgLandPerPersonHa),
          basinOverviewDescription: cleanStr(d.basinOverviewDescription),
          basinPlannedInvestments: cleanStr(d.basinPlannedInvestments),
          riverBasinCommitteeStatus: cleanStr(d.riverBasinCommitteeStatus),

          // Chapter 3: Overview of Proposed Subproject and Studies Carried Out
          proposedComponentsSummary: cleanStr(d.proposedComponentsSummary),
          riverRestorationLengthKm: toFloat(d.riverRestorationLengthKm),
          streamRestorationLengthKm: toFloat(d.streamRestorationLengthKm),
          weirsCount: toInt(d.weirsCount),
          distributionStructuresCount: toInt(d.distributionStructuresCount),
          mainCanalsCount: toInt(d.mainCanalsCount),
          mainCanalsLengthKm: toFloat(d.mainCanalsLengthKm),
          secondaryCanalsCount: toInt(d.secondaryCanalsCount),
          secondaryCanalsLengthKm: toFloat(d.secondaryCanalsLengthKm),
          commandAreaEstimateHa: toFloat(d.commandAreaEstimateHa),
          pastOrOngoingStudies: cleanStr(d.pastOrOngoingStudies),

          // Chapter 4: Description of Existing Infrastructure
          existingInfraDescription: cleanStr(d.existingInfraDescription),
          existingCanalsCondition: cleanStr(d.existingCanalsCondition),
          existingReservoirsCondition: cleanStr(d.existingReservoirsCondition),
          existingDrainageCondition: cleanStr(d.existingDrainageCondition),
          existingFloodEmbankments: cleanStr(d.existingFloodEmbankments),
          existingRoadsCondition: cleanStr(d.existingRoadsCondition),
          otherExistingInfra: cleanStr(d.otherExistingInfra),

          // Chapter 5: Description of Command Area of Subproject
          climateDescription: cleanStr(d.climateDescription),
          soilAndTopography: cleanStr(d.soilAndTopography),
          surfaceWaterResources: cleanStr(d.surfaceWaterResources),
          groundwaterResources: cleanStr(d.groundwaterResources),
          landUseDescription: cleanStr(d.landUseDescription),
          cropPatternAndSeasonality: cleanStr(d.cropPatternAndSeasonality),
          farmSizeAndTenure: cleanStr(d.farmSizeAndTenure),
          fwucStatusAndInstitutions: cleanStr(d.fwucStatusAndInstitutions),
          farmingPracticesAndPumping: cleanStr(d.farmingPracticesAndPumping),

          // Chapter 6: Subproject Rationale and Integration into Basin Plan
          subprojectRationale: cleanStr(d.subprojectRationale),
          constraintsAddressed: cleanStr(d.constraintsAddressed),
          expectedBenefits: cleanStr(d.expectedBenefits),
          integrationIntoBasinPlan: cleanStr(d.integrationIntoBasinPlan),

          // Chapter 7: Proposed Modernisation
          modernizationCanalDistribution: cleanStr(d.modernizationCanalDistribution),
          pipeDistributionSystems: cleanStr(d.pipeDistributionSystems),
          floodManagementDrainage: cleanStr(d.floodManagementDrainage),
          inspectionAccessRoads: cleanStr(d.inspectionAccessRoads),
          managementEquipmentFacilities: cleanStr(d.managementEquipmentFacilities),
          agriculturalSupportServices: cleanStr(d.agriculturalSupportServices),
          institutionalSustainabilityOandM: cleanStr(d.institutionalSustainabilityOandM),

          // Chapter 8: Indicative Costs
          totalEstimatedCostUsd: toFloat(d.totalEstimatedCostUsd),
          costPerHectareUsd: toFloat(d.costPerHectareUsd),
          costBreakdownMajorItems: cleanStr(d.costBreakdownMajorItems),
          pumpingLiftMeters: toFloat(d.pumpingLiftMeters),
          pumpingDischargeLs: toFloat(d.pumpingDischargeLs),

          // Chapter 9: Stakeholder Consultations and Farmer Interest
          stakeholderConsultationsDetails: cleanStr(d.stakeholderConsultationsDetails),
          farmerInterestHighValueCrops: cleanStr(d.farmerInterestHighValueCrops),
          farmerInterestModernization: cleanStr(d.farmerInterestModernization),
          farmerFwucWillingness: cleanStr(d.farmerFwucWillingness),
          majorFarmerBenefits: cleanStr(d.majorFarmerBenefits),

          // Chapter 10: Safeguards
          resettlementImpacts: cleanStr(d.resettlementImpacts),
          lossOfAssetsImpacts: cleanStr(d.lossOfAssetsImpacts),
          environmentalImpactsProtection: cleanStr(d.environmentalImpactsProtection),
          safeguardMitigationMeasures: cleanStr(d.safeguardMitigationMeasures),

          // Attachments & Notes
          mapRiverBasinNotes: cleanStr(d.mapRiverBasinNotes),
          schematicRiverBasinNotes: cleanStr(d.schematicRiverBasinNotes),
          mapSubprojectNotes: cleanStr(d.mapSubprojectNotes),
          additionalAttachmentsNotes: cleanStr(d.additionalAttachmentsNotes),
        },
        include: {
          province: { select: { id: true, name: true, khmerName: true } },
          district: { select: { id: true, name: true, khmerName: true } },
          commune: { select: { id: true, name: true, khmerName: true } },
          user: { select: { id: true, username: true } },
        },
      });

      return res.status(201).json(newPlan);
    } catch (error: any) {
      console.error("Create subproject plan error:", error);
      return res.status(500).json({ error: error?.message || "Failed to create subproject plan" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

