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

  const { id } = req.query;
  const planId = Number(id);

  if (!planId || isNaN(planId)) {
    return res.status(400).json({ error: "Invalid subproject ID" });
  }

  const existing = await prisma.subprojectPlan.findUnique({
    where: { id: planId },
    include: {
      province: { select: { id: true, name: true, khmerName: true } },
      district: { select: { id: true, name: true, khmerName: true } },
      commune: { select: { id: true, name: true, khmerName: true } },
      user: { select: { id: true, username: true } },
    },
  });

  if (!existing) {
    return res.status(404).json({ error: "Subproject plan not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json(existing);
  }

  // Permission check for modifying
  if (user.role !== "admin" && existing.provinceId !== user.provinceId) {
    return res.status(403).json({ error: "Forbidden: You can only modify subproject plans for your province" });
  }

  if (req.method === "PUT") {
    try {
      const d = req.body;
      const provinceId = user.role === "admin" && d.provinceId ? Number(d.provinceId) : existing.provinceId;

      if (!d.subprojectName || typeof d.subprojectName !== "string" || !d.subprojectName.trim()) {
        return res.status(400).json({ error: "ឈ្មោះអនុគម្រោងត្រូវបានទាមទារ (Subproject name is required)" });
      }

      const updated = await prisma.subprojectPlan.update({
        where: { id: planId },
        data: {
          subprojectCode: cleanStr(d.subprojectCode) || existing.subprojectCode,
          subprojectName: d.subprojectName.trim(),
          subprojectEnglishName: cleanStr(d.subprojectEnglishName),
          provinceId,
          districtId: toInt(d.districtId),
          communeId: toInt(d.communeId),
          status: cleanStr(d.status) || existing.status,

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

      return res.status(200).json(updated);
    } catch (error: any) {
      console.error("Update subproject plan error:", error);
      return res.status(500).json({ error: error?.message || "Failed to update subproject plan" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.subprojectPlan.delete({
        where: { id: planId },
      });
      return res.status(204).end();
    } catch (error: any) {
      console.error("Delete subproject plan error:", error);
      return res.status(500).json({ error: error?.message || "Failed to delete subproject plan" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

