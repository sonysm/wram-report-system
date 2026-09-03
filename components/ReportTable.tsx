import { useEffect, useState } from "react";

interface ReportRow {
    provinceId: number | null;
    provinceName: string;
    provinceCode?: string | null;
    postalCode?: number | null;
    provinceSortOrder?: number | null;
    districtId: number | null;
    districtName: string;
    planArea: number;
    planDone: number;
    actualArea: number;
    interventionArea: number;
    interventionAreaDrought: number;
    interventionAreaFlood: number;
    householdPlan: number;
    householdDone: number;
    unsalvageableArea: number;
    unsalvageableAreaDrought: number;
    unsalvageableAreaFlood: number;
    overUnderPlan: number;
    waterSource: string;
    note: string;
    recordCount: number;
}

type ReportMode = "aggregate" | "latest-per-district" | "province-total";
interface ReportTableProps {
    refreshTrigger?: number;
}

export default function ReportTable({ refreshTrigger = 0 }: ReportTableProps = {}) {
    const [data, setData] = useState<ReportRow[]>([]);
    const [totals, setTotals] = useState({
        planArea: 0,
        planDone: 0,
        actualArea: 0,
        interventionArea: 0,
        interventionAreaDrought: 0,
        interventionAreaFlood: 0,
        householdPlan: 0,
        householdDone: 0,
        unsalvageableArea: 0,
        unsalvageableAreaDrought: 0,
        unsalvageableAreaFlood: 0,
        overUnderPlan: 0,
    });
    const [scope, setScope] = useState<"all" | "province">("all");
    const [reportMode, setReportMode] = useState<ReportMode>("aggregate");
    const [viewerProvinceName, setViewerProvinceName] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string>("");
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const toKhmerNumeral = (n: number | string) => n.toString().replace(/\d/g, (d) => '០១២៣៤៥៦៧៨៩'[d as any]);
    const now = new Date();
    const day = toKhmerNumeral(now.getDate().toString().padStart(2, "0"));
    const month = now.toLocaleDateString('km-KH', { month: 'long' });
    const year = toKhmerNumeral(now.getFullYear());
    const dateString = `គិតត្រឹមថ្ងៃទី${day} ខែ${month} ឆ្នាំ${year}`;

    const sanitizeFilePart = (value: string): string => {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return slug || "province";
    };

    const formatNumber = (value: number): string => {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    const formatProgressPercent = (planArea: number, planDone: number): string => {
        if (planArea <= 0) {
            return "0%";
        }

        return `${Math.round((planDone / planArea) * 100)}%`;
    };

    const formatOverUnderPlan = (planArea: number, planDone: number): string => {
        return formatNumber(planDone - planArea);
    };

    const formatOverUnderPlanPercent = (planArea: number, planDone: number): string => {
        if (planArea <= 0) {
            return "0%";
        }
        return `${(((planDone - planArea) * 100) / planArea).toFixed(2)}%`;
    };

    const buildExcelLikeNote = (row: ReportRow): string => {
        const noteParts: string[] = [];

        if (row.note) {
            noteParts.push(row.note);
        }
        if (row.householdDone > 0) {
            noteParts.push(`បន្តរជួយ៖ ${formatNumber(row.householdDone)}`);
        }
        if (row.unsalvageableArea > 0) {
            noteParts.push(`ផ្ទៃដីមិនអាចសង្គ្រោះបាន៖ ${formatNumber(row.unsalvageableArea)}`);
        }

        return noteParts.join(" | ");
    };

    const handleDownloadExcel = async () => {
        if (data.length === 0) {
            setExportError("No report data to export.");
            return;
        }

        setExportError("");
        setIsExporting(true);

        try {
            const XLSX = await import("xlsx");

            if (scope === "all" && reportMode === "province-total") {
                const templateResponse = await fetch("/templates/seasonal-rice-report-template.xlsx");
                if (!templateResponse.ok) {
                    throw new Error("Unable to load report template file");
                }

                const templateBuffer = await templateResponse.arrayBuffer();
                const workbook = XLSX.read(templateBuffer, { type: "array" });
                const firstSheetName = workbook.SheetNames[0] ?? "Sheet1";
                const worksheet = workbook.Sheets[firstSheetName];

                const bodyStartRow = 7;
                const clearUntilRow = Math.max(80, bodyStartRow + data.length + 5);
                const bodyColumns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
                const templateStyleByColumn = new Map<string, unknown>();

                for (const column of bodyColumns) {
                    const templateCell = worksheet[`${column}${bodyStartRow}`];
                    if (templateCell && templateCell.s !== undefined) {
                        templateStyleByColumn.set(column, templateCell.s);
                    }
                }

                const setTemplateCell = (address: string, value: string | number, type: "s" | "n") => {
                    const baseCell = worksheet[address] ?? {};
                    const column = address.replace(/[0-9]+/g, "");
                    const style = (baseCell as { s?: unknown }).s ?? templateStyleByColumn.get(column);

                    worksheet[address] =
                        style === undefined
                            ? { ...baseCell, t: type, v: value }
                            : { ...baseCell, t: type, v: value, s: style };
                };

                for (let rowIndex = bodyStartRow; rowIndex <= clearUntilRow; rowIndex += 1) {
                    for (const column of bodyColumns) {
                        const address = `${column}${rowIndex}`;
                        setTemplateCell(address, "", "s");
                    }
                }

                const sortedRows = [...data].sort((a, b) => {
                    const aSort = a.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
                    const bSort = b.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
                    if (aSort !== bSort) {
                        return aSort - bSort;
                    }

                    return a.provinceName.localeCompare(b.provinceName);
                });

                sortedRows.forEach((row, index) => {
                    const excelRow = bodyStartRow + index;
                    const progress = row.planArea > 0 ? row.planDone / row.planArea : 0;

                    setTemplateCell(`A${excelRow}`, index + 1, "n");
                    setTemplateCell(`B${excelRow}`, row.provinceName, "s");
                    setTemplateCell(`C${excelRow}`, row.planArea, "n");
                    setTemplateCell(`D${excelRow}`, row.planDone, "n");
                    setTemplateCell(`E${excelRow}`, row.overUnderPlan, "n");
                    setTemplateCell(`F${excelRow}`, progress, "n");
                    setTemplateCell(`G${excelRow}`, row.actualArea, "n");
                    setTemplateCell(`H${excelRow}`, row.householdPlan, "n");
                    setTemplateCell(`I${excelRow}`, row.interventionArea, "n");
                    setTemplateCell(`J${excelRow}`, row.unsalvageableArea, "n");
                    setTemplateCell(`K${excelRow}`, row.waterSource || "", "s");
                    setTemplateCell(`L${excelRow}`, row.householdDone, "n");
                    setTemplateCell(`M${excelRow}`, row.note || "", "s");
                });

                const totalRow = bodyStartRow + sortedRows.length;
                const totalProgress = totals.planArea > 0 ? totals.planDone / totals.planArea : 0;
                setTemplateCell(`A${totalRow}`, "សរុប", "s");
                setTemplateCell(`B${totalRow}`, "", "s");
                setTemplateCell(`C${totalRow}`, totals.planArea, "n");
                setTemplateCell(`D${totalRow}`, totals.planDone, "n");
                setTemplateCell(`E${totalRow}`, totals.overUnderPlan, "n");
                setTemplateCell(`F${totalRow}`, totalProgress, "n");
                setTemplateCell(`G${totalRow}`, totals.actualArea, "n");
                setTemplateCell(`H${totalRow}`, totals.householdPlan, "n");
                setTemplateCell(`I${totalRow}`, totals.interventionArea, "n");
                setTemplateCell(`J${totalRow}`, totals.unsalvageableArea, "n");
                setTemplateCell(`K${totalRow}`, "", "s");
                setTemplateCell(`L${totalRow}`, totals.householdDone, "n");
                setTemplateCell(`M${totalRow}`, "", "s");

                if (!worksheet["!merges"]) {
                    worksheet["!merges"] = [];
                }

                const totalMergeExists = worksheet["!merges"].some(
                    (merge) => merge.s.c === 0 && merge.e.c === 1 && merge.s.r === totalRow - 1 && merge.e.r === totalRow - 1,
                );

                if (!totalMergeExists) {
                    worksheet["!merges"].push({ s: { c: 0, r: totalRow - 1 }, e: { c: 1, r: totalRow - 1 } });
                }

                worksheet["!ref"] = `A1:M${Math.max(totalRow, 40)}`;
                XLSX.writeFile(workbook, "super-admin-province-totals.xlsx");
                return;
            }

            const showProvinceColumn = scope === "all";
            const showDistrictColumn = scope === "province";
            const headerRow = [
                ...(showProvinceColumn ? ["ឈ្មោះខេត្ត"] : []),
                ...(showDistrictColumn ? ["ឈ្មោះក្រុង-ស្រុក"] : []),
                "ផែនការដាំដុះ (ហ.ត)",
                "ផ្ទៃដីអនុវត្ត (ហ.ត)",
                "លើស-ក្រោមផែនការ (ហ.ត)",
                "លើស-ក្រោមផែនការ (%)",
                "ផ្ទៃដីប៉ះពាល់-រាំងស្ងួត (ហ.ត)",
                "ផ្ទៃដីប៉ះពាល់-ជំនន់ (ហ.ត)",
                "បានអន្តរាគមន៍ (ហ.ត)",
                "ផ្ទៃដីខូចខាត (ហ.ត)",
                "ប្រភពទឹក-អាងស្ដុកទឹក",
                "បរិមាណទឹក %",
                "ផ្សេងៗ",
            ];

            const dataRows = data.map((row) => [
                ...(showProvinceColumn ? [row.provinceName] : []),
                ...(showDistrictColumn ? [row.districtName] : []),
                row.planArea,
                row.planDone,
                row.overUnderPlan,
                Number(row.planArea) > 0 ? `${((row.overUnderPlan * 100) / row.planArea).toFixed(2)}%` : "0%",
                row.actualArea,
                row.householdPlan,
                row.interventionArea,
                row.unsalvageableArea,
                row.waterSource || "",
                row.householdDone,
                row.note || "",
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

            const provinceSlug = viewerProvinceName ? sanitizeFilePart(viewerProvinceName) : "all";
            const fileName = scope === "province" ? `province-report-${provinceSlug}.xlsx` : "all-provinces-report.xlsx";

            XLSX.writeFile(workbook, fileName);
        } catch (downloadError) {
            setExportError(downloadError instanceof Error ? downloadError.message : "Unable to export Excel file");
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            if (!token) {
                setError("Please login to view reports.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/reports", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload.error ?? "Unable to load report");
                }

                const nextScope: "all" | "province" = payload.scope === "province" ? "province" : "all";
                const nextMode: ReportMode =
                    payload.reportMode === "latest-per-district"
                        ? "latest-per-district"
                        : payload.reportMode === "province-total"
                            ? "province-total"
                            : "aggregate";

                setData(payload.rows ?? []);
                setScope(nextScope);
                setReportMode(nextMode);
                setViewerProvinceName(typeof payload.viewerProvinceName === "string" ? payload.viewerProvinceName : null);
                setGeneratedAt(typeof payload.generatedAt === "string" ? payload.generatedAt : "");
                setExportError("");
                setTotals(
                    payload.totals ?? {
                        planArea: 0,
                        planDone: 0,
                        actualArea: 0,
                        interventionArea: 0,
                        interventionAreaDrought: 0,
                        interventionAreaFlood: 0,
                        householdPlan: 0,
                        householdDone: 0,
                        unsalvageableArea: 0,
                        unsalvageableAreaDrought: 0,
                        unsalvageableAreaFlood: 0,
                        overUnderPlan: 0,
                    },
                );
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load report");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [refreshTrigger]);

    if (isLoading) {
        return <p className="text-sm text-slate-500">Loading report...</p>;
    }

    if (error) {
        return <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
    }

    const showProvinceColumn = scope === "all";
    const showDistrictColumn = scope === "province";
    const isProvincePreview = scope === "province";
    const isSuperAdminPreview = scope === "all" && reportMode === "province-total";
    const printedDate = generatedAt ? new Date(generatedAt).toLocaleDateString() : new Date().toLocaleDateString();
    const emptyColSpan = (showProvinceColumn ? 1 : 0) + (showDistrictColumn ? 1 : 0) + 10;
    const sortedSuperAdminRows = [...data].sort((a, b) => {
        const aSort = a.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
        const bSort = b.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
        if (aSort !== bSort) {
            return aSort - bSort;
        }

        return a.provinceName.localeCompare(b.provinceName);
    });

    return (
        <div className="space-y-4">
            <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {scope === "province" ? (
                    <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                        Showing report for your province only: <strong>{viewerProvinceName ?? "Assigned Province"}</strong>
                        {reportMode === "latest-per-district" ? " (latest record per district)" : ""}
                    </p>
                ) : (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Super admin report: totals of each province.
                    </p>
                )}

                <div className="flex items-center gap-2">
                    {(isProvincePreview || isSuperAdminPreview) && (
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={data.length === 0}
                            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Preview & Print
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleDownloadExcel}
                        disabled={isExporting || data.length === 0}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isExporting ? "Exporting..." : "Download Excel"}
                    </button>
                </div>
            </div>

            {exportError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{exportError}</p>
            )}

            <div className="no-print grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">ផែនការដាំដុះ (ហ.ត)</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-900">{totals.planArea.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">ផ្ទៃដីអនុវត្ត (ហ.ត)</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-900">{totals.planDone.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">ផ្ទៃដីប៉ះពាល់-រាំងស្ងួត (ហ.ត)</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-900">{totals.actualArea.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">បានអន្តរាគមន៍ (ហ.ត)</p>
                    <p className="mt-2 text-2xl font-bold text-violet-900">{totals.interventionArea.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">ផ្ទៃដីប៉ះពាល់-ជំនន់ (ហ.ត)</p>
                    <p className="mt-2 text-2xl font-bold text-amber-900">{totals.householdPlan.toLocaleString()}</p>
                </div>
                {/* <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">បរិមាណទឹក %</p>
                    <p className="mt-2 text-2xl font-bold text-rose-900">{totals.householdDone.toLocaleString()}</p>
                </div> */}
                <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">ផ្ទៃដីខូចខាត (ហ.ត)</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{totals.unsalvageableArea.toLocaleString()}</p>
                </div>
            </div>

            {isProvincePreview && (
                <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
                    <div className="space-y-2 text-center text-slate-900 font-moul">
                        <p className="text-sm tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</p>
                        <p className="text-sm">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                    </div>

                    <div className="mt-3 flex flex-col text-slate-900 font-moul">
                        <div className="text-left text-sm leading-relaxed">
                            <p>មន្ទីរធនធានទឹក និងឧតុនិយម</p>
                            <p>ខេត្ត {viewerProvinceName ?? "-"}</p>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-slate-900">
                        <h2 className="print-title text-md font-moul tracking-tight">តារាងទិន្នន័យការងារបង្កបង្កើនផលស្រូវរដូវវស្សា និងផលប៉ះពាល់ដោយគ្រោះរាំងស្ងួតឆ្នាំ{year} ({dateString})</h2>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-400">
                        <table className="print-table min-w-full border-collapse text-xs sm:text-sm">
                            <thead className="text-[#000000]">
                                <tr>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ល.រ</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ឈ្មោះក្រុង-ស្រុក</th>
                                    <th colSpan={3} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដី(ហ.ត)</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ភាគរយ<br />អនុវត្តបាន</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីប៉ះពាល់(ហ.ត)</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center ">ផ្ទៃដីអន្តរាគមន៍ (ហ.ត)</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីសង្គ្រោះបាន(ហ.ត)</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីស្រូវខូចខាត(ហ.ត)</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ប្រភពទឹក</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ផ្សេងៗ</th>
                                </tr>
                                <tr>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ផែនការ</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">អនុវត្តបាន</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">លើស/ក្រោម ផែនការ</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr key={`${row.districtId ?? "none"}-${index}`}>
                                        <td className="border border-slate-400 px-2 py-2 text-center">{index + 1}</td>
                                        <td className="border border-slate-400 px-2 py-2">{row.districtName}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(row.planArea)}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(row.planDone)}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(Math.abs(row.overUnderPlan))}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-center">{Number(row.planArea) > 0 ? `${((row.planDone * 100) / row.planArea).toFixed(2)}%` : "0%"}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.actualArea > 0 ? formatNumber(row.actualArea) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.householdPlan > 0 ? formatNumber(row.householdPlan) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.interventionAreaDrought > 0 ? formatNumber(row.interventionAreaDrought) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.interventionAreaFlood > 0 ? formatNumber(row.interventionAreaFlood) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.householdDone > 0 ? formatNumber(row.householdDone) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right"></td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.unsalvageableAreaDrought > 0 ? formatNumber(row.unsalvageableAreaDrought) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2 text-right">{row.unsalvageableAreaFlood > 0 ? formatNumber(row.unsalvageableAreaFlood) : ""}</td>
                                        <td className="border border-slate-400 px-2 py-2">{row.waterSource || ""}</td>
                                        <td className="border border-slate-400 px-2 py-2">{row.note || ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#a3c977]/30 font-semibold">
                                    <td className="border border-slate-500 px-2 py-2 text-center" colSpan={2}>
                                        សរុប
                                    </td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{formatNumber(totals.planArea)}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{formatNumber(totals.planDone)}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{formatNumber(totals.overUnderPlan)}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-center">{Number(totals.planArea) > 0 ? `${((totals.planDone * 100) / totals.planArea).toFixed(2)}%` : "0%"}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.actualArea > 0 ? formatNumber(totals.actualArea) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.householdPlan > 0 ? formatNumber(totals.householdPlan) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.interventionAreaDrought > 0 ? formatNumber(totals.interventionAreaDrought) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.interventionAreaFlood > 0 ? formatNumber(totals.interventionAreaFlood) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.householdDone > 0 ? formatNumber(totals.householdDone) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right"></td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.unsalvageableAreaDrought > 0 ? formatNumber(totals.unsalvageableAreaDrought) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.unsalvageableAreaFlood > 0 ? formatNumber(totals.unsalvageableAreaFlood) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2"></td>
                                    <td className="border border-slate-500 px-2 py-2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
                        <div>
                            <p>បានពិនិត្យដោយ:</p>
                            <p className="mt-1">កាលបរិច្ឆេទ: ....../....../......</p>
                            <p className="mt-12">ឈ្មោះ និងហត្ថលេខា: ____________________</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p>បានរៀបចំដោយ:</p>
                            <p className="mt-1">កាលបរិច្ឆេទ: ....../....../......</p>
                            <p className="mt-12">ឈ្មោះ និងហត្ថលេខា: ____________________</p>
                        </div>
                    </div>
                </section>
            )}

            {isSuperAdminPreview && (
                <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
                    <div className="space-y-2 text-center text-slate-900 font-moul">
                        <p className="text-sm tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</p>
                        <p className="text-sm">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                    </div>

                    <div className="mt-3 flex flex-col text-slate-900 font-moul">
                        <div className="text-left text-sm leading-relaxed">
                            <p>ក្រសួងធនធានទឹក និងឧតុនិយម</p>
                            <p>អគ្គនាយកដ្ឋានកិច្ចការរដ្ឋបាល</p>
                            <p>នាយកដ្ឋានផែនការ និងសហប្រតិបត្តិការអន្តរជាតិ</p>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-slate-900">
                        <h2 className="print-title text-md font-moul tracking-tight">តារាងទិន្នន័យការងារបង្កបង្កើនផលស្រូវរដូវវស្សា និងផលប៉ះពាល់ដោយគ្រោះរាំងស្ងួតឆ្នាំ{year} ({dateString})</h2>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-400">
                        <table className="print-table min-w-full border-collapse text-xs sm:text-sm">
                            <thead className="text-[#000000]">
                                <tr>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ល.រ</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ឈ្មោះខេត្ត</th>
                                    <th colSpan={3} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដី(ហ.ត)</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ភាគរយ<br />អនុវត្តបាន</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីប៉ះពាល់(ហ.ត)</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីអន្តរាគមន៍ (ហ.ត)</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីសង្គ្រោះបាន(ហ.ត)</th>
                                    <th colSpan={2} className="border border-slate-500 px-2 py-2 text-center">ផ្ទៃដីស្រូវខូចខាត(ហ.ត)</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ប្រភពទឹក</th>
                                    <th rowSpan={2} className="border border-slate-500 px-2 py-2 text-center align-middle">ផ្សេងៗ</th>
                                </tr>
                                <tr>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ផែនការ</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">អនុវត្តបាន</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">លើសផែនការ</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>

                                    <th className="border border-slate-500 px-2 py-2 text-center">រាំងស្ងួត</th>
                                    <th className="border border-slate-500 px-2 py-2 text-center">ជំនន់</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSuperAdminRows.map((row, index) => {
                                    return (
                                        <tr key={`${row.provinceId ?? "none"}-${index}`}>
                                            <td className="border border-slate-400 px-2 py-2 text-center">{index + 1}</td>
                                            <td className="border border-slate-400 px-2 py-2">{row.provinceName}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(row.planArea)}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(row.planDone)}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(row.overUnderPlan)}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-center">{Number(row.planArea) > 0 ? `${((row.planDone * 100) / row.planArea).toFixed(2)}%` : "0%"}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{row.actualArea > 0 ? formatNumber(row.actualArea) : ""}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{row.householdPlan > 0 ? formatNumber(row.householdPlan) : ""}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{row.interventionAreaDrought > 0 ? formatNumber(row.interventionAreaDrought) : ""}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right"></td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{row.householdDone > 0 ? formatNumber(row.householdDone) : ""}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right"></td>
                                            <td className="border border-slate-400 px-2 py-2 text-right">{row.unsalvageableAreaDrought > 0 ? formatNumber(row.unsalvageableAreaDrought) : ""}</td>
                                            <td className="border border-slate-400 px-2 py-2 text-right"></td>
                                            <td className="border border-slate-400 px-2 py-2">{row.waterSource || ""}</td>
                                            <td className="border border-slate-400 px-2 py-2">{row.note || ""}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#a3c977]/30 font-semibold">
                                    <td className="border border-slate-500 px-2 py-2 text-center font-moul" colSpan={2}>
                                        សរុប
                                    </td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{formatNumber(totals.planArea)}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{formatNumber(totals.planDone)}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{formatNumber(totals.overUnderPlan)}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-center">{Number(totals.planArea) > 0 ? `${((totals.planDone * 100) / totals.planArea).toFixed(2)}%` : "0%"}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.actualArea > 0 ? formatNumber(totals.actualArea) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.householdPlan > 0 ? formatNumber(totals.householdPlan) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.interventionArea > 0 ? formatNumber(totals.interventionArea) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right"></td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.householdDone > 0 ? formatNumber(totals.householdDone) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right"></td>
                                    <td className="border border-slate-500 px-2 py-2 text-right">{totals.unsalvageableArea > 0 ? formatNumber(totals.unsalvageableArea) : ""}</td>
                                    <td className="border border-slate-500 px-2 py-2 text-right"></td>
                                    <td className="border border-slate-500 px-2 py-2"></td>
                                    <td className="border border-slate-500 px-2 py-2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
                        <div>
                            <p>បានពិនិត្យដោយ:</p>
                            <p className="mt-1">កាលបរិច្ឆេទ: ....../....../......</p>
                            <p className="mt-12">ឈ្មោះ និងហត្ថលេខា: ____________________</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p>បានរៀបចំដោយ:</p>
                            <p className="mt-1">កាលបរិច្ឆេទ: ....../....../......</p>
                            <p className="mt-12">ឈ្មោះ និងហត្ថលេខា: ____________________</p>
                        </div>
                    </div>
                </section>
            )}



            {/* <div className="no-print overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-left text-slate-700">
                        <tr>
                            {showProvinceColumn && <th className="px-4 py-3 font-semibold">ឈ្មោះខេត្ត</th>}
                            {showDistrictColumn && <th className="px-4 py-3 font-semibold">ស្រុក</th>}
                            <th className="px-4 py-3 font-semibold">ផ្ទៃដីផែនការ</th>
                            <th className="px-4 py-3 font-semibold">ផ្ទៃដីអនុវត្តន</th>
                            <th className="px-4 py-3 font-semibold">ផ្ទៃដីប៉ះពាល់</th>
                            <th className="px-4 py-3 font-semibold">ផ្ទៃដីត្រូវអន្តរាគម</th>
                            <th className="px-4 py-3 font-semibold">បានជួយ</th>
                            <th className="px-4 py-3 font-semibold">បន្តរជួយ</th>
                            <th className="px-4 py-3 font-semibold">ផ្ទៃដីមិនអាចសង្គ្រោះបាន</th>
                            <th className="px-4 py-3 font-semibold">ប្រភពទឹក</th>
                            <th className="px-4 py-3 font-semibold">ផ្សេងៗ</th>
                            <th className="px-4 py-3 font-semibold">ភាគរយ អនុវត្តបាន</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={emptyColSpan} className="px-4 py-6 text-center text-slate-500">
                                    No report data yet.
                                </td>
                            </tr>
                        )}
                        {data.map((row, index) => (
                            <tr key={`${row.provinceId ?? "none"}-${row.districtId ?? "none"}-${index}`} className="border-t border-slate-100">
                                {showProvinceColumn && <td className="px-4 py-3">{row.provinceName}</td>}
                                {showDistrictColumn && <td className="px-4 py-3">{row.districtName}</td>}
                                <td className="px-4 py-3">{formatNumber(row.planArea)}</td>
                                <td className="px-4 py-3">{formatNumber(row.planDone)}</td>
                                <td className="px-4 py-3">{formatNumber(row.actualArea)}</td>
                                <td className="px-4 py-3">{formatNumber(row.interventionArea)}</td>
                                <td className="px-4 py-3">{formatNumber(row.householdPlan)}</td>
                                <td className="px-4 py-3">{formatNumber(row.householdDone)}</td>
                                <td className="px-4 py-3">{formatNumber(row.unsalvageableArea)}</td>
                                <td className="px-4 py-3">{row.waterSource || "-"}</td>
                                <td className="px-4 py-3">{row.note || "-"}</td>
                                <td className="px-4 py-3">
                                    {row.planArea > 0 ? `${Math.round((row.planDone / row.planArea) * 100)}%` : "0%"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> */}
        </div>
    );
}
