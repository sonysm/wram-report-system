import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";

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

interface Commune {
    id: number;
    name: string;
    khmerName?: string | null;
    provinceId: number;
    districtId: number | null;
}

interface ProvinceOption {
    id: number;
    name: string;
    khmerName: string;
}

interface FwucEntry {
    id: number;
    name: string;
    province: { id: number; name: string; khmerName: string };
    district?: { id: number; name: string; khmerName: string } | null;
    commune?: { id: number; name: string; khmerName: string } | null;
    longitude: number | null;
    latitude: number | null;
    registrationPlace: string | null;
    registrationNumber: string | null;
    registrationDate: string | null;
    irrigatedDryArea: number;
    irrigatedWetArea: number;
    efficiency: string | null;
    note: string | null;
    createdAt: string;
}

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
}

export default function FwucFeature() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const isAdmin = currentUser?.role === "admin";
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [communes, setCommunes] = useState<Commune[]>([]);
    const [entries, setEntries] = useState<FwucEntry[]>([]);

    const [name, setName] = useState("");
    const [selectedProvinceId, setSelectedProvinceId] = useState("");
    const [selectedDistrictId, setSelectedDistrictId] = useState("");
    const [selectedCommuneId, setSelectedCommuneId] = useState("");
    const [longitude, setLongitude] = useState("");
    const [latitude, setLatitude] = useState("");
    const [registrationPlace, setRegistrationPlace] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [registrationDate, setRegistrationDate] = useState("");
    const [irrigatedDryArea, setIrrigatedDryArea] = useState("");
    const [irrigatedWetArea, setIrrigatedWetArea] = useState("");
    const [efficiency, setEfficiency] = useState("");
    const [note, setNote] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"success" | "error" | "">("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState("");

    const authHeaders = (token: string) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    });

    useEffect(() => {
        const loadInitialData = async () => {
            const token = getToken();
            if (!token) {
                setAuthError("Please login first.");
                setIsLoading(false);
                return;
            }

            try {
                const userRes = await fetch("/api/me", { headers: authHeaders(token) });
                if (!userRes.ok) throw new Error("Session expired.");
                const user = await userRes.json();
                setCurrentUser(user);

                const fwucRes = await fetch("/api/fwuc", { headers: authHeaders(token) });
                if (fwucRes.ok) {
                    const fwucData = await fwucRes.json();
                    setEntries(fwucData);
                }

                if (user.role === "admin") {
                    const provRes = await fetch("/api/provinces", { headers: authHeaders(token) });
                    if (provRes.ok) {
                        const provData = await provRes.json();
                        setProvinces(provData.provinces || provData);
                    }
                }

                if (user.provinceId) {
                    const distRes = await fetch(`/api/districts?provinceId=${user.provinceId}`, { headers: authHeaders(token) });
                    if (distRes.ok) {
                        const distData = await distRes.json();
                        setDistricts(distData.districts || []);
                    }
                }
            } catch (error) {
                setAuthError(error instanceof Error ? error.message : "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        void loadInitialData();
    }, []);

    const fetchCommunes = async (districtId: string) => {
        if (!districtId) {
            setCommunes([]);
            setSelectedCommuneId("");
            return;
        }
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/communes?districtId=${districtId}`, { headers: authHeaders(token) });
            if (res.ok) {
                const data = await res.json();
                setCommunes(data.communes || []);
            }
        } catch (error) {
            console.error("Failed to fetch communes", error);
        }
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dId = e.target.value;
        setSelectedDistrictId(dId);
        void fetchCommunes(dId);
    };

    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pId = e.target.value;
        setSelectedProvinceId(pId);
        setSelectedDistrictId("");
        setSelectedCommuneId("");
        setCommunes([]);

        if (!pId) {
            setDistricts([]);
            return;
        }

        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/districts?provinceId=${pId}`, { headers: authHeaders(token) });
            if (res.ok) {
                const data = await res.json();
                setDistricts(data.districts || []);
            }
        } catch (error) {
            console.error("Failed to fetch districts", error);
        }
    };

    const resetForm = () => {
        setName("");
        setSelectedProvinceId("");
        setSelectedDistrictId("");
        setSelectedCommuneId("");
        setCommunes([]);
        setLongitude("");
        setLatitude("");
        setRegistrationPlace("");
        setRegistrationNumber("");
        setRegistrationDate("");
        setIrrigatedDryArea("");
        setIrrigatedWetArea("");
        setEfficiency("");
        setNote("");
        setEditingId(null);
        setMessage("");
        setStatus("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;

        setIsSubmitting(true);
        setMessage("");

        if (isAdmin && !selectedProvinceId) {
            setMessage("Please select a province first.");
            setStatus("error");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            name,
            ...(isAdmin ? { provinceId: selectedProvinceId ? Number(selectedProvinceId) : null } : {}),
            districtId: selectedDistrictId,
            communeId: selectedCommuneId,
            longitude,
            latitude,
            registrationPlace,
            registrationNumber,
            registrationDate,
            irrigatedDryArea,
            irrigatedWetArea,
            efficiency,
            note,
        };

        try {
            if (editingId) {
                const res = await fetch(`/api/fwuc/${editingId}`, {
                    method: "PUT",
                    headers: authHeaders(token),
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to update");
                const updated = await res.json();
                // We re-fetch to get nested relations populated correctly
                const fwucRes = await fetch("/api/fwuc", { headers: authHeaders(token) });
                if (fwucRes.ok) setEntries(await fwucRes.json());
                setMessage("Successfully updated FWUC entry.");
                setStatus("success");
            } else {
                const res = await fetch("/api/fwuc", {
                    method: "POST",
                    headers: authHeaders(token),
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to create");
                const fwucRes = await fetch("/api/fwuc", { headers: authHeaders(token) });
                if (fwucRes.ok) setEntries(await fwucRes.json());
                setMessage("Successfully added new FWUC entry.");
                setStatus("success");
            }
            resetForm();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Submission failed");
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (entry: FwucEntry) => {
        resetForm();
        setEditingId(entry.id);
        setName(entry.name);
        if (isAdmin && entry.province?.id) {
            setSelectedProvinceId(entry.province.id.toString());
            const token = getToken();
            if (token) {
                try {
                    const res = await fetch(`/api/districts?provinceId=${entry.province.id}`, { headers: authHeaders(token) });
                    if (res.ok) {
                        const data = await res.json();
                        setDistricts(data.districts || []);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
        if (entry.district?.id) {
            setSelectedDistrictId(entry.district.id.toString());
            await fetchCommunes(entry.district.id.toString());
        }
        if (entry.commune?.id) setSelectedCommuneId(entry.commune.id.toString());
        if (entry.longitude) setLongitude(entry.longitude.toString());
        if (entry.latitude) setLatitude(entry.latitude.toString());
        if (entry.registrationPlace) setRegistrationPlace(entry.registrationPlace);
        if (entry.registrationNumber) setRegistrationNumber(entry.registrationNumber);
        if (entry.registrationDate) setRegistrationDate(new Date(entry.registrationDate).toISOString().split('T')[0]);
        if (entry.irrigatedDryArea !== undefined) setIrrigatedDryArea(entry.irrigatedDryArea.toString());
        if (entry.irrigatedWetArea !== undefined) setIrrigatedWetArea(entry.irrigatedWetArea.toString());
        if (entry.efficiency) setEfficiency(entry.efficiency);
        if (entry.note) setNote(entry.note);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`/api/fwuc/${id}`, {
                method: "DELETE",
                headers: authHeaders(token),
            });
            if (!res.ok) throw new Error("Failed to delete");
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Delete failed");
        }
    };

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    const stats = useMemo(() => {
        let ministry = 0;
        let province = 0;
        let processing = 0;
        let good = 0;
        let medium = 0;
        let little = 0;
        let notFunctioning = 0;
        let totalDry = 0;
        let totalWet = 0;

        entries.forEach(e => {
            if (e.registrationPlace === "ក្រសួង") ministry++;
            else if (e.registrationPlace === "ខេត្ត") province++;
            else if (e.registrationPlace === "កំពុងដំណើរការ") processing++;

            if (e.efficiency === "ល្អ") good++;
            else if (e.efficiency === "មធ្យម") medium++;
            else if (e.efficiency === "តិចតួច") little++;
            else if (e.efficiency === "មិនដំណើរការ") notFunctioning++;

            totalDry += e.irrigatedDryArea || 0;
            totalWet += e.irrigatedWetArea || 0;
        });

        return {
            total: entries.length,
            ministry,
            province,
            processing,
            good,
            medium,
            little,
            notFunctioning,
            totalDry,
            totalWet
        };
    }, [entries]);

    if (isLoading) return <div>Loading...</div>;
    if (authError) return <div className="text-red-500">{authError}</div>;

    return (
        <div className="space-y-8">
            {!isAdmin && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm no-print">
                <h2 className="text-xl font-bold text-slate-900 mb-6">{editingId ? "កែប្រែព័ត៌មាន សកបទ" : "បញ្ចូលព័ត៌មាន សកបទ ថ្មី"}</h2>
                {message && (
                    <div className={`mb-4 p-4 rounded-md ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">១. ព័ត៌មានទូទៅ</h3>
                        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ឈ្មោះ សកបទ</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                            {isAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">ខេត្ត</label>
                                    <select required value={selectedProvinceId} onChange={handleProvinceChange} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                        <option value="">ជ្រើសរើសខេត្ត</option>
                                        {provinces.map(p => (
                                            <option key={p.id} value={p.id}>{p.khmerName || p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ស្រុក</label>
                                <select value={selectedDistrictId} onChange={handleDistrictChange} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                    <option value="">ជ្រើសរើសស្រុក</option>
                                    {districts.map(d => (
                                        <option key={d.id} value={d.id}>{d.khmerName || d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ឃុំ</label>
                                <select value={selectedCommuneId} onChange={e => setSelectedCommuneId(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                    <option value="">ជ្រើសរើសឃុំ</option>
                                    {communes.map(c => (
                                        <option key={c.id} value={c.id}>{c.khmerName || c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">២. ទីតាំង</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ទីតាំង X (Longitude)</label>
                                <input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ទីតាំង Y (Latitude)</label>
                                <div className="flex gap-2">
                                    <input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                                    {longitude && latitude && (
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                                            ផែនទី
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">៣. ព័ត៌មានចុះបញ្ជី</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ទីកន្លែងចុះបញ្ជី</label>
                                <select value={registrationPlace} onChange={e => setRegistrationPlace(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                    <option value="">ជ្រើសរើសទីកន្លែង</option>
                                    <option value="ក្រសួង">ក្រសួង</option>
                                    <option value="ខេត្ត">ខេត្ត</option>
                                    <option value="កំពុងដំណើរការ">កំពុងដំណើរការ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">លេខរៀងចុះបញ្ជី</label>
                                <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ថ្ងៃខែចុះបញ្ជី</label>
                                <input type="date" value={registrationDate} onChange={e => setRegistrationDate(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">៤. ផ្ទៃដីស្រោចស្រព (ហិកតា)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ផ្ទៃដីស្រោចស្រពប្រាំង</label>
                                <input type="number" step="any" value={irrigatedDryArea} onChange={e => setIrrigatedDryArea(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">ផ្ទៃដីស្រោចស្រពវស្សា</label>
                                <input type="number" step="any" value={irrigatedWetArea} onChange={e => setIrrigatedWetArea(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">៥. ប្រសិទ្ធភាពប្រព័ន្ធ</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ប្រសិទ្ធភាព</label>
                            <select value={efficiency} onChange={e => setEfficiency(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500">
                                <option value="">ជ្រើសរើសប្រសិទ្ធភាព</option>
                                <option value="ល្អ">🟢 ល្អ</option>
                                <option value="មធ្យម">🟡 មធ្យម</option>
                                <option value="តិចតួច">🟠 តិចតួច</option>
                                <option value="មិនដំណើរការ">🔴 មិនដំណើរការ</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">៦. ផ្សេងៗ</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">កំណត់សម្គាល់</label>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        {editingId && (
                            <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">
                                បោះបង់
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50">
                            {isSubmitting ? "កំពុងរក្សាទុក..." : (editingId ? "រក្សាទុកការកែប្រែ" : "រក្សាទុក")}
                        </button>
                    </div>
                </form>
            </div>
            )}

            <div className="flex justify-end no-print">
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.651v4.083a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.266a1.75 1.75 0 0 1-1.75 1.75H7.5a1.75 1.75 0 0 1-1.75-1.75v-2.266h-1.5A2.25 2.25 0 0 1 2 12.733V8.651c0-1.082.8-1.99 1.874-2.196.374-.056.75-.107 1.126-.153V2.75Zm1.5 0v3.367c.92-.093 1.85-.166 2.786-.215.42-.022.842-.041 1.266-.057.424.016.846.035 1.266.057.935.049 1.866.122 2.786.215V2.75a.25.25 0 0 0-.25-.25h-6.5a.25.25 0 0 0-.25.25Zm-1 11.5v2.266c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-2.266a48.423 48.423 0 0 0-6 0Zm7.25-6.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Print Report
                </button>
            </div>

            <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
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
                    <div className="text-center">
                        <p className="mt-4 inline-block font-moul text-base print-title">
                            បញ្ជីឈ្មោះសហគមន៍កសិករប្រើប្រាស់ទឹក (សកបទ)
                        </p>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-400">
                    <table className="print-table min-w-full border-collapse text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-900 uppercase">
                            <tr>
                                <th className="border border-slate-400 p-2 text-center align-middle">ល.រ</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ឈ្មោះ សកបទ</th>
                                {isAdmin && <th className="border border-slate-400 p-2 text-center align-middle">ខេត្ត</th>}
                                <th className="border border-slate-400 p-2 text-center align-middle">ស្រុក</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ឃុំ</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ទីតាំង X</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ទីតាំង Y</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ទីកន្លែងចុះបញ្ជី</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ផ្ទៃដីប្រាំង (ហ.ត)</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ផ្ទៃដីវស្សា (ហ.ត)</th>
                                <th className="border border-slate-400 p-2 text-center align-middle">ប្រសិទ្ធភាព</th>
                                <th className="border border-slate-400 p-2 text-center align-middle no-print">សកម្មភាព</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-400 p-2 text-center">{index + 1}</td>
                                    <td className="border border-slate-400 p-2 font-semibold text-cyan-700">{entry.name}</td>
                                    {isAdmin && <td className="border border-slate-400 p-2">{entry.province?.khmerName || entry.province?.name || '-'}</td>}
                                    <td className="border border-slate-400 p-2">{entry.district?.khmerName || entry.district?.name || '-'}</td>
                                    <td className="border border-slate-400 p-2">{entry.commune?.khmerName || entry.commune?.name || '-'}</td>
                                    <td className="border border-slate-400 p-2 text-center">{entry.longitude || '-'}</td>
                                    <td className="border border-slate-400 p-2 text-center">{entry.latitude || '-'}</td>
                                    <td className="border border-slate-400 p-2 text-center">{entry.registrationPlace || '-'}</td>
                                    <td className="border border-slate-400 p-2 text-right">{entry.irrigatedDryArea || '0'}</td>
                                    <td className="border border-slate-400 p-2 text-right">{entry.irrigatedWetArea || '0'}</td>
                                    <td className="border border-slate-400 p-2 text-center">{entry.efficiency || "-"}</td>
                                    <td className="border border-slate-400 p-2 flex gap-2 no-print">
                                        {entry.latitude && entry.longitude && (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${entry.latitude},${entry.longitude}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">ផែនទី</a>
                                        )}
                                        {!isAdmin && (
                                            <>
                                                <button onClick={() => handleEdit(entry)} className="text-indigo-600 hover:underline">កែប្រែ</button>
                                                <button onClick={() => handleDelete(entry.id)} className="text-rose-600 hover:underline">លុប</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 12 : 11} className="border border-slate-400 p-6 text-center text-slate-500">មិនមានទិន្នន័យ</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 mb-8 text-sm text-slate-800">
                    <h4 className="font-moul mb-3">សូចនាករ៖</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-2">
                        <div className="flex justify-between"><span>- ចំនួនសកបទសរុប៖</span> <span className="font-semibold">{stats.total}</span></div>
                        <div className="flex justify-between"><span>- ប្រសិទ្ធភាពល្អ៖</span> <span className="font-semibold">{stats.good}</span></div>
                        <div className="flex justify-between"><span>- ផ្ទៃដីស្រោចស្រពប្រាំងសរុប (ហ.ត.)៖</span> <span className="font-semibold">{stats.totalDry.toLocaleString()}</span></div>

                        <div className="flex justify-between"><span>- ចុះបញ្ជីនៅក្រសួង៖</span> <span className="font-semibold">{stats.ministry}</span></div>
                        <div className="flex justify-between"><span>- ប្រសិទ្ធភាពមធ្យម៖</span> <span className="font-semibold">{stats.medium}</span></div>
                        <div className="flex justify-between"><span>- ផ្ទៃដីស្រោចស្រពវស្សាសរុប (ហ.ត.)៖</span> <span className="font-semibold">{stats.totalWet.toLocaleString()}</span></div>

                        <div className="flex justify-between"><span>- ចុះបញ្ជីនៅខេត្ត៖</span> <span className="font-semibold">{stats.province}</span></div>
                        <div className="flex justify-between"><span>- ប្រសិទ្ធភាពតិចតួច៖</span> <span className="font-semibold">{stats.little}</span></div>
                        <div></div>

                        <div className="flex justify-between"><span>- កំពុងដំណើរការចុះបញ្ជី៖</span> <span className="font-semibold">{stats.processing}</span></div>
                        <div className="flex justify-between"><span>- មិនដំណើរការ៖</span> <span className="font-semibold">{stats.notFunctioning}</span></div>
                        <div></div>
                    </div>
                </div>

                <div className="mt-8 flex justify-between text-sm text-slate-900">
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
