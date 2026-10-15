import React, { useEffect, useState, useMemo } from "react";

interface CurrentUser {
    id: number;
    username: string;
    role: string;
    provinceId: number | null;
    provinceName: string | null;
}

interface ProvinceOption {
    id: number;
    name: string;
    khmerName: string;
    sortOrder: number | null;
}

interface District {
    id: number;
    name: string;
    khmerName?: string | null;
    provinceId: number;
}

interface Commune {
    id: number;
    name: string;
    khmerName?: string | null;
    provinceId: number;
    districtId: number | null;
}

interface WaterwayItem {
    id: number;
    provinceId: number;
    type: string;
    name: string;
    length: number;
    upstreamDistrictId: number | null;
    upstreamCommuneId: number | null;
    upstreamLocationX: string | null;
    upstreamLocationY: string | null;
    upstreamWidth: number;
    upstreamElevation: number;
    downstreamDistrictId: number | null;
    downstreamCommuneId: number | null;
    downstreamLocationX: string | null;
    downstreamLocationY: string | null;
    downstreamWidth: number;
    downstreamElevation: number;
    note: string | null;
    createdAt: string;
    province?: { id: number; name: string; khmerName: string; sortOrder?: number | null };
    upstreamDistrict?: { id: number; name: string; khmerName: string } | null;
    upstreamCommune?: { id: number; name: string; khmerName: string } | null;
    downstreamDistrict?: { id: number; name: string; khmerName: string } | null;
    downstreamCommune?: { id: number; name: string; khmerName: string } | null;
    user?: { id: number; username: string };
}

const WATERWAY_TYPES = ["ទន្លេ", "ស្ទឹង", "ព្រែក", "អូរ"];

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
}

export default function WaterwayFeature() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [communes, setCommunes] = useState<Commune[]>([]);
    const [waterways, setWaterways] = useState<WaterwayItem[]>([]);

    // Filter states
    const [selectedFilterType, setSelectedFilterType] = useState<string>("ទាំងអស់");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedFilterProvinceId, setSelectedFilterProvinceId] = useState<string>("");

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedProvinceId, setSelectedProvinceId] = useState("");
    const [type, setType] = useState("ស្ទឹង");
    const [name, setName] = useState("");
    const [length, setLength] = useState("");

    // Upstream
    const [upstreamDistrictId, setUpstreamDistrictId] = useState("");
    const [upstreamCommuneId, setUpstreamCommuneId] = useState("");
    const [upstreamLocationX, setUpstreamLocationX] = useState("");
    const [upstreamLocationY, setUpstreamLocationY] = useState("");
    const [upstreamWidth, setUpstreamWidth] = useState("");
    const [upstreamElevation, setUpstreamElevation] = useState("");

    // Downstream
    const [downstreamDistrictId, setDownstreamDistrictId] = useState("");
    const [downstreamCommuneId, setDownstreamCommuneId] = useState("");
    const [downstreamLocationX, setDownstreamLocationX] = useState("");
    const [downstreamLocationY, setDownstreamLocationY] = useState("");
    const [downstreamWidth, setDownstreamWidth] = useState("");
    const [downstreamElevation, setDownstreamElevation] = useState("");

    const [note, setNote] = useState("");

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
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const userRes = await fetch("/api/me", { headers: authHeaders(token) });
            if (userRes.ok) {
                const user = await userRes.json();
                setCurrentUser(user);
                if (user.role !== "admin" && user.provinceId) {
                    setSelectedProvinceId(String(user.provinceId));
                }
            }

            const provRes = await fetch("/api/provinces", { headers: authHeaders(token) });
            if (provRes.ok) {
                const pData = await provRes.json();
                setProvinces(pData.provinces || pData || []);
            }

            const distRes = await fetch("/api/districts", { headers: authHeaders(token) });
            if (distRes.ok) {
                const dData = await distRes.json();
                setDistricts(dData.districts || dData || []);
            }

            const comRes = await fetch("/api/communes", { headers: authHeaders(token) });
            if (comRes.ok) {
                const cData = await comRes.json();
                setCommunes(cData.communes || cData || []);
            }

            const wwRes = await fetch("/api/waterways", { headers: authHeaders(token) });
            if (wwRes.ok) {
                const wwData = await wwRes.json();
                setWaterways(wwData);
            }
        } catch (error) {
            console.error("Load waterways error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setType("ស្ទឹង");
        setName("");
        setLength("");
        setUpstreamDistrictId("");
        setUpstreamCommuneId("");
        setUpstreamLocationX("");
        setUpstreamLocationY("");
        setUpstreamWidth("");
        setUpstreamElevation("");
        setDownstreamDistrictId("");
        setDownstreamCommuneId("");
        setDownstreamLocationX("");
        setDownstreamLocationY("");
        setDownstreamWidth("");
        setDownstreamElevation("");
        setNote("");
        if (currentUser?.role === "admin") {
            setSelectedProvinceId("");
        }
        setShowForm(false);
    };

    const handleEdit = (item: WaterwayItem) => {
        setEditingId(item.id);
        setSelectedProvinceId(String(item.provinceId));
        setType(item.type || "ស្ទឹង");
        setName(item.name || "");
        setLength(item.length ? String(item.length) : "");
        setUpstreamDistrictId(item.upstreamDistrictId ? String(item.upstreamDistrictId) : "");
        setUpstreamCommuneId(item.upstreamCommuneId ? String(item.upstreamCommuneId) : "");
        setUpstreamLocationX(item.upstreamLocationX || "");
        setUpstreamLocationY(item.upstreamLocationY || "");
        setUpstreamWidth(item.upstreamWidth ? String(item.upstreamWidth) : "");
        setUpstreamElevation(item.upstreamElevation ? String(item.upstreamElevation) : "");
        setDownstreamDistrictId(item.downstreamDistrictId ? String(item.downstreamDistrictId) : "");
        setDownstreamCommuneId(item.downstreamCommuneId ? String(item.downstreamCommuneId) : "");
        setDownstreamLocationX(item.downstreamLocationX || "");
        setDownstreamLocationY(item.downstreamLocationY || "");
        setDownstreamWidth(item.downstreamWidth ? String(item.downstreamWidth) : "");
        setDownstreamElevation(item.downstreamElevation ? String(item.downstreamElevation) : "");
        setNote(item.note || "");
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("តើលោកអ្នកពិតជាចង់លុបទិន្នន័យផ្លូវទឹកនេះមែនទេ? (Are you sure you want to delete this?)")) {
            return;
        }

        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/waterways/${id}`, {
                method: "DELETE",
                headers: authHeaders(token),
            });

            if (res.ok) {
                setWaterways((prev) => prev.filter((item) => item.id !== id));
                setMessage("បានលុបទិន្នន័យដោយជោគជ័យ! (Deleted successfully)");
                setStatus("success");
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to delete.");
                setStatus("error");
            }
        } catch {
            setMessage("Error deleting waterway.");
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

        if (!name.trim()) {
            setMessage("សូមបញ្ចូលឈ្មោះ (Name is required)");
            setStatus("error");
            return;
        }

        const payload = {
            provinceId: resolvedProvinceId,
            type,
            name: name.trim(),
            length,
            upstreamDistrictId,
            upstreamCommuneId,
            upstreamLocationX,
            upstreamLocationY,
            upstreamWidth,
            upstreamElevation,
            downstreamDistrictId,
            downstreamCommuneId,
            downstreamLocationX,
            downstreamLocationY,
            downstreamWidth,
            downstreamElevation,
            note,
        };

        try {
            setIsSubmitting(true);
            const url = editingId ? `/api/waterways/${editingId}` : "/api/waterways";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setMessage(editingId ? "បានកែប្រែដោយជោគជ័យ! (Updated successfully)" : "បានរក្សាទុកដោយជោគជ័យ! (Saved successfully)");
                setStatus("success");
                resetForm();

                // Refresh data
                const refreshRes = await fetch("/api/waterways", { headers: authHeaders(token) });
                if (refreshRes.ok) {
                    setWaterways(await refreshRes.json());
                }
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to save.");
                setStatus("error");
            }
        } catch {
            setMessage("An error occurred while saving.");
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter districts based on selected province
    const activeProvinceId = currentUser?.role === "admin" ? selectedProvinceId : currentUser?.provinceId;
    const currentDistricts = activeProvinceId
        ? districts.filter((d) => d.provinceId === Number(activeProvinceId))
        : districts;

    // Filter communes for upstream and downstream
    const upstreamCommunes = upstreamDistrictId
        ? communes.filter((c) => c.districtId === Number(upstreamDistrictId))
        : [];

    const downstreamCommunes = downstreamDistrictId
        ? communes.filter((c) => c.districtId === Number(downstreamDistrictId))
        : [];

    // Filtered list for display
    const filteredWaterways = useMemo(() => {
        return waterways.filter((item) => {
            if (selectedFilterType !== "ទាំងអស់" && item.type !== selectedFilterType) {
                return false;
            }
            if (selectedFilterProvinceId && String(item.provinceId) !== selectedFilterProvinceId) {
                return false;
            }
            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                const matchName = item.name.toLowerCase().includes(q);
                const matchUpDistrict = item.upstreamDistrict?.khmerName?.toLowerCase().includes(q) || item.upstreamDistrict?.name?.toLowerCase().includes(q);
                const matchDownDistrict = item.downstreamDistrict?.khmerName?.toLowerCase().includes(q) || item.downstreamDistrict?.name?.toLowerCase().includes(q);
                return matchName || matchUpDistrict || matchDownDistrict;
            }
            return true;
        });
    }, [waterways, selectedFilterType, selectedFilterProvinceId, searchQuery]);

    // Statistics
    const stats = useMemo(() => {
        const total = waterways.length;
        const rivers = waterways.filter((w) => w.type === "ទន្លេ").length;
        const streams = waterways.filter((w) => w.type === "ស្ទឹង").length;
        const creeks = waterways.filter((w) => w.type === "ព្រែក").length;
        const canals = waterways.filter((w) => w.type === "អូរ").length;
        const totalLength = waterways.reduce((sum, w) => sum + (Number(w.length) || 0), 0);
        return { total, rivers, streams, creeks, canals, totalLength };
    }, [waterways]);

    // Grouping by province
    const groupedWaterways = useMemo(() => {
        return filteredWaterways.reduce((acc, curr) => {
            const pName = curr.province?.khmerName || curr.province?.name || "មិនស្គាល់ខេត្ត";
            if (!acc[pName]) acc[pName] = [];
            acc[pName].push(curr);
            return acc;
        }, {} as Record<string, WaterwayItem[]>);
    }, [filteredWaterways]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 font-medium">កំពុងទាញយកទិន្នន័យ... (Loading...)</div>;
    }

    return (
        <div className="space-y-6">
            {/* Top Bar with Print & Add Record Button */}
            <div className="no-print flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">បញ្ជីផ្លូវទឹកធម្មជាតិ (ទន្លេ ស្ទឹង ព្រែក អូរ)</h2>
                    <p className="text-sm text-slate-500">កត់ត្រា និងគ្រប់គ្រងទិន្នន័យទន្លេ ស្ទឹង ព្រែក អូរ តាមបណ្តាខេត្ត</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        បោះពុម្ពបញ្ជី (Print)
                    </button>
                    <button
                        onClick={() => {
                            if (showForm && editingId) {
                                resetForm();
                            } else {
                                setShowForm(!showForm);
                            }
                        }}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        {showForm ? "លាក់ទម្រង់ (Close)" : "បញ្ចូលផ្លូវទឹកថ្មី (Add Waterway)"}
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-500 font-medium">សរុបទាំងអស់</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-xs">
                    <p className="text-xs text-blue-700 font-medium">ទន្លេ</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">{stats.rivers}</p>
                </div>
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 shadow-xs">
                    <p className="text-xs text-teal-700 font-medium">ស្ទឹង</p>
                    <p className="text-2xl font-bold text-teal-800 mt-1">{stats.streams}</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 shadow-xs">
                    <p className="text-xs text-amber-700 font-medium">ព្រែក</p>
                    <p className="text-2xl font-bold text-amber-800 mt-1">{stats.creeks}</p>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-xs">
                    <p className="text-xs text-emerald-700 font-medium">អូរ</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.canals}</p>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-xs">
                    <p className="text-xs text-indigo-700 font-medium">ប្រវែងសរុប (គ.ម)</p>
                    <p className="text-2xl font-bold text-indigo-800 mt-1">{stats.totalLength.toFixed(1)}</p>
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg no-print flex items-center justify-between ${status === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                    <span>{message}</span>
                    <button onClick={() => setMessage("")} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                </div>
            )}

            {/* Form to Add / Edit */}
            {showForm && currentUser && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                            {editingId ? "កែសម្រួលទិន្នន័យផ្លូវទឹក (Edit Waterway)" : "បញ្ចូលទិន្នន័យផ្លូវទឹកថ្មី (Add New Waterway)"}
                        </h3>
                        <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-sm">
                            បោះបង់ (Cancel)
                        </button>
                    </div>

                    {/* Section 1: ព័ត៌មានទូទៅ (General Information) */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">១. ព័ត៌មានទូទៅ (General Information)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ប្រភេទ (Type) *</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    required
                                >
                                    {WATERWAY_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ឈ្មោះ (Name) *</label>
                                <input
                                    type="text"
                                    placeholder="ឧ. ស្ទឹងសង្កែ, ព្រែកត្នោត, ..."
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ប្រវែង (គ.ម / Length in km)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={length}
                                    onChange={(e) => setLength(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ខេត្ត (Province) *</label>
                                {currentUser.role === "admin" ? (
                                    <select
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white"
                                        value={selectedProvinceId}
                                        onChange={(e) => {
                                            setSelectedProvinceId(e.target.value);
                                            setUpstreamDistrictId("");
                                            setUpstreamCommuneId("");
                                            setDownstreamDistrictId("");
                                            setDownstreamCommuneId("");
                                        }}
                                        required
                                    >
                                        <option value="">-- ជ្រើសរើសខេត្ត --</option>
                                        {provinces.map((p) => (
                                            <option key={p.id} value={p.id}>{p.khmerName || p.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm p-2 border text-sm text-slate-700"
                                        value={currentUser.provinceName || ""}
                                        readOnly
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: ផ្នែកខាងលើទឹក / ប្រភព (Up Stream) */}
                    <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200/60">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            ២. ផ្នែកខាងលើទឹក / ប្រភព (Up Stream)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">នៅស្រុកណា (District)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white"
                                    value={upstreamDistrictId}
                                    onChange={(e) => {
                                        setUpstreamDistrictId(e.target.value);
                                        setUpstreamCommuneId("");
                                    }}
                                >
                                    <option value="">-- ជ្រើសរើសស្រុក --</option>
                                    {currentDistricts.map((d) => (
                                        <option key={d.id} value={d.id}>{d.khmerName || d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ឃុំណា (Commune)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white"
                                    value={upstreamCommuneId}
                                    onChange={(e) => setUpstreamCommuneId(e.target.value)}
                                    disabled={!upstreamDistrictId}
                                >
                                    <option value="">-- ជ្រើសរើសឃុំ --</option>
                                    {upstreamCommunes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.khmerName || c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ទីតាំង X (Longitude)</label>
                                <input
                                    type="text"
                                    placeholder="ឧ. 104.912"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={upstreamLocationX}
                                    onChange={(e) => setUpstreamLocationX(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ទីតាំង Y (Latitude)</label>
                                <input
                                    type="text"
                                    placeholder="ឧ. 11.556"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={upstreamLocationY}
                                    onChange={(e) => setUpstreamLocationY(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">មុខកាត់ (ម / Width)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={upstreamWidth}
                                    onChange={(e) => setUpstreamWidth(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">កំពស់ពីនីវ៉ូសមុទ្រ (ម)</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={upstreamElevation}
                                    onChange={(e) => setUpstreamElevation(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: ផ្នែកខាងក្រោមទឹក / ចុងទឹក (Down Stream) */}
                    <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/60">
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            ៣. ផ្នែកខាងក្រោមទឹក / ចុងទឹក (Down Stream)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">នៅស្រុកណា (District)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white"
                                    value={downstreamDistrictId}
                                    onChange={(e) => {
                                        setDownstreamDistrictId(e.target.value);
                                        setDownstreamCommuneId("");
                                    }}
                                >
                                    <option value="">-- ជ្រើសរើសស្រុក --</option>
                                    {currentDistricts.map((d) => (
                                        <option key={d.id} value={d.id}>{d.khmerName || d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ឃុំណា (Commune)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm bg-white"
                                    value={downstreamCommuneId}
                                    onChange={(e) => setDownstreamCommuneId(e.target.value)}
                                    disabled={!downstreamDistrictId}
                                >
                                    <option value="">-- ជ្រើសរើសឃុំ --</option>
                                    {downstreamCommunes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.khmerName || c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ទីតាំង X (Longitude)</label>
                                <input
                                    type="text"
                                    placeholder="ឧ. 104.935"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={downstreamLocationX}
                                    onChange={(e) => setDownstreamLocationX(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">ទីតាំង Y (Latitude)</label>
                                <input
                                    type="text"
                                    placeholder="ឧ. 11.530"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={downstreamLocationY}
                                    onChange={(e) => setDownstreamLocationY(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">មុខកាត់ (ម / Width)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={downstreamWidth}
                                    onChange={(e) => setDownstreamWidth(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">កំពស់ពីនីវ៉ូសមុទ្រ (ម)</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                                    value={downstreamElevation}
                                    onChange={(e) => setDownstreamElevation(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: សំគាល់ (Note) */}
                    <div>
                        <label className="block text-xs font-medium text-slate-700">សំគាល់ (Note / Remarks)</label>
                        <input
                            type="text"
                            placeholder="កំណត់សំគាល់បន្ថែមផ្សេងៗ..."
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border text-sm"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 font-medium"
                        >
                            បោះបង់ (Cancel)
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 font-medium disabled:opacity-50 shadow-sm"
                        >
                            {isSubmitting ? "កំពុងរក្សាទុក..." : editingId ? "កែប្រែ (Update)" : "រក្សាទុក (Save)"}
                        </button>
                    </div>
                </form>
            )}

            {/* Filter & Search Bar */}
            <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-1">តម្រង៖</span>
                    {["ទាំងអស់", ...WATERWAY_TYPES].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedFilterType(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedFilterType === t ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-md">
                    {currentUser?.role === "admin" && (
                        <select
                            className="rounded-lg border-slate-300 border p-1.5 text-xs bg-white text-slate-700"
                            value={selectedFilterProvinceId}
                            onChange={(e) => setSelectedFilterProvinceId(e.target.value)}
                        >
                            <option value="">-- ខេត្តទាំងអស់ --</option>
                            {provinces.map((p) => (
                                <option key={p.id} value={p.id}>{p.khmerName || p.name}</option>
                            ))}
                        </select>
                    )}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="ស្វែងរកតាមឈ្មោះ, ស្រុក..."
                            className="w-full rounded-lg border-slate-300 border p-1.5 pl-8 text-xs shadow-xs focus:ring-1 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Printable Report Root */}
            <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8 overflow-x-auto">
                <div className="space-y-1.5 text-center text-slate-900">
                    <p className="text-sm tracking-wide font-moul">ព្រះរាជាណាចក្រកម្ពុជា</p>
                    <p className="text-sm font-moul">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                </div>

                <div className="mt-4 grid gap-3 text-slate-900 sm:grid-cols-3 sm:items-start">
                    <div className="text-center text-xs leading-relaxed font-moul sm:text-left">
                        <img src="/templates/logo.png" alt="Logo" className="mx-auto sm:mx-0 mb-2 h-12 w-12 object-contain" />
                        ក្រសួងធនធានទឹក និងឧតុនិយម <br />
                        មន្ទីរធនធានទឹក និងឧតុនិយម{currentUser?.provinceName ? `ខេត្ត${currentUser.provinceName}` : ""}
                    </div>
                    <div className="text-center sm:mt-4">
                        <h1 className="font-moul text-base print-title">
                            បញ្ជីផ្លូវទឹកធម្មជាតិ (ទន្លេ ស្ទឹង ព្រែក អូរ)
                        </h1>
                        {currentUser?.provinceName && (
                            <p className="text-xs text-slate-600 mt-1">ខេត្ត{currentUser.provinceName}</p>
                        )}
                    </div>
                    <div className="text-right text-xs text-slate-500 hidden sm:block">
                        <p>កាលបរិច្ឆេទ៖ {new Date().toLocaleDateString('km-KH')}</p>
                    </div>
                </div>

                {/* Printable Table */}
                <table className="print-table min-w-full border-collapse text-xs mt-6">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle w-10">ល.រ</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle w-16">ប្រភេទ</th>
                            <th rowSpan={2} className="px-3 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle min-w-[120px]">ឈ្មោះ</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle w-20">ប្រវែង (គ.ម)</th>
                            <th colSpan={6} className="px-2 py-1.5 border border-slate-300 bg-blue-50 font-moul text-center align-middle text-blue-900">
                                ផ្នែកខាងលើទឹក (Up Stream)
                            </th>
                            <th colSpan={6} className="px-2 py-1.5 border border-slate-300 bg-emerald-50 font-moul text-center align-middle text-emerald-900">
                                ផ្នែកខាងក្រោមទឹក (Down Stream)
                            </th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle min-w-[100px]">សំគាល់</th>
                            <th rowSpan={2} className="px-2 py-2 border border-slate-300 bg-slate-100 font-moul text-center align-middle no-print w-24">Action</th>
                        </tr>
                        <tr>
                            {/* Up Stream Columns */}
                            <th className="px-2 py-1.5 border border-slate-300 bg-blue-50/70 font-moul text-center text-[11px]">ស្រុក</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-blue-50/70 font-moul text-center text-[11px]">ឃុំ</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-blue-50/70 font-moul text-center text-[11px]">X</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-blue-50/70 font-moul text-center text-[11px]">Y</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-blue-50/70 font-moul text-center text-[11px]">មុខកាត់(ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-blue-50/70 font-moul text-center text-[11px]">កម្ពស់(ម)</th>

                            {/* Down Stream Columns */}
                            <th className="px-2 py-1.5 border border-slate-300 bg-emerald-50/70 font-moul text-center text-[11px]">ស្រុក</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-emerald-50/70 font-moul text-center text-[11px]">ឃុំ</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-emerald-50/70 font-moul text-center text-[11px]">X</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-emerald-50/70 font-moul text-center text-[11px]">Y</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-emerald-50/70 font-moul text-center text-[11px]">មុខកាត់(ម)</th>
                            <th className="px-2 py-1.5 border border-slate-300 bg-emerald-50/70 font-moul text-center text-[11px]">កម្ពស់(ម)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(groupedWaterways).length === 0 ? (
                            <tr>
                                <td colSpan={18} className="px-4 py-8 text-center text-slate-400 border border-slate-300">
                                    មិនមានទិន្នន័យផ្លូវទឹកទេ (No waterways found)
                                </td>
                            </tr>
                        ) : (
                            Object.entries(groupedWaterways).map(([provinceName, items]) => {
                                const provTotalLength = items.reduce((sum, w) => sum + (Number(w.length) || 0), 0);

                                return (
                                    <React.Fragment key={provinceName}>
                                        <tr className="bg-slate-100">
                                            <td colSpan={18} className="px-3 py-2 font-bold text-slate-800 border border-slate-300">
                                                {provinceName} ({items.length} ផ្លូវទឹក)
                                            </td>
                                        </tr>
                                        {items.map((item, idx) => {
                                            const canEdit = currentUser?.role === "admin" || (currentUser?.provinceId && currentUser.provinceId === item.provinceId);

                                            return (
                                                <tr key={item.id} className="border-b hover:bg-slate-50 transition-colors">
                                                    <td className="px-2 py-2 border border-slate-300 text-center">{idx + 1}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center font-medium">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                            item.type === "ទន្លេ" ? "bg-blue-100 text-blue-800" :
                                                            item.type === "ស្ទឹង" ? "bg-teal-100 text-teal-800" :
                                                            item.type === "ព្រែក" ? "bg-amber-100 text-amber-800" :
                                                            "bg-emerald-100 text-emerald-800"
                                                        }`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 border border-slate-300 font-semibold text-slate-800">{item.name}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center font-medium text-slate-700">{item.length || 0}</td>

                                                    {/* Upstream */}
                                                    <td className="px-2 py-2 border border-slate-300 text-slate-700">{item.upstreamDistrict?.khmerName || item.upstreamDistrict?.name || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-slate-700">{item.upstreamCommune?.khmerName || item.upstreamCommune?.name || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center text-xs text-slate-600">{item.upstreamLocationX || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center text-xs text-slate-600">{item.upstreamLocationY || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center">{item.upstreamWidth || 0}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center">{item.upstreamElevation || 0}</td>

                                                    {/* Downstream */}
                                                    <td className="px-2 py-2 border border-slate-300 text-slate-700">{item.downstreamDistrict?.khmerName || item.downstreamDistrict?.name || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-slate-700">{item.downstreamCommune?.khmerName || item.downstreamCommune?.name || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center text-xs text-slate-600">{item.downstreamLocationX || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center text-xs text-slate-600">{item.downstreamLocationY || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center">{item.downstreamWidth || 0}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center">{item.downstreamElevation || 0}</td>

                                                    <td className="px-2 py-2 border border-slate-300 text-slate-600 text-xs">{item.note || "-"}</td>
                                                    <td className="px-2 py-2 border border-slate-300 text-center no-print">
                                                        {canEdit ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Province Summary row */}
                                        <tr className="bg-slate-100 font-bold border-t border-slate-300">
                                            <td colSpan={3} className="px-3 py-2 border border-slate-300 text-center">
                                                សរុប {provinceName} ({items.length} ផ្លូវទឹក)
                                            </td>
                                            <td className="px-2 py-2 border border-slate-300 text-center text-blue-900">
                                                {provTotalLength.toFixed(1)}
                                            </td>
                                            <td colSpan={14} className="px-2 py-2 border border-slate-300"></td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Print Sign-off Footer */}
                <div className="mt-10 flex justify-between text-xs text-slate-900 break-inside-avoid">
                    <div className="text-center">
                        <p className="font-moul mb-16">បានឃើញ និងឯកភាព<br />ប្រធានមន្ទីរ</p>
                    </div>
                    <div className="text-center">
                        <p>ធ្វើនៅ................ថ្ងៃទី........ខែ........ឆ្នាំ........</p>
                        <p className="font-moul mb-16">អ្នកធ្វើបញ្ជី</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
