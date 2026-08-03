import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/db";
import type { AuthTokenPayload } from "../../lib/auth";
import { getAuthPayload } from "../../lib/requestAuth";

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
    communeNameRaw: unknown;
}) {
    const districtId = parseInteger(params.districtIdRaw);
    const districtNameInput = normalizeText(params.districtNameRaw);
    const communeName = normalizeText(params.communeNameRaw);

    if (districtId !== null) {
        const district = await prisma.district.findUnique({ where: { id: districtId } });
        if (!district || district.provinceId !== params.provinceId) {
            throw new Error("Selected district does not belong to your province");
        }

        return {
            districtId: district.id,
            districtName: district.name,
            communeName: communeName || null,
        };
    }

    if (!districtNameInput) {
        throw new Error("District name is required if district is not selected");
    }

    return {
        districtId: null,
        districtName: districtNameInput,
        communeName: communeName || null,
    };
}

async function loadEntriesForProvince(provinceId: number) {
    return prisma.provinceWaterEntry.findMany({
        where: { provinceId },
        include: {
            district: { select: { id: true, name: true } },
            province: { select: { id: true, name: true, khmerName: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = getAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        const provinceId = resolveProvinceId(authUser, req.query.provinceId);
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
            const actualWater = parseNonNegative(req.body?.actualWater);
            const note = normalizeText(req.body?.note);

            if (!basinName) {
                throw new Error("Basin name is required");
            }
            if (!location) {
                throw new Error("Location is required");
            }
            if (totalWater === null || actualWater === null) {
                throw new Error("Total water and actual water must be non-negative numbers");
            }

            const resolvedLocation = await resolveLocation({
                provinceId,
                districtIdRaw: req.body?.districtId,
                districtNameRaw: req.body?.districtName,
                communeNameRaw: req.body?.communeName,
            });

            const entry = await prisma.provinceWaterEntry.create({
                data: {
                    basinName,
                    location,
                    districtName: resolvedLocation.districtName,
                    communeName: resolvedLocation.communeName,
                    totalWater,
                    actualWater,
                    note: note || null,
                    provinceId,
                    districtId: resolvedLocation.districtId,
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
                            actualWater: entry.actualWater,
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
            const actualWater = parseNonNegative(req.body?.actualWater);
            const note = normalizeText(req.body?.note);

            if (!basinName) {
                throw new Error("Basin name is required");
            }
            if (!location) {
                throw new Error("Location is required");
            }
            if (totalWater === null || actualWater === null) {
                throw new Error("Total water and actual water must be non-negative numbers");
            }

            const resolvedLocation = await resolveLocation({
                provinceId: existing.provinceId,
                districtIdRaw: req.body?.districtId,
                districtNameRaw: req.body?.districtName,
                communeNameRaw: req.body?.communeName,
            });

            const updated = await prisma.provinceWaterEntry.update({
                where: { id: entryId },
                data: {
                    basinName,
                    location,
                    districtName: resolvedLocation.districtName,
                    communeName: resolvedLocation.communeName,
                    totalWater,
                    actualWater,
                    note: note || null,
                    districtId: resolvedLocation.districtId,
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
                            actualWater: existing.actualWater,
                        },
                        after: {
                            basinName: updated.basinName,
                            location: updated.location,
                            districtName: updated.districtName,
                            communeName: updated.communeName,
                            totalWater: updated.totalWater,
                            actualWater: updated.actualWater,
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
