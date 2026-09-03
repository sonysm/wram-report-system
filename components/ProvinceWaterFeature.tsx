/*
 * Filename: /Users/sonysum/Documents/Web-Project/wram-report-system/components/ProvinceWaterFeature.tsx
 * Path: /Users/sonysum/Documents/Web-Project/wram-report-system
 * Created Date: Wednesday, September 2nd 2026, 4:36:50 pm
 * Author: Sum Sony
 * 
 * Copyright (c) 2026 Code Frog
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
    code: string | null;
    name: string;
    khmerName: string;
    postalCode: number | null;
    sortOrder: number | null;
}

interface WaterEntry {
    id: number;
    provinceId: number | null;
    provinceName: string;
    provinceCode: string | null;
    provinceSortOrder: number | null;
    postalCode: number | null;
    basinName: string;
    location: string;
    districtName: string;
    communeId: number | null;
    communeName: string | null;
    totalWater: number;
    waterPercent: number;
    actualWater: number;
    irrigatedDryArea: number;
    irrigatedWetArea: number;
    otherCrop: number;
    waterSource: string;
    note: string | null;
    districtId: number | null;
    createdAt: string;
}

function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem("token");
}

function parseNonNegativeInput(value: string): number | null {
    if (value.trim() === "") {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
}

function formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null) {
        return "0";
    }
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function formatPercent(total: number, actual: number): string {
    if (total <= 0) {
        return "0%";
    }

    return `${((actual / total) * 100).toFixed(2)}%`;
}

function calculateActualWater(totalWater: number, waterPercent: number): number {
    return (totalWater * waterPercent) / 100;
}

function calculateDisplayPercent(totalWater: number, actualWater: number): string {
    if (totalWater <= 0) {
        return "0%";
    }

    return `${((actualWater / totalWater) * 100).toFixed(2)}%`;
}

export default function ProvinceWaterFeature() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [communes, setCommunes] = useState<Commune[]>([]);
    const [entries, setEntries] = useState<WaterEntry[]>([]);

    const [basinName, setBasinName] = useState("");
    const [location, setLocation] = useState("");
    const [selectedDistrictId, setSelectedDistrictId] = useState("");
    const [selectedCommuneId, setSelectedCommuneId] = useState("");
    const [totalWater, setTotalWater] = useState("");
    const [waterPercent, setWaterPercent] = useState("");
    const [irrigatedDryArea, setIrrigatedDryArea] = useState("");
    const [irrigatedWetArea, setIrrigatedWetArea] = useState("");
    const [otherCrop, setOtherCrop] = useState("");
    const [waterSource, setWaterSource] = useState("");
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

    const loadDistricts = async (token: string) => {
        const response = await fetch("/api/districts", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load districts");
        }

        const payload = await response.json();
        setDistricts(payload.districts ?? []);
    };

    const loadProvinces = async (token: string) => {
        const response = await fetch("/api/provinces", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load provinces");
        }

        const payload = await response.json();
        setProvinces(payload.provinces ?? []);
    };

    const loadCommunes = async (token: string) => {
        const response = await fetch("/api/communes", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load communes");
        }

        const payload = await response.json();
        setCommunes(payload.communes ?? []);
    };

    const loadEntries = async (token: string) => {
        const response = await fetch("/api/water-entries", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load water entries");
        }

        const payload = await response.json();
        const nextEntries: WaterEntry[] = (payload.entries ?? []).map((entry: any) => ({
            id: entry.id,
            provinceId: entry.province?.id ?? null,
            provinceName: entry.province?.khmerName || entry.province?.name || "",
            provinceCode: entry.province?.code ?? null,
            provinceSortOrder: entry.province?.sortOrder ?? null,
            postalCode: entry.province?.postalCode ?? null,
            basinName: entry.basinName,
            location: entry.location,
            districtName: entry.district?.khmerName || entry.district?.name || entry.districtName || "",
            communeId: entry.commune?.id ?? null,
            communeName: entry.commune?.khmerName || entry.commune?.name || entry.communeName || null,
            totalWater: Number(entry.totalWater ?? 0),
            waterPercent:
                Number(entry.waterPercent ?? 0) ||
                (Number(entry.totalWater ?? 0) > 0 ? (Number(entry.actualWater ?? 0) / Number(entry.totalWater ?? 0)) * 100 : 0),
            actualWater: Number(entry.actualWater ?? 0),
            irrigatedDryArea: Number(entry.irrigatedDryArea ?? 0),
            irrigatedWetArea: Number(entry.irrigatedWetArea ?? 0),
            otherCrop: Number(entry.otherCrop ?? 0),
            waterSource: entry.waterSource ?? "",
            note: entry.note ?? null,
            districtId: entry.districtId ?? null,
            createdAt: entry.createdAt,
        }));

        setEntries(nextEntries);
    };

    const loadInitialData = async () => {
        const token = getToken();
        if (!token) {
            setAuthError("Please login first to submit water reports.");
            setIsLoading(false);
            return;
        }

        try {
            const meResponse = await fetch("/api/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!meResponse.ok) {
                throw new Error("Session expired. Please login again.");
            }

            const me = await meResponse.json();
            setCurrentUser(me);

            await Promise.all([loadProvinces(token), loadDistricts(token), loadCommunes(token), loadEntries(token)]);
            setAuthError("");
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Unable to load user session");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadInitialData();
    }, []);

    const refreshData = async () => {
        const token = getToken();
        if (!token) {
            return;
        }

        await Promise.all([loadProvinces(token), loadDistricts(token), loadCommunes(token), loadEntries(token)]);
    };

    const resetForm = () => {
        setBasinName("");
        setLocation("");
        setSelectedDistrictId("");
        setSelectedCommuneId("");
        setTotalWater("");
        setWaterPercent("");
        setIrrigatedDryArea("");
        setIrrigatedWetArea("");
        setOtherCrop("");
        setWaterSource("");
        setNote("");
        setEditingId(null);
    };

    const computedFormPercent = useMemo(() => {
        const total = parseNonNegativeInput(totalWater);
        const percent = parseNonNegativeInput(waterPercent);

        if (total === null || percent === null) {
            return "0%";
        }

        const actual = calculateActualWater(total, percent);
        return calculateDisplayPercent(total, actual);
    }, [totalWater, waterPercent]);

    const computedActualWater = useMemo(() => {
        const total = parseNonNegativeInput(totalWater);
        const percent = parseNonNegativeInput(waterPercent);

        if (total === null || percent === null) {
            return 0;
        }

        return calculateActualWater(total, percent);
    }, [totalWater, waterPercent]);

    const totals = useMemo(() => {
        return entries.reduce(
            (acc, entry) => ({
                totalWater: acc.totalWater + entry.totalWater,
                actualWater: acc.actualWater + entry.actualWater,
                irrigatedDryArea: acc.irrigatedDryArea + entry.irrigatedDryArea,
                irrigatedWetArea: acc.irrigatedWetArea + entry.irrigatedWetArea,
                otherCrop: (acc.otherCrop || 0) + (entry.otherCrop || 0),
            }),
            {
                totalWater: 0, actualWater: 0, irrigatedDryArea: 0, irrigatedWetArea: 0,
                otherCrop: 0
            },
        );
    }, [entries]);

    const activeDistrictName = useMemo(() => {
        const districtId = Number(selectedDistrictId);
        if (!selectedDistrictId || Number.isNaN(districtId)) {
            return "";
        }

        const district = districts.find((item) => item.id === districtId);
        return district?.name ?? "";
    }, [districts, selectedDistrictId]);

    const communeOptions = useMemo(() => {
        const districtIdNum = Number(selectedDistrictId);
        return communes
            .filter((c) => {
                if (!selectedDistrictId || Number.isNaN(districtIdNum)) {
                    return true;
                }
                return c.districtId === districtIdNum || c.districtId === null;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [communes, selectedDistrictId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const token = getToken();
        if (!token) {
            setStatus("error");
            setMessage("Please login first.");
            return;
        }

        setIsSubmitting(true);
        setStatus("");
        setMessage("");

        try {
            const parsedTotalWater = parseNonNegativeInput(totalWater);
            const parsedWaterPercent = parseNonNegativeInput(waterPercent);
            const parsedDryArea = parseNonNegativeInput(irrigatedDryArea) ?? 0;
            const parsedWetArea = parseNonNegativeInput(irrigatedWetArea) ?? 0;
            const parsedOtherCrop = parseNonNegativeInput(otherCrop) ?? 0;
            const normalizedWaterSource = waterSource.trim();

            if (!basinName.trim()) {
                throw new Error("Basin name is required");
            }



            if (parsedTotalWater === null || parsedWaterPercent === null) {
                throw new Error("Capacity and percentage must be non-negative numbers");
            }

            const calculatedActualWater = calculateActualWater(parsedTotalWater, parsedWaterPercent);

            const resolvedCommuneId = Number(selectedCommuneId) || null;

            const payload: {
                id?: number;
                provinceId?: number;
                basinName: string;
                location: string;
                districtId?: number;
                districtName?: string;
                communeId?: number;
                communeName?: string;
                totalWater: number;
                waterPercent: number;
                actualWater: number;
                irrigatedDryArea: number;
                irrigatedWetArea: number;
                otherCrop: number;
                waterSource: string;
                note: string;
            } = {
                basinName: basinName.trim(),
                location: location.trim(),
                totalWater: parsedTotalWater,
                waterPercent: parsedWaterPercent,
                actualWater: calculatedActualWater,
                irrigatedDryArea: parsedDryArea,
                irrigatedWetArea: parsedWetArea,
                otherCrop: parsedOtherCrop,
                waterSource: normalizedWaterSource,
                note: note.trim(),
            };

            const districtId = Number(selectedDistrictId);
            if (!selectedDistrictId || Number.isNaN(districtId)) {
                throw new Error("Please select district");
            }
            payload.districtId = districtId;

            if (resolvedCommuneId !== null) {
                payload.communeId = resolvedCommuneId;
            }

            if (editingId !== null) {
                payload.id = editingId;
            }

            const response = await fetch("/api/water-entries", {
                method: editingId === null ? "POST" : "PUT",
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            const responsePayload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(responsePayload.error ?? "Unable to save water entry");
            }

            setStatus("success");
            setMessage(editingId === null ? "Water entry added." : "Water entry updated.");
            resetForm();
            await refreshData();
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to save data");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (entry: WaterEntry) => {
        setEditingId(entry.id);
        setBasinName(entry.basinName);
        setLocation(entry.location);
        setTotalWater(String(entry.totalWater));
        setWaterPercent(String(entry.waterPercent || (entry.totalWater > 0 ? (entry.actualWater / entry.totalWater) * 100 : 0)));
        setIrrigatedDryArea(String(entry.irrigatedDryArea ?? 0));
        setIrrigatedWetArea(String(entry.irrigatedWetArea ?? 0));
        setOtherCrop(String(entry.otherCrop ?? 0));
        setWaterSource(entry.waterSource ?? "");
        setNote(entry.note ?? "");

        if (entry.districtId) {
            setSelectedDistrictId(String(entry.districtId));
        } else {
            setSelectedDistrictId("");
        }

        if (entry.communeId) {
            setSelectedCommuneId(String(entry.communeId));
        } else {
            setSelectedCommuneId("");
        }

        setStatus("");
        setMessage("Editing selected water entry.");
    };

    const adminReportRows = useMemo(() => {
        const grouped = new Map<
            number,
            {
                provinceId: number;
                provinceName: string;
                provinceCode: string | null;
                provinceSortOrder: number | null;
                postalCode: number | null;
                totalWater: number;
                actualWater: number;
                irrigatedDryArea: number;
                irrigatedWetArea: number;
                otherCrop: number;
                note: string;
            }
        >();

        for (const province of provinces) {
            grouped.set(province.id, {
                provinceId: province.id,
                provinceName: province.khmerName || province.name,
                provinceCode: province.code ?? null,
                provinceSortOrder: province.sortOrder ?? null,
                postalCode: province.postalCode ?? null,
                totalWater: 0,
                actualWater: 0,
                irrigatedDryArea: 0,
                irrigatedWetArea: 0,
                otherCrop: 0,
                note: "",
            });
        }

        for (const entry of entries) {
            const provinceId = entry.provinceId ?? -1;
            const existing = grouped.get(provinceId);
            const entryNote = entry.note?.trim() ?? "";

            if (!existing) {
                grouped.set(provinceId, {
                    provinceId,
                    provinceName: entry.provinceName || "Unknown Province",
                    provinceCode: entry.provinceCode,
                    provinceSortOrder: entry.provinceSortOrder,
                    postalCode: entry.postalCode,
                    totalWater: entry.totalWater,
                    actualWater: entry.actualWater,
                    irrigatedDryArea: entry.irrigatedDryArea,
                    irrigatedWetArea: entry.irrigatedWetArea,
                    otherCrop: entry.otherCrop,
                    note: entryNote,
                });
                continue;
            }

            existing.totalWater += entry.totalWater;
            existing.actualWater += entry.actualWater;
            existing.irrigatedDryArea += entry.irrigatedDryArea;
            existing.irrigatedWetArea += entry.irrigatedWetArea;
            existing.otherCrop += entry.otherCrop;
            if (!existing.note && entryNote) {
                existing.note = entryNote;
            }
        }

        return Array.from(grouped.values()).sort((a, b) => {
            const aSort = a.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
            const bSort = b.provinceSortOrder ?? Number.MAX_SAFE_INTEGER;
            if (aSort !== bSort) {
                return aSort - bSort;
            }

            return a.provinceName.localeCompare(b.provinceName);
        });
    }, [entries, provinces]);

    const isAdmin = currentUser?.role === "admin";

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    if (isLoading) {
        return <p className="text-sm text-slate-500">Loading water feature...</p>;
    }

    if (authError) {
        return (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
                <p className="text-sm font-medium">{authError}</p>
                <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline">
                    Go to login
                </Link>
            </div>
        );
    }

    const printedDate = new Date().toLocaleDateString();
    const reportRows = isAdmin ? adminReportRows : entries;

    const now = new Date();
    // 1. Get the day number (English numerals)
    const day: number = now.getDate();
    // 2. Get the Khmer month name (e.g., "សីហា")
    const month: string = now.toLocaleDateString('km-KH', { month: 'long' });
    // 3. Get the year in Khmer numerals (e.g., "២០២៦")
    const year: string = now.toLocaleDateString('km-KH', { year: 'numeric' });
    // 4. Combine into your template string
    const dateString: string = `គិតត្រឹមថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;

    return (
        <div className="space-y-6">
            {/* <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                    Logged in as <strong>{currentUser?.username}</strong> ({currentUser?.role})
                </p>
                <p className="mt-1">
                    Province access: <strong>{currentUser?.provinceName ?? "Not assigned"}</strong>
                </p>
            </div> */}

            {!isAdmin && (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900">បញ្ចូលទិន្នន័យអាងទឹក</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="basinName" className="mb-2 block text-sm font-medium text-slate-700">
                                ឈ្មោះអាងទឹក
                            </label>
                            <input
                                id="basinName"
                                value={basinName}
                                onChange={(e) => setBasinName(e.target.value)}
                                placeholder="បញ្ចូលឈ្មោះអាងទឹក"
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="district" className="mb-2 block text-sm font-medium text-slate-700">
                                ស្រុក/ខណ្ឌ
                            </label>
                            <select
                                id="district"
                                value={selectedDistrictId}
                                onChange={(e) => {
                                    setSelectedDistrictId(e.target.value);
                                    setSelectedCommuneId("");
                                }}
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            >
                                <option value="">ជ្រើសរើសស្រុក</option>
                                {districts.map((district) => (
                                    <option key={district.id} value={district.id}>
                                        {district.khmerName || district.name}
                                    </option>
                                ))}
                            </select>
                        </div>



                        <div>
                            <label htmlFor="communeName" className="mb-2 block text-sm font-medium text-slate-700">
                                ឈ្មោះឃុំ
                            </label>
                            <select
                                id="communeName"
                                value={selectedCommuneId}
                                onChange={(e) => setSelectedCommuneId(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            >
                                <option value="">ជ្រើសរើសឃុំ</option>
                                {communeOptions.map((commune) => (
                                    <option key={commune.id} value={commune.id}>
                                        {commune.khmerName || commune.name}
                                    </option>
                                ))}
                            </select>
                        </div>



                        <div>
                            <label htmlFor="totalWater" className="mb-2 block text-sm font-medium text-slate-700">
                                សមត្ថភាពស្ដុកទឹក(ម៣)
                            </label>
                            <input
                                id="totalWater"
                                value={totalWater}
                                onChange={(e) => setTotalWater(e.target.value)}
                                placeholder="0"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="waterPercent" className="mb-2 block text-sm font-medium text-slate-700">
                                បរិមាណទឹកគិតជា %
                            </label>
                            <input
                                id="waterPercent"
                                value={waterPercent}
                                onChange={(e) => setWaterPercent(e.target.value)}
                                placeholder="0"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <p className="mb-2 block text-sm font-medium text-slate-700">បរិមាណទឹកក្នុងអាង</p>
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">
                                {formatNumber(computedActualWater)}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="irrigatedDryArea" className="mb-2 block text-sm font-medium text-slate-700">
                                ផ្ទៃដីស្រោចស្រព -ប្រាំង(ហ.ត)
                            </label>
                            <input
                                id="irrigatedDryArea"
                                value={irrigatedDryArea}
                                onChange={(e) => setIrrigatedDryArea(e.target.value)}
                                placeholder="0"
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="irrigatedWetArea" className="mb-2 block text-sm font-medium text-slate-700">
                                ផ្ទៃដីស្រោចស្រព -វស្សា(ហ.ត)
                            </label>
                            <input
                                id="irrigatedWetArea"
                                value={irrigatedWetArea}
                                onChange={(e) => setIrrigatedWetArea(e.target.value)}
                                placeholder="0"
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="otherCrop" className="mb-2 block text-sm font-medium text-slate-700">
                                ដំណាំរួមផ្សំ
                            </label>
                            <input
                                id="otherCrop"
                                value={otherCrop}
                                onChange={(e) => setOtherCrop(e.target.value)}
                                placeholder="0"
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="waterSource" className="mb-2 block text-sm font-medium text-slate-700">
                                ប្រភពទឹក
                            </label>
                            <input
                                id="waterSource"
                                value={waterSource}
                                onChange={(e) => setWaterSource(e.target.value)}
                                placeholder="បញ្ចូលប្រភពទឹក"

                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>

                        {/* <div>
                            <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-700">
                                ទីតាំង
                            </label>
                            <input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="ឧ. ភូមិ..., ឃុំ..., ស្រុក..."
                                required
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div> */}

                        <div className="sm:col-span-2">
                            <label htmlFor="note" className="mb-2 block text-sm font-medium text-slate-700">
                                ផ្សេងៗ
                            </label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                placeholder="ចំណាំបន្ថែម"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Saving..." : editingId === null ? "Save Water Entry" : "Update Water Entry"}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    {message && (
                        <p
                            className={`rounded-lg px-3 py-2 text-sm ${status === "success"
                                ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border border-rose-300 bg-rose-50 text-rose-700"
                                }`}
                        >
                            {message}
                        </p>
                    )}
                </form>
            )}

            <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Province Water Report (Preview)</h3>
                <button
                    type="button"
                    onClick={handlePrint}
                    disabled={reportRows.length === 0}
                    className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    Preview & Print
                </button>
            </div>

            <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-2 text-center text-slate-900">
                    <p className="text-sm font-semibold tracking-wide font-moul">ព្រះរាជាណាចក្រកម្ពុជា</p>
                    <p className="text-sm font-moul">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                </div>

                <div className="mt-3 grid gap-3 text-slate-900 sm:grid-cols-3 sm:items-start">
                    <div className="text-center text-sm leading-relaxed font-moul">
                        <img src="/templates/logo.png" alt="" className="mx-auto mb-2 h-12 w-12 object-contain" />
                        <p> {isAdmin ? "ក្រសួងធនធានទឹក និងឧតុនិយម" : `មន្ទីធនធានទឹក និងឧតុនិយម`}</p>
                        <p className="font-semibold">{isAdmin ? "" : `ខេត្ត ${currentUser?.provinceName ?? "-"}`}</p>
                    </div>

                    <div className="text-center">
                        <h2 className="print-title text-lg font-bold tracking-tight font-moul"> {isAdmin ? 'របាយការណ៍អាងទឹកតាមខេត្ត' : `របាយការណ៍អាងទឹកក្នុងខេត្ត ${currentUser?.provinceName ?? "-"}`}</h2>
                        {/* <p className="text-sm">{isAdmin ? "" : `ខេត្ត: ${currentUser?.provinceName ?? "-"}`}</p> */}
                        <br />
                        <p className="text-sm text-slate-600">{dateString}</p>
                    </div>

                    <div aria-hidden="true" className="hidden sm:block"></div>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-400">
                    <table className="print-table min-w-full border-collapse text-xs sm:text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th rowSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ល.រ</th>
                                {isAdmin ? (
                                    <>
                                        <th rowSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ឈ្មោះខេត្ត</th>
                                        <th colSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">បរិមាណទឹកក្នុងអាង</th>
                                        <th colSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ផ្ទៃដីស្រោចស្រព</th>
                                        <th rowSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ផ្សេងៗ</th>
                                    </>
                                ) : (
                                    <>
                                        <th rowSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ឈ្មោះអាងស្តុកទឹក</th>
                                        <th colSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">ទីតាំង</th>
                                        <th colSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">បរិមាណទឹកក្នុងអាង</th>
                                        <th colSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ផ្ទៃដីស្រោចស្រព</th>
                                        <th rowSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ប្រភពទឹក</th>
                                        <th rowSpan={3} className="border border-slate-400 px-2 py-2 text-center align-middle">ផ្សេងៗ</th>
                                    </>
                                )}
                            </tr>
                            <tr>
                                {!isAdmin && (
                                    <>
                                        <th rowSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">ក្រុង/ស្រុក</th>
                                        <th rowSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">ឃុំ/សង្កាត់</th>
                                    </>
                                )}
                                <th rowSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">សមត្ថភាពស្តុកទឹកសរុប (ម៣)</th>
                                <th colSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">បរិមាណទឹកក្នុងអាង</th>
                                <th rowSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">ប្រាំង(ហ.ត)</th>
                                <th rowSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">វស្សា(ហ.ត)</th>
                                <th rowSpan={2} className="border border-slate-400 px-2 py-2 text-center align-middle">ដំណាំរួមផ្សំ</th>
                            </tr>
                            <tr>
                                <th className="border border-slate-400 px-2 py-2 text-center align-middle">បរិមាណទឹក(ម៣)</th>
                                <th className="border border-slate-400 px-2 py-2 text-center align-middle">បរិមាណទឹក(%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportRows.length === 0 && (
                                <tr>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-slate-500" colSpan={isAdmin ? 8 : 11}>
                                        No water report data yet.
                                    </td>
                                </tr>
                            )}
                            {isAdmin
                                ? adminReportRows.map((row, index) => (
                                    <tr key={`${row.provinceName}-${index}`}>
                                        <td className="border border-slate-300 px-2 py-2 text-center">{index + 1}</td>
                                        <td className="border border-slate-300 px-2 py-2">{row.provinceName}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(row.totalWater)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(row.actualWater)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatPercent(row.totalWater, row.actualWater)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(row.irrigatedDryArea)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(row.irrigatedWetArea)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(row.otherCrop)}</td>
                                        <td className="border border-slate-300 px-2 py-2">{row.note || "-"}</td>
                                    </tr>
                                ))
                                : entries.map((entry, index) => (
                                    <tr key={entry.id}>
                                        <td className="border border-slate-300 px-2 py-2 text-center">{index + 1}</td>
                                        <td className="border border-slate-300 px-2 py-2">{entry.basinName}</td>
                                        <td className="border border-slate-300 px-2 py-2">{entry.districtName}</td>
                                        <td className="border border-slate-300 px-2 py-2">{entry.communeName || "-"}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.totalWater)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.actualWater)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatPercent(entry.totalWater, entry.actualWater)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.irrigatedDryArea)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.irrigatedWetArea)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.otherCrop)}</td>
                                        <td className="border border-slate-300 px-2 py-2">{entry.waterSource || "-"}</td>
                                        <td className="border border-slate-300 px-2 py-2">{entry.note || "-"}</td>
                                    </tr>
                                ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 font-semibold">
                                <td className="border border-slate-400 px-2 py-2 text-center" colSpan={isAdmin ? 2 : 4}>
                                    សរុប
                                </td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.totalWater)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.actualWater)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatPercent(totals.totalWater, totals.actualWater)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.irrigatedDryArea)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.irrigatedWetArea)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.otherCrop)}</td>
                                {isAdmin ? (
                                    <td className="border border-slate-400 px-2 py-2"></td>
                                ) : (
                                    <>
                                        <td className="border border-slate-400 px-2 py-2"></td>
                                        <td className="border border-slate-400 px-2 py-2"></td>
                                    </>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-6 text-[15px]">
                    <div className="flex flex-col items-center text-center">
                        <p className="font-moul mb-1">បានឃើញ និងឯកភាព</p>
                        <p>ថ្ងៃទី...........ខែ...........ឆ្នាំ២០២...</p>
                        <p className="font-moul mt-1">ប្រធានមន្ទីរ</p>
                        <div className="mt-24"></div>
                    </div>
                    <div className="flex flex-col items-center text-center justify-end">
                        <p>ថ្ងៃទី...........ខែ...........ឆ្នាំ២០២...</p>
                        <p className="font-moul mt-1">អ្នកធ្វើតារាង</p>
                        <div className="mt-24"></div>
                    </div>
                </div>
            </section>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Recent Water Entries</h3>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-center text-slate-700">
                            <tr>
                                {isAdmin && <th rowSpan={3} className="px-4 py-3 font-semibold align-middle border-b border-slate-200">ឈ្មោះខេត្ត</th>}
                                <th rowSpan={3} className="px-4 py-3 font-semibold align-middle border-b border-slate-200">ឈ្មោះអាងស្តុកទឹក</th>
                                <th colSpan={2} className="px-4 py-2 font-semibold text-center border-b border-slate-200">ទីតាំង</th>
                                <th colSpan={3} className="px-4 py-2 font-semibold text-center border-b border-slate-200">បរិមាណទឹកក្នុងអាង</th>
                                <th colSpan={3} className="px-4 py-2 font-semibold text-center border-b border-slate-200">ផ្ទៃដីស្រោចស្រព</th>
                                <th rowSpan={3} className="px-4 py-3 font-semibold align-middle border-b border-slate-200">ប្រភពទឹក</th>
                                <th rowSpan={3} className="px-4 py-3 font-semibold align-middle border-b border-slate-200">ផ្សេងៗ</th>
                                <th rowSpan={3} className="px-4 py-3 font-semibold align-middle border-b border-slate-200">ថ្ងៃបញ្ចូល</th>
                                <th rowSpan={3} className="px-4 py-3 font-semibold align-middle border-b border-slate-200">កែប្រែ</th>
                            </tr>
                            <tr>
                                <th rowSpan={2} className="px-4 py-2 font-semibold align-middle border-b border-slate-200">ស្រុក</th>
                                <th rowSpan={2} className="px-4 py-2 font-semibold align-middle border-b border-slate-200">(ឃុ - ស្កាត់)</th>
                                <th rowSpan={2} className="px-4 py-2 font-semibold align-middle border-b border-slate-200">សមត្ថភាពស្តុកទឹកសរុប (ម៣)</th>
                                <th colSpan={2} className="px-4 py-2 font-semibold text-center border-b border-slate-200">បរិមាណទឹកក្នុងអាង</th>
                                <th rowSpan={2} className="px-4 py-2 font-semibold align-middle border-b border-slate-200">ប្រាំង(ហ.ត)</th>
                                <th rowSpan={2} className="px-4 py-2 font-semibold align-middle border-b border-slate-200">វស្សា(ហ.ត)</th>
                                <th rowSpan={2} className="px-4 py-2 font-semibold align-middle border-b border-slate-200">ដំណាំរួមផ្សំ</th>
                            </tr>
                            <tr>
                                <th className="px-4 py-2 font-semibold border-b border-slate-200">បរិមាណទឹក(ម៣)</th>
                                <th className="px-4 py-2 font-semibold border-b border-slate-200">បរិមាណទឹក(%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 13 : 12} className="px-4 py-6 text-center text-slate-500">
                                        No water entries yet.
                                    </td>
                                </tr>
                            )}
                            {entries.map((entry) => (
                                <tr key={entry.id} className="border-t border-slate-100">
                                    {isAdmin && <td className="px-4 py-3 text-center">{entry.provinceName || "-"}</td>}
                                    <td className="px-4 py-3 text-center">{entry.basinName}</td>
                                    <td className="px-4 py-3 text-center">{entry.districtName}</td>
                                    <td className="px-4 py-3 text-center">{entry.communeName || "-"}</td>
                                    <td className="px-4 py-3 text-right">{formatNumber(entry.totalWater)}</td>
                                    <td className="px-4 py-3 text-right">{formatNumber(entry.actualWater)}</td>
                                    <td className="px-4 py-3 text-right">{formatPercent(entry.totalWater, entry.actualWater)}</td>
                                    <td className="px-4 py-3 text-right">{formatNumber(entry.irrigatedDryArea)}</td>
                                    <td className="px-4 py-3 text-right">{formatNumber(entry.irrigatedWetArea)}</td>
                                    <td className="px-4 py-3 text-right">{formatNumber(entry.otherCrop)}</td>
                                    <td className="px-4 py-3 text-center">{entry.waterSource || "-"}</td>
                                    <td className="px-4 py-3 text-center">{entry.note || "-"}</td>
                                    <td className="px-4 py-3 text-center">{new Date(entry.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(entry)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
