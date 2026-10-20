import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

// Helper to check if point is inside a bounding box
function isInsideBoundingBox(
  x: number | null,
  y: number | null,
  lat: number | null,
  lng: number | null,
  zone: { minX: number; maxX: number; minY: number; maxY: number; minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  if (x !== null && y !== null) {
    if (x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY) {
      return true;
    }
  }
  if (lat !== null && lng !== null) {
    if (lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng) {
      return true;
    }
  }
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const basin = await prisma.basin.findFirst({
    where: { code: "BASIN-TMP-01" },
    include: {
      protectedZones: true,
    },
  });

  if (!basin) {
    return res.status(404).json({ error: "Stueng Tmar Pouk Sub-basin not found." });
  }

  if (req.method === "GET") {
    try {
      const { assetType, status } = req.query;

      // 1. Get 4 Diversion Weirs
      const weirs = await prisma.hydraulicStructure.findMany({
        where: { basinId: basin.id, structureType: "DIVERSION_WEIR" },
        include: {
          district: { select: { id: true, name: true, khmerName: true } },
        },
        orderBy: { code: "asc" },
      });

      // 2. Get 16 Control Structures
      const controlStructures = await prisma.hydraulicStructure.findMany({
        where: { basinId: basin.id, structureType: { not: "DIVERSION_WEIR" } },
        include: {
          district: { select: { id: true, name: true, khmerName: true } },
        },
        orderBy: { code: "asc" },
      });

      // 3. Get 16 Main Canals with child secondary canals (Asset Hierarchy Graph)
      const mainCanals = await prisma.canal.findMany({
        where: { basinId: basin.id, canalType: "MAIN" },
        include: {
          parentStructure: { select: { id: true, code: true, name: true, khmerName: true } },
          subCanals: {
            orderBy: { code: "asc" },
          },
        },
        orderBy: { code: "asc" },
      });

      // 4. Inspection tickets
      const whereTicket: any = { basinId: basin.id };
      if (assetType && typeof assetType === "string") whereTicket.assetType = assetType;
      if (status && typeof status === "string") whereTicket.status = status;

      const tickets = await prisma.assetInspectionTicket.findMany({
        where: whereTicket,
        include: {
          canal: { select: { id: true, code: true, name: true, khmerName: true } },
          structure: { select: { id: true, code: true, name: true, khmerName: true } },
          reportedByUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Stats
      const totalCanalsCount = mainCanals.length + mainCanals.reduce((sum, mc) => sum + mc.subCanals.length, 0);
      const liningIssuesCount = tickets.filter((t) => t.defectCategory === "LINING_INTEGRITY").length;
      const roadIssuesCount = tickets.filter((t) => t.defectCategory === "ROAD_DAMAGE").length;
      const rejectedSafeguardCount = tickets.filter((t) => !t.safeguardValidationPassed).length;

      return res.status(200).json({
        weirs,
        controlStructures,
        mainCanals,
        tickets,
        protectedZones: basin.protectedZones,
        summary: {
          weirCount: weirs.length,
          controlStructureCount: controlStructures.length,
          mainCanalCount: mainCanals.length,
          secondaryCanalCount: totalCanalsCount - mainCanals.length,
          totalCanalsCount,
          liningIssuesCount,
          roadIssuesCount,
          rejectedSafeguardCount,
        },
      });
    } catch (error: any) {
      console.error("Assets API error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch asset inventory" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const {
        action,
        ticketId,
        canalId,
        structureId,
        assetType,
        defectCategory,
        severity,
        locationX,
        locationY,
        latitude,
        longitude,
        description,
        actionTaken,
        newStatus,
      } = data;

      // Update existing ticket status
      if (action === "UPDATE_STATUS" && ticketId) {
        const updated = await prisma.assetInspectionTicket.update({
          where: { id: parseInt(String(ticketId), 10) },
          data: {
            status: newStatus || "REPAIRED",
            actionTaken: actionTaken || null,
          },
        });
        return res.status(200).json({ success: true, ticket: updated });
      }

      // Geospatial Safeguard Check:
      // Verify if coordinates overlap with any declared protected forest or conservation zone!
      const parsedX = locationX ? parseFloat(String(locationX)) : null;
      const parsedY = locationY ? parseFloat(String(locationY)) : null;
      const parsedLat = latitude ? parseFloat(String(latitude)) : null;
      const parsedLng = longitude ? parseFloat(String(longitude)) : null;

      let insideProtectedZone = false;
      let protectedZoneName: string | null = null;
      let safeguardValidationPassed = true;
      let initialStatus = "REPORTED";

      for (const zone of basin.protectedZones) {
        if (isInsideBoundingBox(parsedX, parsedY, parsedLat, parsedLng, zone)) {
          insideProtectedZone = true;
          protectedZoneName = zone.zoneName;
          safeguardValidationPassed = false;
          initialStatus = "REJECTED_PROTECTED_ZONE";
          break;
        }
      }

      const ticketCount = await prisma.assetInspectionTicket.count();
      const ticketNumber = `TCK-TMP-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(3, "0")}`;

      const ticket = await prisma.assetInspectionTicket.create({
        data: {
          ticketNumber,
          basinId: basin.id,
          canalId: canalId ? parseInt(String(canalId), 10) : null,
          structureId: structureId ? parseInt(String(structureId), 10) : null,
          assetType: assetType || "CANAL",
          defectCategory: defectCategory || "LINING_INTEGRITY",
          severity: severity || "MEDIUM",
          status: initialStatus,
          locationX: parsedX,
          locationY: parsedY,
          latitude: parsedLat,
          longitude: parsedLng,
          insideProtectedZone,
          protectedZoneName,
          safeguardValidationPassed,
          description: description || "Inspection ticket logged.",
          actionTaken: insideProtectedZone
            ? `ស្វ័យប្រវត្តិតាមប្រព័ន្ធសុវត្ថិភាពបរិស្ថាន៖ បដិសេធដាច់ខាតដោយសាររំលោភលើដែនជម្រក ${protectedZoneName} (Geospatial Environmental Safeguard Protection Activated)។`
            : actionTaken || null,
          reportedByUserId: user.id || null,
        },
      });

      return res.status(201).json({
        success: true,
        ticket,
        safeguardAlert: insideProtectedZone ? {
          triggered: true,
          zoneName: protectedZoneName,
          message: `ការព្រមានសុវត្ថិភាពបរិស្ថាន៖ ទីតាំងសំណើស្ថិតនៅក្នុងដែនជម្រកអភិរក្ស (${protectedZoneName})។ ប្រព័ន្ធបានបដិសេធប័ណ្ណការងារដោយស្វ័យប្រវត្តិ។`,
        } : null,
      });
    } catch (error: any) {
      console.error("Create inspection ticket error:", error);
      return res.status(500).json({ error: error?.message || "Failed to create inspection ticket" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
