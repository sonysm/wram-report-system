import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/db";
import { getActiveAuthPayload } from "../../../lib/requestAuth";
import {
  DEPARTMENT_LEADERSHIP_POSITIONS,
  getHighestEducationLevel,
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

  const staffId = Number(req.query.id);
  if (Number.isNaN(staffId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Staff not found" });
  }

  if (user.role !== "admin" && existing.provinceId !== user.provinceId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "PUT") {
    try {
      const body = req.body ?? {};
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

      const targetProvinceId =
        user.role === "admin" && body.provinceId && !Number.isNaN(Number(body.provinceId))
          ? Number(body.provinceId)
          : existing.provinceId;

      const isDeptLeadership = (
        DEPARTMENT_LEADERSHIP_POSITIONS as readonly string[]
      ).includes(position);

      const office = isDeptLeadership
        ? cleanString(body.office) || null
        : cleanString(body.office);

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: {
          provinceId: targetProvinceId,
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
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
          note: cleanString(body.note),
          experiences: {
            deleteMany: {},
            create: experiences,
          },
          educations: {
            deleteMany: {},
            create: educations,
          },
          trainings: {
            deleteMany: {},
            create: trainings,
          },
        },
        include: STAFF_INCLUDE,
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error("Failed to update staff:", error);
      return res.status(500).json({ error: "Failed to update staff" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.staff.delete({
        where: { id: staffId },
      });
      return res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Failed to delete staff:", error);
      return res.status(500).json({ error: "Failed to delete staff" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
