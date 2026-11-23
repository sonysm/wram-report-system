import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import {
  DEPARTMENT_LEADERSHIP_POSITIONS,
  getPositionRank,
} from "../../../lib/staffConstants";

function parseOptionalDate(value: unknown): Date | null {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getActiveAuthPayload(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const requestedProvinceId = req.query.provinceId
        ? Number(req.query.provinceId)
        : null;

      if (user.role !== "admin" && !user.provinceId) {
        return res.status(403).json({ error: "User is not assigned to a province" });
      }

      const whereClause =
        user.role === "admin"
          ? requestedProvinceId && !Number.isNaN(requestedProvinceId)
            ? { provinceId: requestedProvinceId }
            : undefined
          : { provinceId: user.provinceId! };

      const staffList = await prisma.staff.findMany({
        where: whereClause,
        include: {
          province: {
            select: { id: true, name: true, khmerName: true, sortOrder: true },
          },
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: [{ province: { sortOrder: "asc" } }, { createdAt: "desc" }],
      });

      // Sort within province by position hierarchy, then fullName
      staffList.sort((a, b) => {
        const provSortA = a.province?.sortOrder ?? 999;
        const provSortB = b.province?.sortOrder ?? 999;
        if (provSortA !== provSortB) return provSortA - provSortB;

        const rankA = getPositionRank(a.position);
        const rankB = getPositionRank(b.position);
        if (rankA !== rankB) return rankA - rankB;

        return a.fullName.localeCompare(b.fullName, "km");
      });

      return res.status(200).json(staffList);
    } catch (error) {
      console.error("Failed to fetch staff list:", error);
      return res.status(500).json({ error: "Failed to fetch staff list" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body ?? {};
      const provinceId =
        user.role === "admin" ? Number(body.provinceId) : user.provinceId;

      if (!provinceId || Number.isNaN(provinceId)) {
        return res.status(400).json({ error: "Province is required" });
      }

      const fullName = cleanString(body.fullName);
      const position = cleanString(body.position);
      const educationLevel = cleanString(body.educationLevel);
      const skill = cleanString(body.skill);

      if (!fullName || !position || !educationLevel || !skill) {
        return res.status(400).json({
          error: "សូមបំពេញ គោត្តនាម និងនាម, តួនាទី, កម្រិតសិក្សា និងជំនាញ",
        });
      }

      const isDeptLeadership = (
        DEPARTMENT_LEADERSHIP_POSITIONS as readonly string[]
      ).includes(position);

      const office = isDeptLeadership
        ? cleanString(body.office) || null
        : cleanString(body.office);

      const created = await prisma.staff.create({
        data: {
          provinceId,
          userId: user.id,
          fullName,
          latinName: cleanString(body.latinName),
          gender: cleanString(body.gender) || "ប្រុស",
          dateOfBirth: parseOptionalDate(body.dateOfBirth),
          phoneNumber: cleanString(body.phoneNumber),
          email: cleanString(body.email),
          civilServantId: cleanString(body.civilServantId),
          position,
          office,
          civilServantRank: cleanString(body.civilServantRank),
          educationLevel,
          skill,
          majorDetail: cleanString(body.majorDetail),
          startWorkDate: parseOptionalDate(body.startWorkDate),
          assignedLocation: cleanString(body.assignedLocation),
          trainingNotes: cleanString(body.trainingNotes),
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
          note: cleanString(body.note),
        },
        include: {
          province: {
            select: { id: true, name: true, khmerName: true, sortOrder: true },
          },
          user: {
            select: { id: true, username: true },
          },
        },
      });

      return res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create staff:", error);
      return res.status(500).json({ error: "Failed to create staff" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
