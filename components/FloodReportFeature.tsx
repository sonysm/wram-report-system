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

interface FloodReport {
    id: number;
    reportDate: string;
    provinceId: number;
    districtId: number | null;
    communesCount: number;
    affectedFamilies: number;
    affectedWaterInfrastructure: number;
    affectedRiceCrops: number;
    damagedRiceCrops: number;
    note: string | null;
    reservoirName: string | null;
    damLength: number;
    mainCanalLength: number;
    subCanalLength: number;
    tertiaryCanalLength: number;
    spillwayLength: number;
    waterGateCount: number;
    pipeCulvertCount: number;
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
    const [affectedWaterInfrastructure, setAffectedWaterInfrastructure] = useState("");
    const [affectedRiceCrops, setAffectedRiceCrops] = useState("");
    const [damagedRiceCrops, setDamagedRiceCrops] = useState("");
    const [note, setNote] = useState("");
    const [reservoirName, setReservoirName] = useState("");
    const [damLength, setDamLength] = useState("");
    const [mainCanalLength, setMainCanalLength] = useState("");
    const [subCanalLength, setSubCanalLength] = useState("");
    const [tertiaryCanalLength, setTertiaryCanalLength] = useState("");
    const [spillwayLength, setSpillwayLength] = useState("");
    const [waterGateCount, setWaterGateCount] = useState("");
    const [pipeCulvertCount, setPipeCulvertCount] = useState("");

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
        setAffectedWaterInfrastructure("");
        setAffectedRiceCrops("");
        setDamagedRiceCrops("");
        setNote("");
        setReservoirName("");
        setDamLength("");
        setMainCanalLength("");
        setSubCanalLength("");
        setTertiaryCanalLength("");
        setSpillwayLength("");
        setWaterGateCount("");
        setPipeCulvertCount("");
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
        setAffectedWaterInfrastructure(r.affectedWaterInfrastructure ? String(r.affectedWaterInfrastructure) : "");
        setAffectedRiceCrops(r.affectedRiceCrops ? String(r.affectedRiceCrops) : "");
        setDamagedRiceCrops(r.damagedRiceCrops ? String(r.damagedRiceCrops) : "");
        setNote(r.note || "");
        setReservoirName(r.reservoirName || "");
        setDamLength(r.damLength ? String(r.damLength) : "");
        setMainCanalLength(r.mainCanalLength ? String(r.mainCanalLength) : "");
        setSubCanalLength(r.subCanalLength ? String(r.subCanalLength) : "");
        setTertiaryCanalLength(r.tertiaryCanalLength ? String(r.tertiaryCanalLength) : "");
        setSpillwayLength(r.spillwayLength ? String(r.spillwayLength) : "");
        setWaterGateCount(r.waterGateCount ? String(r.waterGateCount) : "");
        setPipeCulvertCount(r.pipeCulvertCount ? String(r.pipeCulvertCount) : "");
        
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

        const payload = {
            reportDate,
            provinceId: selectedProvinceId,
            districtId: selectedDistrictId || null,
            communesCount,
            affectedFamilies,
            affectedWaterInfrastructure,
            affectedRiceCrops,
            damagedRiceCrops,
            note,
            reservoirName,
            damLength,
            mainCanalLength,
            subCanalLength,
            tertiaryCanalLength,
            spillwayLength,
            waterGateCount,
            pipeCulvertCount,
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
            {message && (
                <div className={`p-4 rounded-md ${status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {message}
                </div>
            )}
            
            {currentUser?.role !== "admin" && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">កាលបរិច្ឆេទ (Date)</label>
                            <input type="date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ខេត្ត (Province)</label>
                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm p-2 border" value={currentUser?.provinceName || ""} readOnly />
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
                            <label className="block text-sm font-medium text-slate-700">ប៉ះពាល់ហេដ្ឋារចនាសម្ព័ន្ធទឹក</label>
                            <input type="number" min="0" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={affectedWaterInfrastructure} onChange={(e) => setAffectedWaterInfrastructure(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ប៉ះពាល់ស្រូវ-ដំណាំ</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={affectedRiceCrops} onChange={(e) => setAffectedRiceCrops(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ខូចខាតស្រូវ-ដំណាំ</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={damagedRiceCrops} onChange={(e) => setDamagedRiceCrops(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ឈ្មោះអាងទឹក/ប្រព័ន្ធធារាសាស្ត្រ</label>
                            <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={reservoirName} onChange={(e) => setReservoirName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ទំនប់ (ម)</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={damLength} onChange={(e) => setDamLength(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ប្រឡាយមេ (ម)</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={mainCanalLength} onChange={(e) => setMainCanalLength(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ប្រឡាយរង (ម)</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={subCanalLength} onChange={(e) => setSubCanalLength(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ជើងក្អែប (ម)</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={tertiaryCanalLength} onChange={(e) => setTertiaryCanalLength(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">សំណង់បង្ហៀរ (ម)</label>
                            <input type="number" min="0" step="any" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={spillwayLength} onChange={(e) => setSpillwayLength(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ទ្វារទឹក (ចំនួន)</label>
                            <input type="number" min="0" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={waterGateCount} onChange={(e) => setWaterGateCount(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">លូ (ចំនួន)</label>
                            <input type="number" min="0" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" value={pipeCulvertCount} onChange={(e) => setPipeCulvertCount(e.target.value)} />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-slate-700">សំគាល់ (Note)</label>
                            <textarea className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" rows={3} value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                        </div>
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

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th className="px-4 py-3 border-b">ស្រុក</th>
                            <th className="px-4 py-3 border-b">ឃុំ(ចំនួន)</th>
                            <th className="px-4 py-3 border-b">ប៉ះពាល់គ្រួសារ</th>
                            <th className="px-4 py-3 border-b">ហេដ្ឋារចនាសម្ព័ន្ធ</th>
                            <th className="px-4 py-3 border-b">ឈ្មោះអាងទឹក</th>
                            {currentUser?.role !== "admin" && (
                                <th className="px-4 py-3 border-b text-right">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(groupedReports).length === 0 ? (
                            <tr><td colSpan={currentUser?.role !== "admin" ? 6 : 5} className="px-4 py-4 text-center text-slate-500">No reports found</td></tr>
                        ) : (
                            Object.entries(groupedReports).map(([provinceName, items]) => (
                                <React.Fragment key={provinceName}>
                                    <tr className="bg-slate-100">
                                        <td colSpan={currentUser?.role !== "admin" ? 6 : 5} className="px-4 py-2 font-bold text-slate-800">
                                            {provinceName}
                                        </td>
                                    </tr>
                                    {items.map((r) => (
                                        <tr key={r.id} className="border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 pl-8">{r.district?.khmerName || r.district?.name || '-'}</td>
                                            <td className="px-4 py-3">{r.communesCount}</td>
                                            <td className="px-4 py-3">{r.affectedFamilies}</td>
                                            <td className="px-4 py-3">{r.affectedWaterInfrastructure}</td>
                                            <td className="px-4 py-3">{r.reservoirName || '-'}</td>
                                            {currentUser?.role !== "admin" && (
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEdit(r)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
