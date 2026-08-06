import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import type { AuthTokenPayload } from "../../lib/auth";
import { ensureProvincesSeeded } from "../../lib/provinces";
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
    if (parsed === null || !Number.isInteger(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
}

function parseNonNegative(value: unknown): number | null {
    const parsed = parseNumber(value);
    if (parsed === null || parsed < 0) {
        return null;
    }

    return parsed;
}

function calculateActualWater(totalWater: number, waterPercent: number): number {
    return (totalWater * waterPercent) / 100;
}

function resolveProvinceId(authUser: AuthTokenPayload, rawProvinceId: unknown): number | null {
    if (authUser.role !== "admin") {
        return authUser.provinceId;
    }

    const requested = parseInteger(rawProvinceId);
    return requested ?? authUser.provinceId;
}

async function resolveLocation(params: {
    provinceId: number;
    districtIdRaw: unknown;
    districtNameRaw: unknown;
    communeIdRaw: unknown;
    communeNameRaw: unknown;
    userId: number | null;
}) {
    const districtId = parseInteger(params.districtIdRaw);
    const districtNameInput = normalizeText(params.districtNameRaw);

    let resolvedDistrictId: number | null = null;
    let resolvedDistrictName: string;

    if (districtId !== null) {
        const district = await prisma.district.findUnique({ where: { id: districtId } });
        if (!district || district.provinceId !== params.provinceId) {
            throw new Error("Selected district does not belong to your province");
        }
        resolvedDistrictId = district.id;
        resolvedDistrictName = district.name;
    } else {
        if (!districtNameInput) {
            throw new Error("District name is required if district is not selected");
        }
        resolvedDistrictName = districtNameInput;
    }

    // Resolve commune — upsert to DB when a name is provided
    const communeId = parseInteger(params.communeIdRaw);
    const communeNameInput = normalizeText(params.communeNameRaw);
    let resolvedCommuneId: number | null = null;
    let resolvedCommuneName: string | null = null;

    if (communeId !== null) {
        const commune = await prisma.commune.findUnique({ where: { id: communeId } });
        if (commune) {
            resolvedCommuneId = commune.id;
            resolvedCommuneName = commune.name;
        }
    } else if (communeNameInput) {
        const existing = await prisma.commune.findFirst({
            where: {
                provinceId: params.provinceId,
                name: { equals: communeNameInput, mode: "insensitive" },
            },
        });
        if (existing) {
            resolvedCommuneId = existing.id;
            resolvedCommuneName = existing.name;
        } else {
            const newCommune = await prisma.commune.create({
                data: {
                    name: communeNameInput,
                    provinceId: params.provinceId,
                    districtId: resolvedDistrictId,
                    createdByUserId: params.userId,
                },
            });
            resolvedCommuneId = newCommune.id;
            resolvedCommuneName = newCommune.name;
        }
    }

    return {
        districtId: resolvedDistrictId,
        districtName: resolvedDistrictName,
        communeId: resolvedCommuneId,
        communeName: resolvedCommuneName,
    };
}

const ENTRY_INCLUDE = {
    district: { select: { id: true, name: true } },
    commune: { select: { id: true, name: true } },
    province: { select: { id: true, code: true, name: true, khmerName: true, postalCode: true, sortOrder: true } },
} as const;

async function loadEntriesForProvince(provinceId: number) {
    return prisma.provinceWaterEntry.findMany({
        where: { provinceId },
        include: ENTRY_INCLUDE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
}

async function loadAdminEntries(provinceId?: number | null) {
    return prisma.provinceWaterEntry.findMany({
        where: provinceId ? { provinceId } : undefined,
        include: ENTRY_INCLUDE,
        orderBy: [{ province: { sortOrder: "asc" } }, { provinceId: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    await ensureProvincesSeeded();

    if (req.method === "GET") {
        const provinceId = resolveProvinceId(authUser, req.query.provinceId);
        if (authUser.role === "admin") {
            const entries = await loadAdminEntries(provinceId);
            return res.json({ entries });
        }

        if (!provinceId) {
            return res.status(403).json({ error: "This account has no province assigned" });
        }

        const entries = await loadEntriesForProvince(provinceId);
        return res.json({ entries });
    }

    if (req.method === "POST") {
        const provinceId = resolveProvinceId(authUser, req.body?.provinceId);
        if (!provinceId) {
            return res.status(403).json({ error: "This account cannot submit without a province" });
        }

        try {
            const basinName = normalizeText(req.body?.basinName);
            const location = normalizeText(req.body?.location);
            const totalWater = parseNonNegative(req.body?.totalWater);
            const waterPercent = parseNonNegative(req.body?.waterPercent);
            const irrigatedDryArea = parseNonNegative(req.body?.irrigatedDryArea) ?? 0;
            const irrigatedWetArea = parseNonNegative(req.body?.irrigatedWetArea) ?? 0;
            const actualWater = parseNonNegative(req.body?.actualWater);
            const waterSource = normalizeText(req.body?.waterSource);
            const note = normalizeText(req.body?.note);

            if (!basinName) {
                throw new Error("Basin name is required");
            }
            if (!location) {
                throw new Error("Location is required");
            }
            if (totalWater === null || waterPercent === null) {
                throw new Error("Capacity and percentage must be non-negative numbers");
            }
            if (!waterSource) {
                throw new Error("Water source is required");
            }

            const calculatedActualWater = calculateActualWater(totalWater, waterPercent);

            const resolvedLocation = await resolveLocation({
                provinceId,
                districtIdRaw: req.body?.districtId,
                districtNameRaw: req.body?.districtName,
                communeIdRaw: req.body?.communeId,
                communeNameRaw: req.body?.communeName,
                userId: authUser.isDemo ? null : authUser.id,
            });

            const entry = await prisma.provinceWaterEntry.create({
                data: {
                    basinName,
                    location,
                    districtName: resolvedLocation.districtName,
                    communeName: resolvedLocation.communeName,
                    totalWater,
                    waterPercent,
                    actualWater: calculatedActualWater,
                    irrigatedDryArea,
                    irrigatedWetArea,
                    waterSource,
                    note: note || null,
                    provinceId,
                    districtId: resolvedLocation.districtId,
                    communeId: resolvedLocation.communeId,
                    userId: authUser.isDemo ? null : authUser.id,
                },
            });

            await prisma.auditLog.create({
                data: {
                    action: "WATER_ENTRY_CREATE",
                    entityType: "ProvinceWaterEntry",
                    entityId: entry.id,
                    actorUserId: authUser.isDemo ? null : authUser.id,
                    actorUsername: authUser.username,
                    provinceId,
                    changes: {
                        after: {
                            basinName: entry.basinName,
                            location: entry.location,
                            districtName: entry.districtName,
                            communeName: entry.communeName,
                            totalWater: entry.totalWater,
                            waterPercent: entry.waterPercent,
                            actualWater: entry.actualWater,
                            irrigatedDryArea: entry.irrigatedDryArea,
                            irrigatedWetArea: entry.irrigatedWetArea,
                            waterSource: entry.waterSource,
                        },
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

        const existing = await prisma.provinceWaterEntry.findUnique({ where: { id: entryId } });
        if (!existing) {
            return res.status(404).json({ error: "Entry not found" });
        }

        if (authUser.role !== "admin" && existing.provinceId !== authUser.provinceId) {
            return res.status(403).json({ error: "You can only update entries from your own province" });
        }

        try {
            const basinName = normalizeText(req.body?.basinName);
            const location = normalizeText(req.body?.location);
            const totalWater = parseNonNegative(req.body?.totalWater);
            const waterPercent = parseNonNegative(req.body?.waterPercent);
            const irrigatedDryArea = parseNonNegative(req.body?.irrigatedDryArea) ?? 0;
            const irrigatedWetArea = parseNonNegative(req.body?.irrigatedWetArea) ?? 0;
            const waterSource = normalizeText(req.body?.waterSource);
            const note = normalizeText(req.body?.note);

            if (!basinName) {
                throw new Error("Basin name is required");
            }
            if (!location) {
                throw new Error("Location is required");
            }
            if (totalWater === null || waterPercent === null) {
                throw new Error("Capacity and percentage must be non-negative numbers");
            }
            if (!waterSource) {
                throw new Error("Water source is required");
            }

            const calculatedActualWater = calculateActualWater(totalWater, waterPercent);

            const resolvedLocation = await resolveLocation({
                provinceId: existing.provinceId,
                districtIdRaw: req.body?.districtId,
                districtNameRaw: req.body?.districtName,
                communeIdRaw: req.body?.communeId,
                communeNameRaw: req.body?.communeName,
                userId: authUser.isDemo ? null : authUser.id,
            });

            const updated = await prisma.provinceWaterEntry.update({
                where: { id: entryId },
                data: {
                    basinName,
                    location,
                    districtName: resolvedLocation.districtName,
                    communeName: resolvedLocation.communeName,
                    totalWater,
                    waterPercent,
                    actualWater: calculatedActualWater,
                    irrigatedDryArea,
                    irrigatedWetArea,
                    waterSource,
                    note: note || null,
                    districtId: resolvedLocation.districtId,
                    communeId: resolvedLocation.communeId,
                },
            });

            await prisma.auditLog.create({
                data: {
                    action: "WATER_ENTRY_UPDATE",
                    entityType: "ProvinceWaterEntry",
                    entityId: updated.id,
                    actorUserId: authUser.isDemo ? null : authUser.id,
                    actorUsername: authUser.username,
                    provinceId: updated.provinceId,
                    changes: {
                        before: {
                            basinName: existing.basinName,
                            location: existing.location,
                            districtName: existing.districtName,
                            communeName: existing.communeName,
                            totalWater: existing.totalWater,
                            waterPercent: existing.waterPercent,
                            actualWater: existing.actualWater,
                            irrigatedDryArea: existing.irrigatedDryArea,
                            irrigatedWetArea: existing.irrigatedWetArea,
                            waterSource: existing.waterSource,
                        },
                        after: {
                            basinName: updated.basinName,
                            location: updated.location,
                            districtName: updated.districtName,
                            communeName: updated.communeName,
                            totalWater: updated.totalWater,
                            waterPercent: updated.waterPercent,
                            actualWater: updated.actualWater,
                            irrigatedDryArea: updated.irrigatedDryArea,
                            irrigatedWetArea: updated.irrigatedWetArea,
                            waterSource: updated.waterSource,
                        },
                    },
                },
            });

            return res.json({ entry: updated });
        } catch (error) {
            return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
