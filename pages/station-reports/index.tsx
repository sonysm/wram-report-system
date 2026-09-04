import { NextPage } from "next";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getStoredToken, fetchSessionUser, SessionUser } from "../../lib/session";

interface Station {
    id: number;
    name: string;
    khmerName: string;
    warningLevel: number | null;
}

interface StationReport {
    id: number;
    reportDate: string;
    waterLevel: number;
    waterLevelYesterday: number | null;
    waterLevelLastYear: number | null;
    station: {
        name: string;
        warningLevel: number | null;
    };
    user: {
        username: string;
    };
}

const StationReportsPage: NextPage = () => {
    const [stations, setStations] = useState<Station[]>([]);
    const [reports, setReports] = useState<StationReport[]>([]);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    const [provinces, setProvinces] = useState<{ id: number, name: string, khmerName: string, }[]>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | "">("");

    const [stationId, setStationId] = useState<number | "">("");
    const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [waterLevel, setWaterLevel] = useState<number | "">("");
    const [waterLevelYesterday, setWaterLevelYesterday] = useState<number | "">("");
    const [waterLevelLastYear, setWaterLevelLastYear] = useState<number | "">("");

    useEffect(() => {
        const init = async () => {
            const token = getStoredToken();
            if (token) {
                const user = await fetchSessionUser(token);
                setSessionUser(user);
                if (user?.role === "admin") {
                    const res = await fetch("/api/provinces", { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                        const data = await res.json();
                        setProvinces(data.provinces);
                    }
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (!loading) {
            loadStations();
            loadReportsForDate(reportDate);
        }
    }, [reportDate, loading, selectedProvinceId]);

    const loadStations = async () => {
        const token = getStoredToken();
        if (!token) return;
        const query = selectedProvinceId ? `?provinceId=${selectedProvinceId}` : "";
        const res = await fetch(`/api/stations${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setStations(data.stations);
        }
    };

    const loadReportsForDate = async (dateStr: string) => {
        const token = getStoredToken();
        if (!token) return;
        const query = selectedProvinceId ? `&provinceId=${selectedProvinceId}` : "";
        const res = await fetch(`/api/station-reports?reportDate=${dateStr}${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setReports(data.reports);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getStoredToken();
        if (!token) return;

        const payload = {
            stationId: stationId !== "" ? Number(stationId) : undefined,
            reportDate,
            waterLevel: waterLevel !== "" ? Number(waterLevel) : undefined,
            waterLevelYesterday: waterLevelYesterday !== "" ? Number(waterLevelYesterday) : undefined,
            waterLevelLastYear: waterLevelLastYear !== "" ? Number(waterLevelLastYear) : undefined,
        };

        const res = await fetch("/api/station-reports", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setStationId("");
            setWaterLevel("");
            setWaterLevelYesterday("");
            setWaterLevelLastYear("");
            await loadReportsForDate(reportDate);
        } else {
            alert("Failed to create report");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        const token = getStoredToken();
        if (!token) return;
        const res = await fetch(`/api/station-reports/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            await loadReportsForDate(reportDate);
        }
    };

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        // Wait for React to re-render and remove the Actions column
        await new Promise(resolve => setTimeout(resolve, 100));

        const reportElement = document.getElementById("report-bulletin");
        if (!reportElement) {
            setIsGeneratingPdf(false);
            return;
        }

        try {
            const htmlToImage = await import("html-to-image");
            const jsPDF = (await import("jspdf")).default;

            const imgData = await htmlToImage.toPng(reportElement, {
                quality: 1.0,
                pixelRatio: 2,
                style: {
                    width: '1000px',
                    margin: '0',
                    transform: 'none'
                }
            });

            const pdf = new jsPDF("l", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (reportElement.offsetHeight * pdfWidth) / reportElement.offsetWidth;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Water-Level-Report-${reportDate}.pdf`);
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Failed to generate PDF. Check console for details.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <Layout>
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Station Reports</h1>
                        <p className="mt-1 text-slate-500">Manage daily water level reports.</p>
                    </div>
                </div>

                {sessionUser?.role === "admin" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6 flex gap-4 items-center">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Select Province</label>
                            <select value={selectedProvinceId} onChange={e => setSelectedProvinceId(e.target.value === "" ? "" : Number(e.target.value))} className="w-64 rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500">
                                <option value="" disabled>Select a Province</option>
                                {provinces.map(p => (
                                    <option key={p.id} value={p.id}>{p.khmerName || p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Select Date</label>
                            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-48 rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500" />
                        </div>
                    </div>
                )}

                {sessionUser?.role !== "admin" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="lg:col-span-1">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Date</label>
                                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                            <div className="lg:col-span-1">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Station</label>
                                <select value={stationId} onChange={e => setStationId(e.target.value === "" ? "" : Number(e.target.value))} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500">
                                    <option value="" disabled>Select Station</option>
                                    {stations.map(st => (
                                        <option key={st.id} value={st.id}>{st.khmerName ? `${st.khmerName} (${st.name})` : st.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="lg:col-span-1">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Water Level</label>
                                <input type="number" step="any" value={waterLevel} onChange={e => setWaterLevel(e.target.value === "" ? "" : Number(e.target.value))} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                            <div className="lg:col-span-1">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Level (Yesterday)</label>
                                <input type="number" step="any" value={waterLevelYesterday} onChange={e => setWaterLevelYesterday(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500" placeholder="Auto" />
                            </div>
                            <div className="lg:col-span-1">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Level (Last Year)</label>
                                <input type="number" step="any" value={waterLevelLastYear} onChange={e => setWaterLevelLastYear(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500" placeholder="Auto" />
                            </div>
                            <div className="lg:col-span-2 flex items-end">
                                <button type="submit" className="rounded-xl bg-cyan-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700">
                                    រក្សាទុក (Save Report)
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex justify-end">
                    <button onClick={handleDownloadPdf} className="rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700 shadow-sm flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download PDF</span>
                    </button>
                </div>

                <div id="report-bulletin" className="relative mx-auto max-w-[1000px] bg-white overflow-hidden p-8 font-khmer pb-12" style={{ backgroundColor: "#f4f7f6" }}>
                    {/* Background Texture/Watermark placeholder */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('/map-bg-placeholder.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="grid grid-cols-3 w-full items-center mb-6 px-4">
                            <div className="flex flex-col items-center justify-center col-span-1">
                                <img src={typeof window !== 'undefined' ? window.location.origin + "/templates/logo.png" : "/templates/logo.png"} alt="Logo" className="h-28 w-28 object-contain mb-1 drop-shadow-md" />
                                <h3 className="text-[16px] font-bold text-blue-800 leading-snug font-moul">មន្ទីរធនធានទឹក និងឧតុនិយម</h3>
                                <h3 className="text-[16px] font-bold text-blue-800 leading-snug font-moul">
                                    {sessionUser?.role === "admin"
                                        ? `ខេត្ត${provinces.find(p => p.id === selectedProvinceId)?.khmerName || "..."}`
                                        : (sessionUser?.provinceName ? `ខេត្ត${sessionUser.provinceName}` : "ខេត្ត...")}
                                </h3>
                            </div>
                            <div className="flex items-center justify-center col-span-2">
                                <h2 className="text-[25px] font-black tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] text-[#1a1a1a] font-moul text-center">ព្រឹត្តិបត្រព័ត៌មានកម្ពស់ទឹក</h2>
                            </div>
                        </div>

                        <div className="text-[15px] text-slate-800 mb-6 w-full font-moul pl-4">
                            I. កម្ពស់ទឹកពិនិត្យឃើញនៅថ្ងៃទី {reportDate.split('-')[2]} ខែ {reportDate.split('-')[1]} ឆ្នាំ {reportDate.split('-')[0]} តាមស្ថានីយជលសាស្ត្រ ស្ថិតក្នុងភូមិសាស្ត្រខេត្ត{
                                sessionUser?.role === "admin"
                                    ? (provinces.find(p => p.id === selectedProvinceId)?.khmerName || "...")
                                    : (sessionUser?.provinceName || "...")
                            }៖
                        </div>
                    </div>

                    <div className={`relative z-10 rounded-lg border border-slate-300 overflow-hidden ${isGeneratingPdf ? "" : "shadow"}`}>
                        <table className="w-full text-left text-sm text-slate-700 border-collapse">
                            <thead className="bg-[#a6d96a]/50 text-slate-900 border-b-2 border-white font-bold">
                                <tr>
                                    <th className="px-4 py-3 border-r border-white whitespace-nowrap">ឈ្មោះស្ថានីយ</th>
                                    <th className="px-4 py-3 border-r border-white text-center whitespace-nowrap">ទឹកមានកម្ពស់ (ម៉ែត្រ)</th>
                                    <th className="px-4 py-3 border-r border-white text-center whitespace-nowrap">ធៀបម្សិលមិញ (ម៉ែត្រ)</th>
                                    <th className="px-4 py-3 border-r border-white text-center whitespace-nowrap">ធៀបឆ្នាំមុន (ម៉ែត្រ)</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">កម្រិតកម្ពស់ប្រុងប្រយ័ត្ន (ម៉ែត្រ)</th>
                                    {sessionUser?.role !== "admin" && !isGeneratingPdf && (
                                        <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-200">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-[#b3d4ff] text-slate-900 font-medium">
                                {stations.map((st, index) => {
                                    const r = reports.find(rep => rep.station.name === st.name);

                                    const formatDiff = (val: number | null | undefined) => {
                                        if (val === null || val === undefined) return "";
                                        return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
                                    };

                                    const diffYesterday = r && r.waterLevelYesterday !== null ? (r.waterLevel - r.waterLevelYesterday) : null;
                                    const diffLastYear = r && r.waterLevelLastYear !== null ? (r.waterLevel - r.waterLevelLastYear) : null;

                                    const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
                                    const toKhmerNum = (num: number) => num.toString().split('').map(d => khmerNumbers[parseInt(d)] || d).join('');

                                    return (
                                        <tr key={st.id} className={index % 2 === 0 ? "bg-[#d9e8ff] border-b border-white" : "bg-[#b3d4ff] border-b border-white"}>
                                            <td className="px-4 py-3 border-r border-white">{toKhmerNum(index + 1)}. {st.khmerName ? `${st.khmerName} (${st.name})` : st.name}</td>
                                            <td className="px-4 py-3 border-r border-white text-center">{r ? r.waterLevel.toFixed(2) : "-"}</td>
                                            <td className="px-4 py-3 border-r border-white text-center">{r ? formatDiff(diffYesterday) : "-"}</td>
                                            <td className="px-4 py-3 border-r border-white text-center">{r ? formatDiff(diffLastYear) : "-"}</td>
                                            <td className="px-4 py-3 text-center text-red-600 font-bold">{st.warningLevel ? st.warningLevel.toFixed(2) : ""}</td>
                                            {sessionUser?.role !== "admin" && !isGeneratingPdf && (
                                                <td className="px-4 py-3 text-center bg-slate-100/50">
                                                    {r ? (
                                                        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm">Delete</button>
                                                    ) : (
                                                        <button onClick={() => setStationId(st.id)} className="text-cyan-700 hover:text-cyan-900 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm">Select</button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                                {stations.length === 0 && (
                                    <tr className="bg-white">
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                            មិនមានស្ថានីយទេ (No stations available)
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="relative z-10 mt-6 text-center text-sm text-slate-800 font-moul">
                        {/* <p>ស្ថានភាពទឹកទន្លេ ៖ ស្ថានីយជលសាស្ត្រទន្លេសាប និងទន្លេបាសាក់ ទឹកបាននិងកំពុងស្រកជាបន្តបន្ទាប់។</p> */}
                        <p className="mt-2">ការផ្សាយរបស់មន្ទីរធនធានទឹក និងឧតុនិយម សម្រាប់ថ្ងៃទី{reportDate.split('-')[2]} ខែ{reportDate.split('-')[1]} ឆ្នាំ{reportDate.split('-')[0]}</p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default StationReportsPage;
