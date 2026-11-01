/*
 * Province Daily Meteorology & Water Report
 * របាយការណ៍ប្រចាំថ្ងៃ - ព្រឹត្តិបត្រព័ត៌មាន និងការព្យាករណ៍អាកាសធាតុ
 *
 * Renders a combined bulletin from 4 sections:
 *   I.   សីតុណ្ហភាព (Temperature)
 *   II.  ទិន្នន័យភ្លៀងតាមបណ្ដាស្រុក (Rainfall by District)
 *   III. កម្ពស់ទឹកពិនិត្យឃើញ (Water Level Observations)
 *   IV.  ការព្យាករណ៍អាកាសធាតុ (Weather Forecast)
 */

import { useEffect, useMemo, useState } from "react";
import { getStoredToken, fetchSessionUser, type SessionUser } from "../lib/session";

/* ================================================================
   Type definitions
   ================================================================ */

interface ProvinceOption {
    id: number;
    name: string;
    khmerName: string;
}

interface District {
    id: number;
    name: string;
    khmerName: string;
    provinceId: number;
}

interface TemperatureData {
    id: number;
    reportDate: string;
    maxTemp: number;
    minTemp: number;
}

interface RainfallEntry {
    id: number;
    stationName: string;
    rainfall: number;
    districtId: number | null;
}

interface StationData {
    id: number;
    name: string;
    khmerName: string;
    river: string | null;
    category: string | null;
    warningLevel: number | null;
    maxCapacityLevel: number | null;
    order: number;
}

interface WaterLevelEntry {
    id: number;
    waterLevel: number;
    waterLevelYesterday: number | null;
    waterLevelLastYear: number | null;
    station: StationData;
}

interface ForecastData {
    id: number;
    reportDate: string;
    forecastText: string;
}

interface DailyReportData {
    temperature: TemperatureData | null;
    rainfalls: RainfallEntry[];
    waterLevels: WaterLevelEntry[];
    forecast: ForecastData | null;
    stations: StationData[];
    districts?: District[];
}

/* ================================================================
   Helpers
   ================================================================ */

const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

function toKhmerNum(n: number | string): string {
    return String(n)
        .split("")
        .map((d) => (/\d/.test(d) ? khmerDigits[parseInt(d)] : d))
        .join("");
}

function khmerMonth(monthIdx: number): string {
    const months = [
        "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
        "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
    ];
    return months[monthIdx] ?? "";
}

function formatDateKhmer(dateStr: string): string {
    const d = new Date(dateStr);
    return `ថ្ងៃទី ${toKhmerNum(d.getDate())} ខែ${khmerMonth(d.getMonth())} ឆ្នាំ${toKhmerNum(d.getFullYear())}`;
}

/* ================================================================
   Component
   ================================================================ */

export default function ProvinceDailyReport() {
    /* ---- session ---- */
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    /* ---- province selector (admin) ---- */
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | "">("");

    /* ---- districts for rainfall ---- */
    const [districts, setDistricts] = useState<District[]>([]);
    const [districtRows, setDistrictRows] = useState<{
        districtId: number;
        districtName: string;
        stationName: string;
        rainfall: string;
        existingId?: number;
    }[]>([]);
    const [showAddCustomStation, setShowAddCustomStation] = useState(false);
    const [isSavingAllRainfalls, setIsSavingAllRainfalls] = useState(false);

    /* ---- date ---- */
    const [reportDate, setReportDate] = useState(() => new Date().toISOString().split("T")[0]);

    /* ---- report data ---- */
    const [report, setReport] = useState<DailyReportData | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    /* ---- form state: temperature ---- */
    const [maxTemp, setMaxTemp] = useState("");
    const [minTemp, setMinTemp] = useState("");

    /* ---- form state: custom rainfall ---- */
    const [rfStationName, setRfStationName] = useState("");
    const [rfRainfall, setRfRainfall] = useState("");
    const [rfDistrictId, setRfDistrictId] = useState("");

    /* ---- form state: forecast ---- */
    const [forecastText, setForecastText] = useState("");

    /* ---- feedback ---- */
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error" | "">("");

    const isAdmin = sessionUser?.role === "admin";
    const effectiveProvinceId = isAdmin ? selectedProvinceId : sessionUser?.provinceId;

    /* ---- PDF generation state ---- */
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    /* ================================================================
       Init & Districts loader
       ================================================================ */

    const loadDistricts = async (pId?: number | "") => {
        const token = getStoredToken();
        const targetPid = pId || effectiveProvinceId;
        if (!token || !targetPid) return;
        try {
            const res = await fetch(`/api/districts?provinceId=${targetPid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDistricts(data.districts ?? []);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        const init = async () => {
            const token = getStoredToken();
            if (!token) { setLoading(false); return; }
            const user = await fetchSessionUser(token);
            setSessionUser(user);
            if (user?.role === "admin") {
                const res = await fetch("/api/provinces", { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setProvinces(data.provinces ?? []);
                }
            }
            if (user?.provinceId) {
                await loadDistricts(user.provinceId);
            }
            setLoading(false);
        };
        init();
    }, []);

    /* ================================================================
       Load report
       ================================================================ */

    useEffect(() => {
        if (!loading && effectiveProvinceId) {
            loadDistricts(effectiveProvinceId);
            loadReport();
        }
    }, [reportDate, loading, selectedProvinceId]);

    const loadReport = async () => {
        const token = getStoredToken();
        if (!token || !effectiveProvinceId) return;
        setLoadingReport(true);
        try {
            const query = `reportDate=${reportDate}${isAdmin ? `&provinceId=${effectiveProvinceId}` : ""}`;
            const res = await fetch(`/api/province-daily-report?${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setReport(data);
                if (data.districts && Array.isArray(data.districts) && data.districts.length > 0) {
                    setDistricts(data.districts);
                }
                // Pre-fill forms from existing data
                if (data.temperature) {
                    setMaxTemp(String(data.temperature.maxTemp));
                    setMinTemp(String(data.temperature.minTemp));
                } else {
                    setMaxTemp(""); setMinTemp("");
                }
                if (data.forecast) {
                    setForecastText(data.forecast.forecastText);
                } else {
                    setForecastText("");
                }
            }
        } catch { /* ignore */ }
        setLoadingReport(false);
    };

    // Synchronize districtRows when districts or report.rainfalls change
    useEffect(() => {
        if (!districts || districts.length === 0) {
            setDistrictRows([]);
            return;
        }

        const rainfalls = report?.rainfalls ?? [];

        const updatedRows = districts.map((d) => {
            const match = rainfalls.find(
                (r) => r.districtId === d.id || r.stationName === (d.khmerName || d.name)
            );
            const defaultStationName = d.khmerName
                ? (d.khmerName.startsWith("ស្រុក") || d.khmerName.startsWith("ក្រុង") || d.khmerName.startsWith("ខណ្ឌ")
                    ? d.khmerName
                    : `ស្រុក${d.khmerName}`)
                : d.name;

            return {
                districtId: d.id,
                districtName: d.khmerName || d.name,
                stationName: match ? match.stationName : defaultStationName,
                rainfall: match && match.rainfall !== null && match.rainfall !== undefined ? String(match.rainfall) : "",
                existingId: match?.id,
            };
        });

        setDistrictRows(updatedRows);
    }, [districts, report?.rainfalls]);

    /* ================================================================
       Submit handlers
       ================================================================ */

    const flash = (msg: string, type: "success" | "error") => {
        setMessage(msg);
        setMsgType(type);
        setTimeout(() => { setMessage(""); setMsgType(""); }, 3000);
    };

    const handleDistrictRowChange = (districtId: number, field: "stationName" | "rainfall", value: string) => {
        setDistrictRows((prev) =>
            prev.map((row) => (row.districtId === districtId ? { ...row, [field]: value } : row))
        );
    };

    const handleSaveSingleDistrictRow = async (row: {
        districtId: number;
        districtName: string;
        stationName: string;
        rainfall: string;
        existingId?: number;
    }) => {
        const token = getStoredToken();
        if (!token || !effectiveProvinceId) return;

        const val = parseFloat(row.rainfall);
        const rainfallVal = isNaN(val) ? 0 : val;

        const res = await fetch("/api/daily-rainfall", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                id: row.existingId,
                reportDate,
                stationName: row.stationName.trim() || `ស្រុក${row.districtName}`,
                rainfall: rainfallVal,
                districtId: row.districtId,
                provinceId: effectiveProvinceId,
            }),
        });

        if (res.ok) {
            flash(`រក្សាទុកទិន្នន័យភ្លៀងស្រុក ${row.districtName} បានជោគជ័យ`, "success");
            await loadReport();
        } else {
            flash(`មិនអាចរក្សាទុកទិន្នន័យស្រុក ${row.districtName} បានទេ`, "error");
        }
    };

    const handleSaveAllDistrictRows = async () => {
        const token = getStoredToken();
        if (!token || !effectiveProvinceId) return;

        setIsSavingAllRainfalls(true);
        try {
            const entries = districtRows.map((row) => ({
                id: row.existingId,
                districtId: row.districtId,
                stationName: row.stationName.trim() || `ស្រុក${row.districtName}`,
                rainfall: isNaN(parseFloat(row.rainfall)) ? 0 : parseFloat(row.rainfall),
            }));

            const res = await fetch("/api/daily-rainfall", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    reportDate,
                    provinceId: effectiveProvinceId,
                    entries,
                }),
            });

            if (res.ok) {
                flash("រក្សាទុកទិន្នន័យភ្លៀងគ្រប់ស្រុកបានជោគជ័យ", "success");
                await loadReport();
            } else {
                flash("មិនអាចរក្សាទុកទិន្នន័យភ្លៀងបានទេ", "error");
            }
        } catch {
            flash("មានបញ្ហាក្នុងការរក្សាទុក", "error");
        } finally {
            setIsSavingAllRainfalls(false);
        }
    };

    const handleSaveTemperature = async () => {
        const token = getStoredToken();
        if (!token) return;
        const max = parseFloat(maxTemp);
        const min = parseFloat(minTemp);
        if (isNaN(max) || isNaN(min)) { flash("សូមបញ្ចូលសីតុណ្ហភាពឱ្យបានត្រឹមត្រូវ", "error"); return; }
        const res = await fetch("/api/daily-temperature", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ reportDate, maxTemp: max, minTemp: min, provinceId: effectiveProvinceId }),
        });
        if (res.ok) {
            flash("រក្សាទុកសីតុណ្ហភាពបានជោគជ័យ", "success");
            await loadReport();
        } else {
            flash("មិនអាចរក្សាទុកសីតុណ្ហភាពបានទេ", "error");
        }
    };

    const handleAddRainfall = async () => {
        const token = getStoredToken();
        if (!token) return;
        if (!rfStationName.trim()) { flash("សូមបញ្ចូលឈ្មោះស្ថានីយ/ស្រុក", "error"); return; }
        const rainfall = parseFloat(rfRainfall) || 0;
        const res = await fetch("/api/daily-rainfall", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                reportDate,
                stationName: rfStationName.trim(),
                rainfall,
                districtId: rfDistrictId ? Number(rfDistrictId) : undefined,
                provinceId: effectiveProvinceId,
            }),
        });
        if (res.ok) {
            flash("បន្ថែមទិន្នន័យភ្លៀងបានជោគជ័យ", "success");
            setRfStationName("");
            setRfRainfall("");
            setRfDistrictId("");
            setShowAddCustomStation(false);
            await loadReport();
        } else {
            flash("មិនអាចបន្ថែមទិន្នន័យភ្លៀងបានទេ", "error");
        }
    };

    const handleDeleteRainfall = async (id: number) => {
        const token = getStoredToken();
        if (!token) return;
        const res = await fetch(`/api/daily-rainfall?id=${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            flash("លុបទិន្នន័យភ្លៀងបានជោគជ័យ", "success");
            await loadReport();
        } else {
            flash("មិនអាចលុបបានទេ", "error");
        }
    };

    const handleSaveForecast = async () => {
        const token = getStoredToken();
        if (!token) return;
        if (!forecastText.trim()) { flash("សូមបញ្ចូលអត្ថបទការព្យាករណ៍", "error"); return; }
        const res = await fetch("/api/daily-forecast", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ reportDate, forecastText: forecastText.trim(), provinceId: effectiveProvinceId }),
        });
        if (res.ok) {
            flash("រក្សាទុកការព្យាករណ៍បានជោគជ័យ", "success");
            await loadReport();
        } else {
            flash("មិនអាចរក្សាទុកការព្យាករណ៍បានទេ", "error");
        }
    };

    /* ================================================================
       Rainfall totals & Bulletin District Rainfalls
       ================================================================ */

    const customRainfalls = useMemo(() => {
        if (!report?.rainfalls) return [];
        const districtIds = new Set(districts.map((d) => d.id));
        return report.rainfalls.filter((r) => !r.districtId || !districtIds.has(r.districtId));
    }, [report?.rainfalls, districts]);

    const bulletinDistrictRainfalls = useMemo(() => {
        const rainfalls = report?.rainfalls ?? [];
        if (!districts || districts.length === 0) {
            return rainfalls.map((r) => ({
                key: `rf-${r.id}`,
                stationName: r.stationName,
                rainfall: r.rainfall,
            }));
        }

        const list = districts.map((d) => {
            const match = rainfalls.find(
                (r) => r.districtId === d.id || r.stationName === (d.khmerName || d.name)
            );
            const defaultStationName = d.khmerName
                ? (d.khmerName.startsWith("ស្រុក") || d.khmerName.startsWith("ក្រុង") || d.khmerName.startsWith("ខណ្ឌ")
                    ? d.khmerName
                    : `ស្រុក${d.khmerName}`)
                : d.name;

            return {
                key: `district-${d.id}`,
                stationName: match?.stationName || defaultStationName,
                rainfall: match?.rainfall ?? 0,
            };
        });

        const districtIds = new Set(districts.map((d) => d.id));
        const extras = rainfalls
            .filter((r) => !r.districtId || !districtIds.has(r.districtId))
            .map((r) => ({
                key: `custom-${r.id}`,
                stationName: r.stationName,
                rainfall: r.rainfall,
            }));

        return [...list, ...extras];
    }, [districts, report?.rainfalls]);

    const rainfallTotals = useMemo(() => {
        const total = bulletinDistrictRainfalls.length;
        const count = bulletinDistrictRainfalls.filter((item) => Number(item.rainfall) > 0).length;
        const daily = bulletinDistrictRainfalls.reduce((sum, item) => sum + (Number(item.rainfall) || 0), 0);
        return { daily, count, total };
    }, [bulletinDistrictRainfalls]);

    /* ================================================================
       Water levels: split into rivers and reservoirs
       ================================================================ */

    const { riverStations, reservoirStations } = useMemo(() => {
        const allStations = report?.stations ?? [];
        const waterLevels = report?.waterLevels ?? [];

        const rivers: { station: StationData; report: WaterLevelEntry | null }[] = [];
        const reservoirs: { station: StationData; report: WaterLevelEntry | null }[] = [];

        for (const st of allStations) {
            const wl = waterLevels.find((w) => w.station.id === st.id) ?? null;
            const cat = (st.category ?? "").toLowerCase();
            if (cat === "reservoir" || cat === "អាង" || cat === "អាងទឹក") {
                reservoirs.push({ station: st, report: wl });
            } else {
                rivers.push({ station: st, report: wl });
            }
        }

        return { riverStations: rivers, reservoirStations: reservoirs };
    }, [report?.stations, report?.waterLevels]);

    /* ================================================================
       PDF download (reuse existing pattern)
       ================================================================ */

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        await new Promise((r) => setTimeout(r, 150));
        const el = document.getElementById("daily-report-bulletin");
        if (!el) { setIsGeneratingPdf(false); return; }
        try {
            const htmlToImage = await import("html-to-image");
            const jsPDF = (await import("jspdf")).default;
            const imgData = await htmlToImage.toPng(el, {
                quality: 1.0,
                pixelRatio: 2,
                style: { width: "1100px", margin: "0", transform: "none" },
            });
            const pdf = new jsPDF("l", "mm", "a4");
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (el.offsetHeight * pdfW) / el.offsetWidth;
            pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
            pdf.save(`Daily-Report-${reportDate}.pdf`);
        } catch (err) {
            console.error("PDF error:", err);
            alert("មិនអាចបង្កើត PDF បានទេ");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    /* ================================================================
       Province name helper
       ================================================================ */

    const provinceName = useMemo(() => {
        if (isAdmin) {
            return provinces.find((p) => p.id === selectedProvinceId)?.khmerName ?? "...";
        }
        return sessionUser?.provinceName ?? "...";
    }, [isAdmin, provinces, selectedProvinceId, sessionUser?.provinceName]);

    /* ================================================================
       Render
       ================================================================ */

    if (loading) {
        return <p className="text-sm text-slate-500">កំពុងផ្ទុក...</p>;
    }

    return (
        <div className="space-y-6">
            {/* ── Feedback message ── */}
            {message && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msgType === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                    {message}
                </div>
            )}

            {/* ── Admin province selector ── */}
            {isAdmin && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">ជ្រើសរើសខេត្ត</label>
                        <select
                            value={selectedProvinceId}
                            onChange={(e) => setSelectedProvinceId(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-64 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        >
                            <option value="" disabled>ជ្រើសរើសខេត្ត</option>
                            {provinces.map((p) => (
                                <option key={p.id} value={p.id}>{p.khmerName || p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">ជ្រើសរើសកាលបរិច្ឆេទ</label>
                        <input
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="w-48 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>
                </div>
            )}

            {/* ── Non-admin date + data entry ── */}
            {!isAdmin && (
                <div className="space-y-4">
                    {/* Date picker */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <label className="mb-1 block text-sm font-semibold text-slate-700">កាលបរិច្ឆេទរបាយការណ៍</label>
                        <input
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="w-48 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    {/* Section I: Temperature form */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-blue-900">I. សីតុណ្ហភាពប្រចាំថ្ងៃ</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">សីតុណ្ហភាពអតិបរមា (°C)</label>
                                <input type="number" step="0.1" value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} placeholder="ឧ. 37.0"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">សីតុណ្ហភាពអប្បបរមា (°C)</label>
                                <input type="number" step="0.1" value={minTemp} onChange={(e) => setMinTemp(e.target.value)} placeholder="ឧ. 28.0"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div className="flex items-end">
                                <button type="button" onClick={handleSaveTemperature}
                                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                                    រក្សាទុក
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section II: Rainfall form */}
                    <div className="rounded-2xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/50 dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-teal-200/70 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-teal-900 dark:text-teal-300">
                                    II. ទិន្នន័យភ្លៀងតាមបណ្ដាស្រុក
                                </h3>
                                <p className="text-xs text-teal-700 dark:text-slate-400 mt-0.5">
                                    បង្ហាញគ្រប់បណ្ដាស្រុកតាមលំនាំដើម • បញ្ចូលបរិមាណទឹកភ្លៀង (មម)
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200">
                                    សរុប {toKhmerNum(districtRows.length)} ស្រុក
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSaveAllDistrictRows}
                                    disabled={isSavingAllRainfalls || districtRows.length === 0}
                                    className="rounded-xl bg-teal-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isSavingAllRainfalls ? (
                                        <span>កំពុងរក្សាទុក...</span>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>រក្សាទុកទាំងអស់</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* All Districts Table / List */}
                        {districtRows.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-teal-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-teal-100/60 dark:bg-slate-800 text-teal-950 dark:text-teal-200 border-b border-teal-200 dark:border-slate-700 text-xs font-semibold uppercase">
                                            <th className="px-3 py-2.5 text-center w-12">ល.រ</th>
                                            <th className="px-3 py-2.5 text-left w-44">ក្រុង-ស្រុក (District)</th>
                                            <th className="px-3 py-2.5 text-left">ឈ្មោះស្ថានីយ/ក្រុង-ស្រុក</th>
                                            <th className="px-3 py-2.5 text-left w-48">បរិមាណភ្លៀង (មម)</th>
                                            <th className="px-3 py-2.5 text-center w-24">សកម្មភាព</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {districtRows.map((row, index) => (
                                            <tr key={row.districtId} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition">
                                                <td className="px-3 py-2 text-center text-slate-500 font-mono text-xs">
                                                    {toKhmerNum(index + 1)}
                                                </td>
                                                <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                                                    {row.districtName}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.stationName}
                                                        onChange={(e) => handleDistrictRowChange(row.districtId, "stationName", e.target.value)}
                                                        placeholder={`ស្រុក${row.districtName}`}
                                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            value={row.rainfall}
                                                            onChange={(e) => handleDistrictRowChange(row.districtId, "rainfall", e.target.value)}
                                                            placeholder="0"
                                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-right font-mono"
                                                        />
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">មម</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveSingleDistrictRow(row)}
                                                        className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition"
                                                    >
                                                        រក្សាទុក
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic py-2">មិនទាន់មានទិន្នន័យស្រុកសម្រាប់ខេត្តនេះនៅឡើយ</p>
                        )}

                        {/* Extra Custom Stations (if any) */}
                        {customRainfalls.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-teal-200/60 dark:border-slate-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 mb-2">
                                    ស្ថានីយបន្ថែមផ្សេងទៀត (Additional Custom Stations)
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            <tr>
                                                <th className="px-3 py-2 text-left">ឈ្មោះស្ថានីយ</th>
                                                <th className="px-3 py-2 text-right">បរិមាណភ្លៀង (មម)</th>
                                                <th className="px-3 py-2 text-center w-20">សកម្មភាព</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {customRainfalls.map((cr) => (
                                                <tr key={cr.id}>
                                                    <td className="px-3 py-2 text-slate-800 dark:text-white font-medium">{cr.stationName}</td>
                                                    <td className="px-3 py-2 text-right text-slate-800 dark:text-white font-mono">{cr.rainfall} មម</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRainfall(cr.id)}
                                                            className="text-rose-600 hover:text-rose-800 text-xs font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900"
                                                        >
                                                            លុប
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Toggle Add Custom Station */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddCustomStation(!showAddCustomStation)}
                                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                            >
                                <span>{showAddCustomStation ? "▲ បិទផ្ទាំងបន្ថែមស្ថានីយ" : "+ បន្ថែមស្ថានីយក្រៅពីស្រុក (Add Custom Station)"}</span>
                            </button>

                            {showAddCustomStation && (
                                <div className="mt-3 p-4 rounded-xl border border-teal-200 dark:border-slate-800 bg-white/70 dark:bg-slate-850 grid grid-cols-1 gap-3 sm:grid-cols-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">ឈ្មោះស្ថានីយ</label>
                                        <input
                                            value={rfStationName}
                                            onChange={(e) => setRfStationName(e.target.value)}
                                            placeholder="ឧ. ស្ថានីយ៍ស្ទឹង..."
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">បរិមាណភ្លៀង (មម)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={rfRainfall}
                                            onChange={(e) => setRfRainfall(e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">ស្រុក/ខណ្ឌ (ស្រេចចិត្ត)</label>
                                        <select
                                            value={rfDistrictId}
                                            onChange={(e) => setRfDistrictId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                                        >
                                            <option value="">ជ្រើសរើស (ស្រេចចិត្ត)</option>
                                            {districts.map((d) => (
                                                <option key={d.id} value={d.id}>{d.khmerName || d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={handleAddRainfall}
                                            className="w-full rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                                        >
                                            បន្ថែម
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section IV: Forecast form */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-amber-900">IV. ការព្យាករណ៍អាកាសធាតុ</h3>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">អត្ថបទការព្យាករណ៍</label>
                            <textarea value={forecastText} onChange={(e) => setForecastText(e.target.value)} rows={4}
                                placeholder="សូមបញ្ចូលការព្យាករណ៍អាកាសធាតុសម្រាប់រយៈពេលខាងមុខ..."
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                        </div>
                        <button type="button" onClick={handleSaveForecast}
                            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700">
                            រក្សាទុកការព្យាករណ៍
                        </button>
                    </div>
                </div>
            )}

            {/* ── Download PDF button ── */}
            <div className="flex justify-end gap-3">
                <button onClick={() => window.print()}
                    className="rounded-xl bg-slate-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 shadow-sm flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span>បោះពុម្ព</span>
                </button>
                <button onClick={handleDownloadPdf}
                    className="rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700 shadow-sm flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>ទាញយក PDF</span>
                </button>
            </div>

            {/* ════════════════════════════════════════════════════════
               BULLETIN VIEW (printable)
               ════════════════════════════════════════════════════════ */}
            {loadingReport ? (
                <p className="text-sm text-slate-500 text-center py-8">កំពុងផ្ទុកទិន្នន័យ...</p>
            ) : (
                <div id="daily-report-bulletin" className="relative mx-auto max-w-[1100px] bg-white overflow-hidden p-8 font-khmer" style={{ backgroundColor: "#f4f7f6" }}>
                    {/* Background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('/map-bg-placeholder.png')", backgroundSize: "cover", backgroundPosition: "center" }} />

                    {/* ── HEADER ── */}
                    <div className="relative z-10 flex flex-col items-center mb-6">
                        <div className="grid grid-cols-3 w-full items-center px-4">
                            <div className="flex flex-col items-center justify-center col-span-1">
                                <img src={typeof window !== "undefined" ? window.location.origin + "/templates/logo.png" : "/templates/logo.png"} alt="Logo" className="h-24 w-24 object-contain mb-1 drop-shadow-md" />
                                <h3 className="text-[14px] font-bold text-blue-800 leading-snug font-moul text-center">មន្ទីរធនធានទឹក និងឧតុនិយម</h3>
                                <h3 className="text-[14px] font-bold text-blue-800 leading-snug font-moul text-center">ខេត្ត{provinceName}</h3>
                            </div>
                            <div className="flex items-center justify-center col-span-2">
                                <h2 className="text-[22px] font-black tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] text-[#1a1a1a] font-moul text-center">
                                    ព្រឹត្តិបត្រព័ត៌មាន និងការព្យាករណ៍អាកាសធាតុ
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* ── BODY: 2-column layout ── */}
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
                        {/* LEFT COLUMN */}
                        <div className="space-y-5">
                            {/* Section I: Temperature */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 font-moul mb-2">
                                    I. សីតុណ្ហភាព{formatDateKhmer(reportDate)}
                                </h3>
                                <div className="pl-4 text-[14px] text-slate-800 space-y-1">
                                    <p>Max : <strong>{report?.temperature ? `${report.temperature.maxTemp} °C` : "— °C"}</strong></p>
                                    <p>Min : <strong>{report?.temperature ? `${report.temperature.minTemp} °C` : "— °C"}</strong></p>
                                </div>
                            </div>

                            {/* Section II: Rainfall */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 font-moul mb-2">
                                    II. ទិន្នន័យភ្លៀងតាមបណ្ដាស្រុក
                                </h3>
                                <div className="pl-4 text-[14px] text-slate-800 space-y-1">
                                    <p className="font-semibold">បន្ទុកក្រុង-ស្រុក : {toKhmerNum(rainfallTotals.count)}/{toKhmerNum(rainfallTotals.total)}</p>
                                    {bulletinDistrictRainfalls.map((item, i) => (
                                        <p key={item.key}>
                                            {toKhmerNum(i + 1)}. {item.stationName} : {item.rainfall > 0 ? `${item.rainfall} មម` : "០ មម"}
                                        </p>
                                    ))}
                                    {bulletinDistrictRainfalls.length === 0 && (
                                        <p className="text-slate-400 italic">មិនមានទិន្នន័យស្រុក</p>
                                    )}
                                    <div className="mt-3 pt-2 border-t border-slate-300 space-y-1">
                                        <p>ប្រចាំថ្ងៃ : <strong>{rainfallTotals.daily.toFixed(1)} មម</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-5">
                            {/* Section III: Water Levels */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 font-moul mb-3">
                                    III. កម្ពស់ទឹកពិនិត្យឃើញនៅ{formatDateKhmer(reportDate)}
                                </h3>

                                {/* Rivers */}
                                <p className="text-[14px] font-bold text-slate-800 mb-1 pl-2">ក. ទន្លេ</p>
                                <div className="rounded-lg border border-slate-300 overflow-hidden mb-4">
                                    <table className="w-full text-[13px] text-slate-800 border-collapse">
                                        <thead className="bg-[#a6d96a]/40 font-bold">
                                            <tr>
                                                <th className="px-2 py-2 border-r border-white text-left">ឈ្មោះស្ថានីយ</th>
                                                <th className="px-2 py-2 border-r border-white text-center">កម្ពស់ (ម)</th>
                                                <th className="px-2 py-2 border-r border-white text-center">កម្រិតប្រុងប្រយ័ត្ន (ម)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {riverStations.length === 0 && (
                                                <tr><td colSpan={3} className="px-3 py-3 text-center text-slate-400">មិនមានស្ថានីយទន្លេ</td></tr>
                                            )}
                                            {riverStations.map(({ station, report: wl }, i) => (
                                                <tr key={station.id} className={i % 2 === 0 ? "bg-[#d9e8ff] border-b border-white" : "bg-[#b3d4ff] border-b border-white"}>
                                                    <td className="px-2 py-2 border-r border-white">
                                                        {toKhmerNum(i + 1)}. {station.khmerName || station.name}
                                                    </td>
                                                    <td className="px-2 py-2 border-r border-white text-center">
                                                        {wl ? wl.waterLevel.toFixed(2) : "—"}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-red-600 font-bold">
                                                        {station.warningLevel ? station.warningLevel.toFixed(2) : ""}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Reservoirs */}
                                <p className="text-[14px] font-bold text-slate-800 mb-1 pl-2">ខ. អាងទឹក</p>
                                <div className="rounded-lg border border-slate-300 overflow-hidden">
                                    <table className="w-full text-[13px] text-slate-800 border-collapse">
                                        <thead className="bg-[#a6d96a]/40 font-bold">
                                            <tr>
                                                <th className="px-2 py-2 border-r border-white text-left">ឈ្មោះអាងទឹក</th>
                                                <th className="px-2 py-2 border-r border-white text-center">កម្ពស់ (ម)</th>
                                                <th className="px-2 py-2 border-r border-white text-center">កម្រិតស្ដុក (ម)</th>
                                                <th className="px-2 py-2 text-center">កម្រិតប្រុងប្រយ័ត្ន (ម)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reservoirStations.length === 0 && (
                                                <tr><td colSpan={4} className="px-3 py-3 text-center text-slate-400">មិនមានអាងទឹក</td></tr>
                                            )}
                                            {reservoirStations.map(({ station, report: wl }, i) => (
                                                <tr key={station.id} className={i % 2 === 0 ? "bg-[#d9e8ff] border-b border-white" : "bg-[#b3d4ff] border-b border-white"}>
                                                    <td className="px-2 py-2 border-r border-white">
                                                        {toKhmerNum(i + 1)}. {station.khmerName || station.name}
                                                    </td>
                                                    <td className="px-2 py-2 border-r border-white text-center">
                                                        {wl ? wl.waterLevel.toFixed(2) : "—"}
                                                    </td>
                                                    <td className="px-2 py-2 border-r border-white text-center">
                                                        {station.maxCapacityLevel ? station.maxCapacityLevel.toFixed(2) : "—"}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-red-600 font-bold">
                                                        {station.warningLevel ? station.warningLevel.toFixed(2) : ""}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section IV: Forecast (full width bottom) ── */}
                    <div className="relative z-10 mt-6 px-2">
                        <h3 className="text-[15px] font-bold text-slate-800 font-moul mb-2">
                            IV. ការព្យាករណ៍អាកាសធាតុ
                        </h3>
                        <div className="pl-4 text-[14px] text-slate-800 whitespace-pre-line">
                            {report?.forecast?.forecastText || (
                                <span className="text-slate-400 italic">មិនមានការព្យាករណ៍</span>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="relative z-10 mt-8 text-center text-[14px] text-slate-800 font-moul">
                        <p>ការផ្សាយរបស់មន្ទីរធនធានទឹក និងឧតុនិយម សម្រាប់{formatDateKhmer(reportDate)}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
