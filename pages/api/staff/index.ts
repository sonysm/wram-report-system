import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import {
  DEPARTMENT_LEADERSHIP_POSITIONS,
  getHighestEducationLevel,
  getPositionRank,
} from "../../../lib/staffConstants";
import {
  STAFF_INCLUDE,
  cleanString,
  parseOptionalDate,
  sanitizeEducations,
  sanitizeExperiences,
  sanitizeTrainings,
} from "../../../lib/staffPayload";

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
        include: STAFF_INCLUDE,
        orderBy: [{ province: { sortOrder: "asc" } }, { createdAt: "desc" }],
      });

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
      const skill = cleanString(body.skill);
      const educations = sanitizeEducations(body.educations);
      const experiences = sanitizeExperiences(body.experiences);
      const trainings = sanitizeTrainings(body.trainings);

      const highestFromList = getHighestEducationLevel(educations.map((e) => e.level));
      const educationLevel = cleanString(body.educationLevel) || highestFromList;

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
          educationLevel: highestFromList || educationLevel,
          skill,
          majorDetail: cleanString(body.majorDetail),
          startWorkDate: parseOptionalDate(body.startWorkDate),
          assignedLocation: cleanString(body.assignedLocation),
          trainingNotes: cleanString(body.trainingNotes),
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
          note: cleanString(body.note),
          experiences: experiences.length > 0 ? { create: experiences } : undefined,
          educations: educations.length > 0 ? { create: educations } : undefined,
          trainings: trainings.length > 0 ? { create: trainings } : undefined,
        },
        include: STAFF_INCLUDE,
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
