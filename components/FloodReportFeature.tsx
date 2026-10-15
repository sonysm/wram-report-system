import React, { useEffect, useState } from "react";

interface CurrentUser {
    id: number;
    username: string;
    role: string;
    provinceId: number | null;
    provinceName: string | null;
}

interface District {
    id: number;
    name: string;
    khmerName?: string | null;
    provinceId: number;
}

interface ProvinceOption {
    id: number;
    name: string;
    khmerName: string;
    sortOrder: number | null;
}

interface WaterInfrastructure {
    id?: number;
    name: string; // ឈ្មោះអាងទឹក/ប្រព័ន្ធធារាសាស្ត្រ
    damLength: number | string; // ទំនប់ (ម)
    mainCanalLength: number | string; // ប្រឡាយមេ (ម)
    subCanalLength: number | string; // ប្រឡាយរង (ម)
    tertiaryCanalLength: number | string; // ជើងក្អែប (ម)
    spillwayLength: number | string; // សំណង់បង្ហៀរ (ម)
    waterGateCount: number | string; // ទ្វារទឹក (ចំនួន)
    pipeCulvertCount: number | string; // លូ (ចំនួន)
    note?: string;
}

interface FloodReport {
    id: number;
    reportDate: string;
    provinceId: number;
    districtId: number | null;
    communesCount: number;
    affectedFamilies: number;
    affectedRiceCrops: number;
    damagedRiceCrops: number;
    note: string | null;
    waterInfrastructures: WaterInfrastructure[];
    province?: { name: string; khmerName: string };
    district?: { name: string; khmerName: string };
    user?: { username: string };
}

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
}

export default function FloodReportFeature() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [reports, setReports] = useState<FloodReport[]>([]);

    // Form fields
    const [reportDate, setReportDate] = useState("");
    const [selectedProvinceId, setSelectedProvinceId] = useState("");
    const [selectedDistrictId, setSelectedDistrictId] = useState("");
    const [communesCount, setCommunesCount] = useState("");
    const [affectedFamilies, setAffectedFamilies] = useState("");
    const [affectedRiceCrops, setAffectedRiceCrops] = useState("");
    const [damagedRiceCrops, setDamagedRiceCrops] = useState("");
    const [note, setNote] = useState("");
    const [waterInfrastructures, setWaterInfrastructures] = useState<WaterInfrastructure[]>([]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"success" | "error" | "">("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const authHeaders = (token: string) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    });

    const loadData = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const userRes = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
            if (userRes.ok) {
                const user = await userRes.json();
                setCurrentUser(user);
                if (user.role !== "admin" && user.provinceId) {
                    setSelectedProvinceId(String(user.provinceId));
                }
            }

            const distRes = await fetch("/api/districts", { headers: { Authorization: `Bearer ${token}` } });
            if (distRes.ok) {
                const payload = await distRes.json();
                setDistricts(payload.districts ?? []);
            }

            const provRes = await fetch("/api/provinces", { headers: { Authorization: `Bearer ${token}` } });
            if (provRes.ok) {
                const payload = await provRes.json();
                setProvinces(payload.provinces ?? []);
            }

            const repRes = await fetch("/api/flood-reports", { headers: { Authorization: `Bearer ${token}` } });
            if (repRes.ok) {
                const payload = await repRes.json();
                setReports(payload);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setReportDate("");
        setSelectedDistrictId("");
        setCommunesCount("");
        setAffectedFamilies("");
        setAffectedRiceCrops("");
        setDamagedRiceCrops("");
        setNote("");
        setWaterInfrastructures([]);
        setEditingId(null);
        if (currentUser?.role === "admin") {
            setSelectedProvinceId("");
        }
    };

    const handleEdit = (r: FloodReport) => {
        setEditingId(r.id);
        setReportDate(r.reportDate ? r.reportDate.substring(0, 10) : "");
        setSelectedProvinceId(r.provinceId ? String(r.provinceId) : "");
        setSelectedDistrictId(r.districtId ? String(r.districtId) : "");
        setCommunesCount(r.communesCount ? String(r.communesCount) : "");
        setAffectedFamilies(r.affectedFamilies ? String(r.affectedFamilies) : "");
        setAffectedRiceCrops(r.affectedRiceCrops ? String(r.affectedRiceCrops) : "");
        setDamagedRiceCrops(r.damagedRiceCrops ? String(r.damagedRiceCrops) : "");
        setNote(r.note || "");
        setWaterInfrastructures(
            r.waterInfrastructures?.map((wi) => ({
                id: wi.id,
                name: wi.name || "",
                damLength: wi.damLength ?? 0,
                mainCanalLength: wi.mainCanalLength ?? 0,
                subCanalLength: wi.subCanalLength ?? 0,
                tertiaryCanalLength: wi.tertiaryCanalLength ?? 0,
                spillwayLength: wi.spillwayLength ?? 0,
                waterGateCount: wi.waterGateCount ?? 0,
                pipeCulvertCount: wi.pipeCulvertCount ?? 0,
                note: wi.note || "",
            })) || []
        );
        
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/flood-reports/${id}`, {
                method: "DELETE",
                headers: authHeaders(token),
            });
            if (res.ok) {
                setReports((prev) => prev.filter((r) => r.id !== id));
                setMessage("Deleted successfully!");
                setStatus("success");
            } else {
                setMessage("Failed to delete.");
                setStatus("error");
            }
        } catch (error) {
            setMessage("Error deleting.");
            setStatus("error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setStatus("");
        const token = getToken();
        if (!token) return;

        const resolvedProvinceId = currentUser?.role === "admin" 
            ? selectedProvinceId 
            : (currentUser?.provinceId ? String(currentUser.provinceId) : selectedProvinceId);

        if (!resolvedProvinceId) {
            setMessage("សូមជ្រើសរើសខេត្ត (Province is required)");
            setStatus("error");
            return;
        }

        const payload = {
            reportDate,
            provinceId: resolvedProvinceId,
            districtId: selectedDistrictId || null,
            communesCount,
            affectedFamilies,
            affectedRiceCrops,
            damagedRiceCrops,
            note,
            waterInfrastructures,
        };

        try {
            setIsSubmitting(true);
            const url = editingId ? `/api/flood-reports/${editingId}` : "/api/flood-reports";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setMessage("Saved successfully!");
                setStatus("success");
                resetForm();
                // refresh
                const repRes = await fetch("/api/flood-reports", { headers: authHeaders(token) });
                if (repRes.ok) {
                    setReports(await repRes.json());
                }
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to save.");
                setStatus("error");
            }
        } catch (error) {
            setMessage("An error occurred.");
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const addWaterInfrastructure = () => {
        setWaterInfrastructures([
            ...waterInfrastructures,
            {
                name: "",
                damLength: "",
                mainCanalLength: "",
                subCanalLength: "",
                tertiaryCanalLength: "",
                spillwayLength: "",
                waterGateCount: "",
                pipeCulvertCount: "",
                note: "",
            },
        ]);
    };

    const removeWaterInfrastructure = (index: number) => {
        setWaterInfrastructures(waterInfrastructures.filter((_, i) => i !== index));
    };

    const updateWaterInfrastructure = (index: number, field: keyof WaterInfrastructure, value: any) => {
        const updated = [...waterInfrastructures];
        updated[index] = { ...updated[index], [field]: value };
        setWaterInfrastructures(updated);
    };

    if (isLoading) return <div>Loading...</div>;

    const activeProvinceId = currentUser?.role === "admin" ? selectedProvinceId : currentUser?.provinceId;
    const filteredDistricts = activeProvinceId
        ? districts.filter((d) => d.provinceId === Number(activeProvinceId))
        : [];

    const groupedReports = reports.reduce((acc, curr) => {
        const pName = curr.province?.khmerName || curr.province?.name || 'Unknown';
        if (!acc[pName]) acc[pName] = [];
        acc[pName].push(curr);
        return acc;
    }, {} as Record<string, FloodReport[]>);

    return (
        <div className="space-y-6">
            <div className="no-print flex justify-end mb-4">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    បោះពុម្ពរបាយការណ៍
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-md no-print ${status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {message}
                </div>
            )}
            
            {currentUser && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 no-print">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">កាលបរិច្ឆេទ (Date)</label>
                            <input type="date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ខេត្ត (Province)</label>
                            {currentUser.role === "admin" ? (
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border"
                                    value={selectedProvinceId}
                                    onChange={(e) => {
                                        setSelectedProvinceId(e.target.value);
                                        setSelectedDistrictId("");
                                    }}
                                    required
                                >
                                    <option value="">-- ជ្រើសរើសខេត្ត --</option>
                                    {provinces.map((p) => (
                                        <option key={p.id} value={p.id}>{p.khmerName || p.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm p-2 border" value={currentUser?.provinceName || ""} readOnly />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ក្រុង/ស្រុក (District)</label>
                            <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)}>
                                <option value="">-- ជ្រើសរើសក្រុង/ស្រុក --</option>
                                {filteredDistricts.map((d) => (
                                    <option key={d.id} value={d.id}>{d.khmerName || d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ឃុំ (ចំនួន)</label>
                            <input type="number" min="0" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={communesCount} onChange={(e) => setCommunesCount(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ប៉ះពាល់គ្រួសារ</label>
                            <input type="number" min="0" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={affectedFamilies} onChange={(e) => setAffectedFamilies(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ប៉ះពាល់ស្រូវ-ដំណាំ</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={affectedRiceCrops} onChange={(e) => setAffectedRiceCrops(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ខូចខាតស្រូវ-ដំណាំ</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={damagedRiceCrops} onChange={(e) => setDamagedRiceCrops(e.target.value)} />
                        </div>
                        <div className="md:col-span-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">សំគាល់ (Note)</label>
                            <textarea className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" rows={1} value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-slate-900">ហេដ្ឋារចនាសម្ព័ន្ធទឹក</h3>
                            <button
                                type="button"
                                onClick={addWaterInfrastructure}
                                className="px-3 py-1 bg-slate-100 text-slate-700 rounded border border-slate-300 hover:bg-slate-200 text-sm flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                បន្ថែម
                            </button>
                        </div>
                        
                        {waterInfrastructures.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">មិនមានហេដ្ឋារចនាសម្ព័ន្ធទឹកទេ</p>
                        ) : (
                            <div className="space-y-4">
                                {waterInfrastructures.map((wi, index) => (
                                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
                                        <button
                                            type="button"
                                            onClick={() => removeWaterInfrastructure(index)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                                            title="លុប"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-slate-700">ឈ្មោះអាងទឹក/ប្រព័ន្ធធារាសាស្ត្រ</label>
                                                <input
                                                    type="text"
                                                    placeholder="ឈ្មោះអាងទឹក ឬ ប្រព័ន្ធធារាសាស្ត្រ"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.name}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">ទំនប់ (ម)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.damLength}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'damLength', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">ប្រឡាយមេ (ម)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.mainCanalLength}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'mainCanalLength', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">ប្រឡាយរង (ម)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.subCanalLength}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'subCanalLength', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">ជើងក្អែប (ម)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.tertiaryCanalLength}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'tertiaryCanalLength', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">សំណង់បង្ហៀរ (ម)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.spillwayLength}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'spillwayLength', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">ទ្វារទឹក (ចំនួន)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.waterGateCount}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'waterGateCount', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700">លូ (ចំនួន)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.pipeCulvertCount}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'pipeCulvertCount', e.target.value)}
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-medium text-slate-700">ផ្សេងៗ</label>
                                                <input
                                                    type="text"
                                                    placeholder="កំណត់សំគាល់បន្ថែម"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-1.5 border text-sm"
                                                    value={wi.note || ''}
                                                    onChange={(e) => updateWaterInfrastructure(index, 'note', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        {editingId && (
                            <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">
                                Cancel
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? "Saving..." : editingId ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            )}

            <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8 overflow-x-auto">
                <div className="space-y-2 text-center text-slate-900">
                    <p className="text-sm tracking-wide font-moul">ព្រះរាជាណាចក្រកម្ពុជា</p>
                    <p className="text-sm font-moul">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                </div>

                <div className="mt-3 grid gap-3 text-slate-900 sm:grid-cols-3 sm:items-start">
                    <div className="text-center text-sm leading-relaxed font-moul">
                        <img src="/templates/logo.png" alt="Logo" className="mx-auto mb-2 h-12 w-12 object-contain" />
                        ក្រសួងធនធានទឹក និងឧតុនិយម <br />
                        មន្ទីរធនធានទឹក និងឧតុនិយម{currentUser?.provinceName ? `ខេត្ត${currentUser.provinceName}` : ""}
                    </div>
                    <div className="text-center mt-6">
                        <p className="mt-4 inline-block font-moul text-base print-title">
                            របាយការណ៍ទឹកជំនន់
                        </p>
                    </div>
                </div>
                
                <table className="print-table min-w-full border-collapse text-xs mt-5">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th rowSpan={2} className="px-3 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle">ស្រុក</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle">ឃុំ (ចំនួន)</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle">ប៉ះពាល់គ្រួសារ</th>
                            <th colSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle">ស្រូវ-ដំណាំ</th>
                            <th colSpan={8} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle">ហេដ្ឋារចនាសម្ព័ន្ធទឹក</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle">សំគាល់</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle no-print">Action</th>
                        </tr>
                        <tr>
                            {/* ស្រូវ-ដំណាំ */}
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ប៉ះពាល់ (ហ.ត)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ខូចខាត (ហ.ត)</th>
                            {/* ហេដ្ឋារចនាសម្ព័ន្ធទឹក */}
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ឈ្មោះអាងទឹក/ប្រព័ន្ធធារាសាស្ត្រ</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ទំនប់ (ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ប្រឡាយមេ (ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ប្រឡាយរង (ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ជើងក្អែប (ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">សំណង់បង្ហៀរ (ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">ទ្វារទឹក (ចំនួន)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-slate-100 font-moul text-center align-middle text-[11px]">លូ (ចំនួន)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(groupedReports).length === 0 ? (
                            <tr><td colSpan={15} className="px-4 py-4 text-center text-slate-500 border border-slate-300">No reports found</td></tr>
                        ) : (
                            Object.entries(groupedReports).map(([provinceName, items]) => {
                                const totalCommunes = items.reduce((sum, r) => sum + (Number(r.communesCount) || 0), 0);
                                const totalFamilies = items.reduce((sum, r) => sum + (Number(r.affectedFamilies) || 0), 0);
                                const totalAffectedRice = items.reduce((sum, r) => sum + (Number(r.affectedRiceCrops) || 0), 0);
                                const totalDamagedRice = items.reduce((sum, r) => sum + (Number(r.damagedRiceCrops) || 0), 0);

                                let totalDam = 0;
                                let totalMainCanal = 0;
                                let totalSubCanal = 0;
                                let totalTertiaryCanal = 0;
                                let totalSpillway = 0;
                                let totalWaterGates = 0;
                                let totalCulverts = 0;

                                items.forEach((r) => {
                                    r.waterInfrastructures?.forEach((wi) => {
                                        totalDam += Number(wi.damLength) || 0;
                                        totalMainCanal += Number(wi.mainCanalLength) || 0;
                                        totalSubCanal += Number(wi.subCanalLength) || 0;
                                        totalTertiaryCanal += Number(wi.tertiaryCanalLength) || 0;
                                        totalSpillway += Number(wi.spillwayLength) || 0;
                                        totalWaterGates += Number(wi.waterGateCount) || 0;
                                        totalCulverts += Number(wi.pipeCulvertCount) || 0;
                                    });
                                });

                                return (
                                    <React.Fragment key={provinceName}>
                                        <tr className="bg-slate-100">
                                            <td colSpan={15} className="px-4 py-2 font-bold text-slate-800 border border-slate-300">
                                                {provinceName}
                                            </td>
                                        </tr>
                                        {items.map((r) => {
                                            const wiList = r.waterInfrastructures && r.waterInfrastructures.length > 0 ? r.waterInfrastructures : null;
                                            const rowSpanCount = wiList ? wiList.length : 1;
                                            const canEdit = currentUser?.role === "admin" || (currentUser?.provinceId && currentUser.provinceId === r.provinceId);

                                            return (
                                                <React.Fragment key={r.id}>
                                                    <tr className="border-b hover:bg-slate-50">
                                                        <td rowSpan={rowSpanCount} className="px-3 py-2 border border-slate-300 font-medium align-middle">
                                                            {r.district?.khmerName || r.district?.name || '-'}
                                                        </td>
                                                        <td rowSpan={rowSpanCount} className="px-2 py-2 border border-slate-300 text-center align-middle">
                                                            {r.communesCount || 0}
                                                        </td>
                                                        <td rowSpan={rowSpanCount} className="px-2 py-2 border border-slate-300 text-center align-middle">
                                                            {r.affectedFamilies || 0}
                                                        </td>
                                                        <td rowSpan={rowSpanCount} className="px-2 py-2 border border-slate-300 text-center align-middle">
                                                            {r.affectedRiceCrops || 0}
                                                        </td>
                                                        <td rowSpan={rowSpanCount} className="px-2 py-2 border border-slate-300 text-center align-middle">
                                                            {r.damagedRiceCrops || 0}
                                                        </td>
                                                        {/* First water infra or empty */}
                                                        <td className="px-2 py-2 border border-slate-300 text-left">
                                                            {wiList ? (wiList[0].name || '-') : '-'}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].damLength || 0) : 0}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].mainCanalLength || 0) : 0}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].subCanalLength || 0) : 0}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].tertiaryCanalLength || 0) : 0}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].spillwayLength || 0) : 0}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].waterGateCount || 0) : 0}
                                                        </td>
                                                        <td className="px-2 py-2 border border-slate-300 text-center">
                                                            {wiList ? (wiList[0].pipeCulvertCount || 0) : 0}
                                                        </td>
                                                        <td rowSpan={rowSpanCount} className="px-2 py-2 border border-slate-300 text-left align-middle text-xs">
                                                            {r.note || '-'}
                                                        </td>
                                                        <td rowSpan={rowSpanCount} className="px-2 py-2 border border-slate-300 text-center align-middle no-print">
                                                            {canEdit && (
                                                                <>
                                                                    <button onClick={() => handleEdit(r)} className="text-blue-600 hover:underline mr-2">Edit</button>
                                                                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {wiList && wiList.slice(1).map((wi, subIdx) => (
                                                        <tr key={`${r.id}-wi-${subIdx}`} className="border-b hover:bg-slate-50">
                                                            <td className="px-2 py-2 border border-slate-300 text-left">
                                                                {wi.name || '-'}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.damLength || 0}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.mainCanalLength || 0}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.subCanalLength || 0}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.tertiaryCanalLength || 0}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.spillwayLength || 0}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.waterGateCount || 0}
                                                            </td>
                                                            <td className="px-2 py-2 border border-slate-300 text-center">
                                                                {wi.pipeCulvertCount || 0}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                        {/* Total summary row for the province */}
                                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                                            <td className="px-3 py-2 border border-slate-300 text-center">សរុប</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalCommunes}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalFamilies}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalAffectedRice}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalDamagedRice}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">-</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalDam}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalMainCanal}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalSubCanal}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalTertiaryCanal}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalSpillway}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalWaterGates}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">{totalCulverts}</td>
                                            <td className="px-2 py-2 border border-slate-300 text-center">-</td>
                                            <td className="px-2 py-2 border border-slate-300 no-print"></td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>

                <div className="mt-8 flex justify-between text-sm text-slate-900 break-inside-avoid">
                    <div className="text-center">
                        <p className="font-moul mb-16">បានឃើញ និងឯកភាព<br />ប្រធានមន្ទីរ</p>
                    </div>
                    <div className="text-center">
                        <p>ធ្វើនៅ................ថ្ងៃទី........ខែ........ឆ្នាំ........</p>
                        <p className="font-moul mb-16">អ្នកធ្វើរបាយការណ៍</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
