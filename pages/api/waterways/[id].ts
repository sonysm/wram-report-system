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

  const { id } = req.query;
  const waterwayId = Number(id);

  if (!waterwayId || isNaN(waterwayId)) {
    return res.status(400).json({ error: "Invalid waterway ID" });
  }

  const existing = await prisma.waterway.findUnique({
    where: { id: waterwayId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Waterway not found" });
  }

  if (user.role !== "admin" && existing.provinceId !== user.provinceId) {
    return res.status(403).json({ error: "Forbidden: You can only modify data for your province" });
  }

  if (req.method === "PUT") {
    try {
      const data = req.body;
      const provinceId = user.role === "admin" && data.provinceId ? Number(data.provinceId) : existing.provinceId;

      if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
        return res.status(400).json({ error: "ឈ្មោះ ត្រូវបានទាមទារ (Name is required)" });
      }

      const updated = await prisma.waterway.update({
        where: { id: waterwayId },
        data: {
          provinceId,
          type: data.type ? String(data.type).trim() : existing.type,
          name: data.name ? String(data.name).trim() : existing.name,
          length: data.length !== undefined ? toFloat(data.length) : existing.length,

          // Upstream
          upstreamDistrictId: data.upstreamDistrictId !== undefined ? toInt(data.upstreamDistrictId) : existing.upstreamDistrictId,
          upstreamCommuneId: data.upstreamCommuneId !== undefined ? toInt(data.upstreamCommuneId) : existing.upstreamCommuneId,
          upstreamLocationX: data.upstreamLocationX !== undefined ? (data.upstreamLocationX ? String(data.upstreamLocationX).trim() : null) : existing.upstreamLocationX,
          upstreamLocationY: data.upstreamLocationY !== undefined ? (data.upstreamLocationY ? String(data.upstreamLocationY).trim() : null) : existing.upstreamLocationY,
          upstreamWidth: data.upstreamWidth !== undefined ? toFloat(data.upstreamWidth) : existing.upstreamWidth,
          upstreamElevation: data.upstreamElevation !== undefined ? toFloat(data.upstreamElevation) : existing.upstreamElevation,

          // Downstream
          downstreamDistrictId: data.downstreamDistrictId !== undefined ? toInt(data.downstreamDistrictId) : existing.downstreamDistrictId,
          downstreamCommuneId: data.downstreamCommuneId !== undefined ? toInt(data.downstreamCommuneId) : existing.downstreamCommuneId,
          downstreamLocationX: data.downstreamLocationX !== undefined ? (data.downstreamLocationX ? String(data.downstreamLocationX).trim() : null) : existing.downstreamLocationX,
          downstreamLocationY: data.downstreamLocationY !== undefined ? (data.downstreamLocationY ? String(data.downstreamLocationY).trim() : null) : existing.downstreamLocationY,
          downstreamWidth: data.downstreamWidth !== undefined ? toFloat(data.downstreamWidth) : existing.downstreamWidth,
          downstreamElevation: data.downstreamElevation !== undefined ? toFloat(data.downstreamElevation) : existing.downstreamElevation,

          note: data.note !== undefined ? (data.note ? String(data.note).trim() : null) : existing.note,
        },
        include: {
          province: { select: { id: true, name: true, khmerName: true } },
          upstreamDistrict: { select: { id: true, name: true, khmerName: true } },
          upstreamCommune: { select: { id: true, name: true, khmerName: true } },
          downstreamDistrict: { select: { id: true, name: true, khmerName: true } },
          downstreamCommune: { select: { id: true, name: true, khmerName: true } },
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      console.error("Update waterway error:", error);
      return res.status(500).json({ error: error?.message || "Failed to update waterway" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.waterway.delete({
        where: { id: waterwayId },
      });
      return res.status(204).end();
    } catch (error: any) {
      console.error("Delete waterway error:", error);
      return res.status(500).json({ error: error?.message || "Failed to delete waterway" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
