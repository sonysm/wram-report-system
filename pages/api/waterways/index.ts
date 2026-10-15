import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import prisma from "../../../lib/db";

function toFloat(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function toInt(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const num = Math.round(Number(val));
  return isNaN(num) ? null : num;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const { provinceId, type, search } = req.query;

      let targetProvinceId: number | undefined;
      if (user.role === "admin") {
        if (provinceId) targetProvinceId = Number(provinceId);
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
      if (type && typeof type === "string" && type.trim() !== "") {
        whereClause.type = type.trim();
      }
      if (search && typeof search === "string" && search.trim() !== "") {
        whereClause.name = {
          contains: search.trim(),
          mode: "insensitive",
        };
      }

      const waterways = await prisma.waterway.findMany({
        where: whereClause,
        include: {
          province: { select: { id: true, name: true, khmerName: true, sortOrder: true } },
          upstreamDistrict: { select: { id: true, name: true, khmerName: true } },
          upstreamCommune: { select: { id: true, name: true, khmerName: true } },
          downstreamDistrict: { select: { id: true, name: true, khmerName: true } },
          downstreamCommune: { select: { id: true, name: true, khmerName: true } },
          user: { select: { id: true, username: true } },
        },
        orderBy: [
          { province: { sortOrder: "asc" } },
          { type: "asc" },
          { name: "asc" },
        ],
      });

      return res.status(200).json(waterways);
    } catch (error: any) {
      console.error("Get waterways error:", error);
      return res.status(500).json({ error: error?.message || "Failed to fetch waterways" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body;
      const provinceId = user.role === "admin" ? Number(data.provinceId) : user.provinceId;

      if (!provinceId) {
        return res.status(400).json({ error: "ខេត្ត ត្រូវបានទាមទារ (Province is required)" });
      }
      if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
        return res.status(400).json({ error: "ឈ្មោះទន្លេ/ស្ទឹង/ព្រែក/អូរ ត្រូវបានទាមទារ (Name is required)" });
      }
      if (!data.type || typeof data.type !== "string" || !data.type.trim()) {
        return res.status(400).json({ error: "ប្រភេទ ត្រូវបានទាមទារ (Type is required)" });
      }

      const newWaterway = await prisma.waterway.create({
        data: {
          provinceId,
          type: data.type.trim(),
          name: data.name.trim(),
          length: toFloat(data.length),

          // Upstream
          upstreamDistrictId: toInt(data.upstreamDistrictId),
          upstreamCommuneId: toInt(data.upstreamCommuneId),
          upstreamLocationX: data.upstreamLocationX ? String(data.upstreamLocationX).trim() : null,
          upstreamLocationY: data.upstreamLocationY ? String(data.upstreamLocationY).trim() : null,
          upstreamWidth: toFloat(data.upstreamWidth),
          upstreamElevation: toFloat(data.upstreamElevation),

          // Downstream
          downstreamDistrictId: toInt(data.downstreamDistrictId),
          downstreamCommuneId: toInt(data.downstreamCommuneId),
          downstreamLocationX: data.downstreamLocationX ? String(data.downstreamLocationX).trim() : null,
          downstreamLocationY: data.downstreamLocationY ? String(data.downstreamLocationY).trim() : null,
          downstreamWidth: toFloat(data.downstreamWidth),
          downstreamElevation: toFloat(data.downstreamElevation),

          note: data.note ? String(data.note).trim() : null,
          userId: user.id,
        },
        include: {
          province: { select: { id: true, name: true, khmerName: true } },
          upstreamDistrict: { select: { id: true, name: true, khmerName: true } },
          upstreamCommune: { select: { id: true, name: true, khmerName: true } },
          downstreamDistrict: { select: { id: true, name: true, khmerName: true } },
          downstreamCommune: { select: { id: true, name: true, khmerName: true } },
        },
      });

      return res.status(201).json(newWaterway);
    } catch (error: any) {
      console.error("Create waterway error:", error);
      return res.status(500).json({ error: error?.message || "Failed to create waterway" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
