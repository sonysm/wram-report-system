import { useEffect, useState } from "react";

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

type ReportMode = "aggregate" | "latest-per-district" | "province-total";

export default function ReportTable() {
    const [data, setData] = useState<ReportRow[]>([]);
    const [totals, setTotals] = useState({
        planArea: 0,
        planDone: 0,
        actualArea: 0,
        interventionArea: 0,
        householdPlan: 0,
        householdDone: 0,
        unsalvageableArea: 0,
    });
    const [scope, setScope] = useState<"all" | "province">("all");
    const [reportMode, setReportMode] = useState<ReportMode>("aggregate");
    const [viewerProvinceName, setViewerProvinceName] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const sanitizeFilePart = (value: string): string => {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return slug || "province";
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
                const bodyColumns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
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

                const sortedRows = [...data].sort((a, b) => a.provinceName.localeCompare(b.provinceName));

                sortedRows.forEach((row, index) => {
                    const excelRow = bodyStartRow + index;
                    const overPlan = row.planDone > row.planArea ? row.planDone - row.planArea : "";
                    const progress = row.planArea > 0 ? row.planDone / row.planArea : 0;
                    const noteParts: string[] = [];

                    if (row.note) {
                        noteParts.push(row.note);
                    }
                    if (row.householdDone > 0) {
                        noteParts.push(`បន្តរជួយ៖ ${row.householdDone.toLocaleString()}`);
                    }
                    if (row.unsalvageableArea > 0) {
                        noteParts.push(`ផ្ទៃដីមិនអាចសង្គ្រោះបាន៖ ${row.unsalvageableArea.toLocaleString()}`);
                    }

                    setTemplateCell(`A${excelRow}`, index + 1, "n");
                    setTemplateCell(`B${excelRow}`, row.provinceName, "s");
                    setTemplateCell(`C${excelRow}`, row.planArea, "n");
                    setTemplateCell(`D${excelRow}`, row.planDone, "n");
                    if (overPlan === "") {
                        setTemplateCell(`E${excelRow}`, "", "s");
                    } else {
                        setTemplateCell(`E${excelRow}`, overPlan, "n");
                    }
                    setTemplateCell(`F${excelRow}`, progress, "n");
                    setTemplateCell(`G${excelRow}`, row.actualArea, "n");
                    setTemplateCell(`H${excelRow}`, row.interventionArea, "n");
                    setTemplateCell(`I${excelRow}`, row.householdPlan, "n");
                    setTemplateCell(`J${excelRow}`, row.waterSource || "", "s");
                    setTemplateCell(`K${excelRow}`, noteParts.join(" | "), "s");
                });

                const totalRow = bodyStartRow + sortedRows.length;
                const totalProgress = totals.planArea > 0 ? totals.planDone / totals.planArea : 0;
                setTemplateCell(`A${totalRow}`, "សរុប", "s");
                setTemplateCell(`B${totalRow}`, "", "s");
                setTemplateCell(`C${totalRow}`, totals.planArea, "n");
                setTemplateCell(`D${totalRow}`, totals.planDone, "n");
                setTemplateCell(
                    `E${totalRow}`,
                    totals.planDone > totals.planArea ? totals.planDone - totals.planArea : 0,
                    "n",
                );
                setTemplateCell(`F${totalRow}`, totalProgress, "n");
                setTemplateCell(`G${totalRow}`, totals.actualArea, "n");
                setTemplateCell(`H${totalRow}`, totals.interventionArea, "n");
                setTemplateCell(`I${totalRow}`, totals.householdPlan, "n");
                setTemplateCell(`J${totalRow}`, "", "s");
                setTemplateCell(`K${totalRow}`, "", "s");

                if (!worksheet["!merges"]) {
                    worksheet["!merges"] = [];
                }

                const totalMergeExists = worksheet["!merges"].some(
                    (merge) => merge.s.c === 0 && merge.e.c === 1 && merge.s.r === totalRow - 1 && merge.e.r === totalRow - 1,
                );

                if (!totalMergeExists) {
                    worksheet["!merges"].push({ s: { c: 0, r: totalRow - 1 }, e: { c: 1, r: totalRow - 1 } });
                }

                worksheet["!ref"] = `A1:K${Math.max(totalRow, 40)}`;
                XLSX.writeFile(workbook, "super-admin-province-totals.xlsx");
                return;
            }

            const showProvinceColumn = scope === "all";
            const showDistrictColumn = scope === "province";
            const headerRow = [
                ...(showProvinceColumn ? ["ឈ្មោះខេត្ត"] : []),
                ...(showDistrictColumn ? ["ស្រុក"] : []),
                "ផ្ទៃដីផែនការ",
                "ផ្ទៃដីអនុវត្តន",
                "ផ្ទៃដីប៉ះពាល់",
                "ផ្ទៃដីត្រូវអន្តរាគម",
                "បានជួយ",
                "បន្តរជួយ",
                "ផ្ទៃដីមិនអាចសង្គ្រោះបាន",
                "ប្រភពទឹក",
                "ផ្សេងៗ",
                "ភាគរយ អនុវត្តបាន",
            ];

            const dataRows = data.map((row) => [
                ...(showProvinceColumn ? [row.provinceName] : []),
                ...(showDistrictColumn ? [row.districtName] : []),
                row.planArea,
                row.planDone,
                row.actualArea,
                row.interventionArea,
                row.householdPlan,
                row.householdDone,
                row.unsalvageableArea,
                row.waterSource || "",
                row.note || "",
                row.planArea > 0 ? `${Math.round((row.planDone / row.planArea) * 100)}%` : "0%",
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
                setExportError("");
                setTotals(
                    payload.totals ?? {
                        planArea: 0,
                        planDone: 0,
                        actualArea: 0,
                        interventionArea: 0,
                        householdPlan: 0,
                        householdDone: 0,
                        unsalvageableArea: 0,
                    },
                );
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load report");
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, []);

    if (isLoading) {
        return <p className="text-sm text-slate-500">Loading report...</p>;
    }

    if (error) {
        return <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
    }

    const showProvinceColumn = scope === "all";
    const showDistrictColumn = scope === "province";
    const emptyColSpan = (showProvinceColumn ? 1 : 0) + (showDistrictColumn ? 1 : 0) + 10;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

                <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={isExporting || data.length === 0}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isExporting ? "Exporting..." : "Download Excel"}
                </button>
            </div>

            {exportError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{exportError}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">ផ្ទៃដីផែនការ</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-900">{totals.planArea.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">ផ្ទៃដីអនុវត្តន</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-900">{totals.planDone.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">ផ្ទៃដីប៉ះពាល់</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-900">{totals.actualArea.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">ផ្ទៃដីត្រូវអន្តរាគម</p>
                    <p className="mt-2 text-2xl font-bold text-violet-900">{totals.interventionArea.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">បានជួយ</p>
                    <p className="mt-2 text-2xl font-bold text-amber-900">{totals.householdPlan.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">បន្តរជួយ</p>
                    <p className="mt-2 text-2xl font-bold text-rose-900">{totals.householdDone.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">ផ្ទៃដីមិនអាចសង្គ្រោះបាន</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{totals.unsalvageableArea.toLocaleString()}</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
                                <td className="px-4 py-3">{row.planArea.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.planDone.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.actualArea.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.interventionArea.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.householdPlan.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.householdDone.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.unsalvageableArea.toLocaleString()}</td>
                                <td className="px-4 py-3">{row.waterSource || "-"}</td>
                                <td className="px-4 py-3">{row.note || "-"}</td>
                                <td className="px-4 py-3">
                                    {row.planArea > 0 ? `${Math.round((row.planDone / row.planArea) * 100)}%` : "0%"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
