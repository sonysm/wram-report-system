import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import prisma from "../../lib/db";
import { ensureProvincesSeeded } from "../../lib/provinces";
import { getActiveAuthPayload } from "../../lib/requestAuth";

interface ReportRow {
    provinceId: number | null;
    provinceName: string;
    provinceCode: string | null;
    postalCode: number | null;
    provinceSortOrder: number | null;
    districtId: number | null;
    districtName: string;
    planArea: number;
    planDone: number;
    actualArea: number;
    interventionArea: number;
    householdPlan: number;
    householdDone: number;
    unsalvageableArea: number;
    overUnderPlan: number;
    waterSource: string;
    note: string;
    recordCount: number;
}

interface Totals {
    planArea: number;
    planDone: number;
    actualArea: number;
    interventionArea: number;
    householdPlan: number;
    householdDone: number;
    unsalvageableArea: number;
    overUnderPlan: number;
}

function createZeroTotals(): Totals {
    return {
        planArea: 0,
        planDone: 0,
        actualArea: 0,
        interventionArea: 0,
        householdPlan: 0,
        householdDone: 0,
        unsalvageableArea: 0,
        overUnderPlan: 0,
    };
}

function calculateTotals(rows: ReportRow[]): Totals {
    return rows.reduce(
        (acc, row) => ({
            planArea: acc.planArea + row.planArea,
            planDone: acc.planDone + row.planDone,
            actualArea: acc.actualArea + row.actualArea,
            interventionArea: acc.interventionArea + row.interventionArea,
            householdPlan: acc.householdPlan + row.householdPlan,
            householdDone: acc.householdDone + row.householdDone,
            unsalvageableArea: acc.unsalvageableArea + row.unsalvageableArea,
            overUnderPlan: acc.overUnderPlan + row.overUnderPlan,
        }),
        createZeroTotals(),
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getActiveAuthPayload(req);
    if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    await ensureProvincesSeeded();

    const isAdmin = authUser.role === "admin";
    if (!isAdmin && !authUser.provinceId) {
        return res.status(403).json({ error: "This account has no province assigned" });
    }

    if (!isAdmin) {
        const latestCandidates = await prisma.entry.findMany({
            where: {
                provinceId: authUser.provinceId ?? -1,
                districtId: { not: null },
            },
            include: {
                province: { select: { id: true, code: true, name: true, khmerName: true, postalCode: true, sortOrder: true } },
                district: { select: { id: true, name: true } },
            },
            orderBy: [{ districtId: "asc" }, { createdAt: "desc" }],
        });

        const latestByDistrict = new Map<number, (typeof latestCandidates)[number]>();
        for (const entry of latestCandidates) {
            if (entry.districtId === null) {
                continue;
            }

            if (!latestByDistrict.has(entry.districtId)) {
                latestByDistrict.set(entry.districtId, entry);
            }
        }

        const rows: ReportRow[] = Array.from(latestByDistrict.values())
            .map((entry) => ({
                provinceId: entry.provinceId,
                provinceName: entry.province?.khmerName || entry.province?.name || "Unknown Province",
                provinceCode: entry.province?.code ?? null,
                postalCode: entry.province?.postalCode ?? null,
                provinceSortOrder: entry.province?.sortOrder ?? null,
                districtId: entry.districtId,
                districtName: entry.district?.name ?? "Unknown District",
                planArea: entry.planArea,
                planDone: entry.planDone,
                actualArea: entry.actualArea,
                interventionArea: entry.interventionArea,
                householdPlan: entry.householdPlan,
                householdDone: entry.householdDone,
                unsalvageableArea: entry.unsalvageableArea,
                overUnderPlan: entry.overUnderPlan,
                waterSource: entry.waterSource,
                note: entry.note ?? "",
                recordCount: 1,
            }))
            .sort((a, b) => a.districtName.localeCompare(b.districtName));

        const totals = calculateTotals(rows);

        return res.json({
            generatedAt: new Date().toISOString(),
            scope: "province",
            reportMode: "latest-per-district",
            viewerProvinceId: authUser.provinceId,
            viewerProvinceName: authUser.provinceName ?? rows[0]?.provinceName ?? null,
            rows,
            totals,
        });
    }

    const reportWhere: Prisma.EntryWhereInput = {
        provinceId: { not: null },
    };

    const groupedReport = await prisma.entry.groupBy({
        by: ["provinceId"],
        where: reportWhere,
        _sum: {
            planArea: true,
            planDone: true,
            actualArea: true,
            interventionArea: true,
            householdPlan: true,
            householdDone: true,
            unsalvageableArea: true,
            overUnderPlan: true,
        },
        _count: { _all: true },
    });

    const provinces = await prisma.province.findMany({
        select: { id: true, code: true, name: true, khmerName: true, postalCode: true, sortOrder: true },
        orderBy: [{ sortOrder: "asc" }, { khmerName: "asc" }],
    });

    const provinceIds = provinces.map((province) => province.id);

    const latestDetails = await prisma.entry.findMany({
        where: {
            provinceId: { in: provinceIds },
        },
        select: {
            provinceId: true,
            waterSource: true,
            note: true,
            createdAt: true,
        },
        orderBy: [{ provinceId: "asc" }, { createdAt: "desc" }],
    });

    const groupedByProvinceId = new Map<number, (typeof groupedReport)[number]>();
    for (const row of groupedReport) {
        if (row.provinceId !== null) {
            groupedByProvinceId.set(row.provinceId, row);
        }
    }

    const latestMetaMap = new Map<number, { waterSource: string; note: string }>();
    for (const entry of latestDetails) {
        if (entry.provinceId === null) {
            continue;
        }

        if (!latestMetaMap.has(entry.provinceId)) {
            latestMetaMap.set(entry.provinceId, {
                waterSource: entry.waterSource,
                note: entry.note?.trim() ?? "",
            });
        }
    }

    const rows: ReportRow[] = provinces.map((province) => {
        const grouped = groupedByProvinceId.get(province.id);
        const latestMeta = latestMetaMap.get(province.id);

        return {
            provinceId: province.id,
            provinceName: province.khmerName || province.name,
            provinceCode: province.code ?? null,
            postalCode: province.postalCode ?? null,
            provinceSortOrder: province.sortOrder ?? null,
            districtId: null,
            districtName: "",
            planArea: grouped?._sum.planArea ?? 0,
            planDone: grouped?._sum.planDone ?? 0,
            actualArea: grouped?._sum.actualArea ?? 0,
            interventionArea: grouped?._sum.interventionArea ?? 0,
            householdPlan: grouped?._sum.householdPlan ?? 0,
            householdDone: grouped?._sum.householdDone ?? 0,
            unsalvageableArea: grouped?._sum.unsalvageableArea ?? 0,
            overUnderPlan: grouped?._sum.overUnderPlan ?? 0,
            waterSource: latestMeta?.waterSource ?? "",
            note: latestMeta?.note ?? "",
            recordCount: grouped?._count._all ?? 0,
        };
    });

    rows.sort((a, b) => {
        const aSort = a.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
        const bSort = b.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
        if (aSort !== bSort) {
            return aSort - bSort;
        }

        return a.provinceName.localeCompare(b.provinceName);
    });

    const totals = calculateTotals(rows);

    return res.json({
        generatedAt: new Date().toISOString(),
        scope: "all",
        reportMode: "province-total",
        viewerProvinceId: null,
        viewerProvinceName: null,
        rows,
        totals,
    });
}
