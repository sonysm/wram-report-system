import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import type { AuthTokenPayload } from "../../lib/auth";
import { getActiveAuthPayload } from "../../lib/requestAuth";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseInteger(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    return null;
  }

  if (parsed < 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeNumber(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null || parsed < 0) {
    return null;
  }

  return parsed;
}

function resolveProvinceScope(authUser: AuthTokenPayload, rawProvinceId: unknown): number | null {
  const requestedProvinceId = parseInteger(rawProvinceId);

  if (authUser.role === "admin") {
    return requestedProvinceId ?? authUser.provinceId;
  }

  if (!authUser.provinceId) {
    return null;
  }

  if (requestedProvinceId !== null && requestedProvinceId !== authUser.provinceId) {
    return null;
  }

  return authUser.provinceId;
}

function parseRecordFields(rawBody: unknown): {
  planArea: number;
  planDone: number;
  actualArea: number;
  interventionArea: number;
  householdPlan: number;
  householdDone: number;
  unsalvageableArea: number;
  waterSource: string;
  note: string | null;
} {
  const body = typeof rawBody === "object" && rawBody !== null ? (rawBody as Record<string, unknown>) : {};

  const planArea = parseNonNegativeNumber(body.planArea);
  const planDone = parseNonNegativeNumber(body.planDone);

  if (planArea === null || planDone === null) {
    throw new Error("Plan area and plan done are required as non-negative numbers");
  }

  const actualArea = parseNonNegativeNumber(body.actualArea) ?? 0;
  const interventionArea = parseNonNegativeNumber(body.interventionArea) ?? 0;
  const householdPlan = parseNonNegativeNumber(body.householdPlan) ?? 0;
  const householdDone = parseNonNegativeNumber(body.householdDone) ?? 0;
  const unsalvageableArea = parseNonNegativeNumber(body.unsalvageableArea) ?? 0;
  const waterSource = normalizeText(body.waterSource);
  const noteText = normalizeText(body.note);

  if (!waterSource) {
    throw new Error("Water source is required");
  }

  return {
    planArea,
    planDone,
    actualArea,
    interventionArea,
    householdPlan,
    householdDone,
    unsalvageableArea,
    waterSource,
    note: noteText ? noteText : null,
  };
}

async function writeAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: number;
  entryId?: number;
  provinceId?: number | null;
  actor: AuthTokenPayload;
  changes: object;
}) {
  const { action, entityType, entityId, entryId, provinceId, actor, changes } = params;

  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      entryId,
      provinceId: provinceId ?? null,
      actorUserId: actor.isDemo ? null : actor.id,
      actorUsername: actor.username,
      changes,
    },
  });
}

async function resolveDistrict(params: {
  provinceId: number;
  districtIdRaw: unknown;
  districtNameRaw: unknown;
  actor: AuthTokenPayload;
}) {
  const { provinceId, districtIdRaw, districtNameRaw, actor } = params;
  const districtId = parseInteger(districtIdRaw);
  const districtName = normalizeText(districtNameRaw);

  if (districtId !== null) {
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district || district.provinceId !== provinceId) {
      throw new Error("Selected district does not belong to your province");
    }
    return district;
  }

  if (!districtName) {
    throw new Error("Please select a district or enter a new district name");
  }

  const existing = await prisma.district.findFirst({
    where: {
      provinceId,
      name: { equals: districtName, mode: "insensitive" },
    },
  });

  if (existing) {
    return existing;
  }

  const created = await prisma.district.create({
    data: {
      name: districtName,
      provinceId,
      createdByUserId: actor.isDemo ? null : actor.id,
    },
  });

  await writeAuditLog({
    action: "DISTRICT_CREATE",
    entityType: "District",
    entityId: created.id,
    provinceId,
    actor,
    changes: {
      districtName: created.name,
      createdFrom: "entry-form",
    },
  });

  return created;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await getActiveAuthPayload(req);
  if (!authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const provinceId = resolveProvinceScope(authUser, req.body?.provinceId);
    if (!provinceId) {
      return res.status(403).json({ error: "This account cannot submit without a province" });
    }

    try {
      const fields = parseRecordFields(req.body);
      const district = await resolveDistrict({
        provinceId,
        districtIdRaw: req.body?.districtId,
        districtNameRaw: req.body?.districtName,
        actor: authUser,
      });

      const entry = await prisma.entry.create({
        data: {
          category: null,
          value: null,
          planArea: fields.planArea,
          planDone: fields.planDone,
          actualArea: fields.actualArea,
          interventionArea: fields.interventionArea,
          householdPlan: fields.householdPlan,
          householdDone: fields.householdDone,
          unsalvageableArea: fields.unsalvageableArea,
          waterSource: fields.waterSource,
          note: fields.note,
          provinceId,
          districtId: district.id,
          userId: authUser.isDemo ? null : authUser.id,
        },
        include: {
          province: { select: { id: true, name: true, khmerName: true } },
          district: { select: { id: true, name: true } },
        },
      });

      await writeAuditLog({
        action: "ENTRY_CREATE",
        entityType: "Entry",
        entityId: entry.id,
        entryId: entry.id,
        provinceId,
        actor: authUser,
        changes: {
          after: {
            districtId: entry.districtId,
            planArea: entry.planArea,
            planDone: entry.planDone,
            actualArea: entry.actualArea,
            interventionArea: entry.interventionArea,
            householdPlan: entry.householdPlan,
            householdDone: entry.householdDone,
            unsalvageableArea: entry.unsalvageableArea,
            waterSource: entry.waterSource,
            note: entry.note,
          },
        },
      });

      return res.status(201).json({ entry });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  }

  if (req.method === "PUT") {
    const entryId = parseInteger(req.body?.id);
    if (!entryId) {
      return res.status(400).json({ error: "Entry id is required" });
    }

    const existing = await prisma.entry.findUnique({ where: { id: entryId } });
    if (!existing) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (authUser.role !== "admin" && existing.provinceId !== authUser.provinceId) {
      return res.status(403).json({ error: "You can only update entries from your own province" });
    }

    if (!existing.provinceId) {
      return res.status(400).json({ error: "Entry has no province and cannot be updated" });
    }

    try {
      const fields = parseRecordFields(req.body);
      const district = await resolveDistrict({
        provinceId: existing.provinceId,
        districtIdRaw: req.body?.districtId,
        districtNameRaw: req.body?.districtName,
        actor: authUser,
      });

      const updated = await prisma.entry.update({
        where: { id: entryId },
        data: {
          category: null,
          value: null,
          planArea: fields.planArea,
          planDone: fields.planDone,
          actualArea: fields.actualArea,
          interventionArea: fields.interventionArea,
          householdPlan: fields.householdPlan,
          householdDone: fields.householdDone,
          unsalvageableArea: fields.unsalvageableArea,
          waterSource: fields.waterSource,
          note: fields.note,
          districtId: district.id,
        },
        include: {
          province: { select: { id: true, name: true, khmerName: true } },
          district: { select: { id: true, name: true } },
        },
      });

      await writeAuditLog({
        action: "ENTRY_UPDATE",
        entityType: "Entry",
        entityId: updated.id,
        entryId: updated.id,
        provinceId: updated.provinceId,
        actor: authUser,
        changes: {
          before: {
            districtId: existing.districtId,
            planArea: existing.planArea,
            planDone: existing.planDone,
            actualArea: existing.actualArea,
            interventionArea: existing.interventionArea,
            householdPlan: existing.householdPlan,
            householdDone: existing.householdDone,
            unsalvageableArea: existing.unsalvageableArea,
            waterSource: existing.waterSource,
            note: existing.note,
          },
          after: {
            districtId: updated.districtId,
            planArea: updated.planArea,
            planDone: updated.planDone,
            actualArea: updated.actualArea,
            interventionArea: updated.interventionArea,
            householdPlan: updated.householdPlan,
            householdDone: updated.householdDone,
            unsalvageableArea: updated.unsalvageableArea,
            waterSource: updated.waterSource,
            note: updated.note,
          },
        },
      });

      return res.json({ entry: updated });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  }

  if (req.method === "GET") {
    const entries = await prisma.entry.findMany({
      where: authUser.role === "admin" ? {} : { provinceId: authUser.provinceId ?? -1 },
      include: {
        province: { select: { id: true, name: true, khmerName: true } },
        district: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return res.json({ entries });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
