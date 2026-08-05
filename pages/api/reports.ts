import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import prisma from "../../lib/db";
import { getActiveAuthPayload } from "../../lib/requestAuth";

interface ReportRow {
    provinceId: number | null;
    provinceName: string;
    districtId: number | null;
    districtName: string;
    planArea: number;
    planDone: number;
    actualArea: number;
    interventionArea: number;
    householdPlan: number;
    householdDone: number;
    unsalvageableArea: number;
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
                province: { select: { id: true, name: true, khmerName: true } },
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
                districtId: entry.districtId,
                districtName: entry.district?.name ?? "Unknown District",
                planArea: entry.planArea,
                planDone: entry.planDone,
                actualArea: entry.actualArea,
                interventionArea: entry.interventionArea,
                householdPlan: entry.householdPlan,
                householdDone: entry.householdDone,
                unsalvageableArea: entry.unsalvageableArea,
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
        },
        _count: { _all: true },
    });

    const provinceIds = groupedReport.reduce<number[]>((ids, row) => {
        if (row.provinceId !== null && !ids.includes(row.provinceId)) {
            ids.push(row.provinceId);
        }
        return ids;
    }, []);

    const [provinces, latestDetails] = await Promise.all([
        prisma.province.findMany({
            where: { id: { in: provinceIds } },
            select: { id: true, name: true, khmerName: true },
        }),
        prisma.entry.findMany({
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
        }),
    ]);

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

    const provinceMap = new Map<number, string>(
        provinces.map((province) => [province.id, province.khmerName || province.name]),
    );

    const rows: ReportRow[] = groupedReport.map((row) => {
        const latestMeta = row.provinceId !== null ? latestMetaMap.get(row.provinceId) : undefined;

        return {
            provinceId: row.provinceId,
            provinceName: row.provinceId ? provinceMap.get(row.provinceId) ?? "Unknown Province" : "Unknown Province",
            districtId: null,
            districtName: "",
            planArea: row._sum.planArea ?? 0,
            planDone: row._sum.planDone ?? 0,
            actualArea: row._sum.actualArea ?? 0,
            interventionArea: row._sum.interventionArea ?? 0,
            householdPlan: row._sum.householdPlan ?? 0,
            householdDone: row._sum.householdDone ?? 0,
            unsalvageableArea: row._sum.unsalvageableArea ?? 0,
            waterSource: latestMeta?.waterSource ?? "",
            note: latestMeta?.note ?? "",
            recordCount: row._count._all,
        };
    }).sort((a, b) => a.provinceName.localeCompare(b.provinceName));

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
