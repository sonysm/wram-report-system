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
    provinceId: number;
}

interface WaterEntry {
    id: number;
    basinName: string;
    location: string;
    districtName: string;
    communeName: string | null;
    totalWater: number;
    actualWater: number;
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

function formatNumber(value: number): string {
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

export default function ProvinceWaterFeature() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [districts, setDistricts] = useState<District[]>([]);
    const [entries, setEntries] = useState<WaterEntry[]>([]);

    const [basinName, setBasinName] = useState("");
    const [location, setLocation] = useState("");
    const [selectedDistrictId, setSelectedDistrictId] = useState("");
    const [newDistrictName, setNewDistrictName] = useState("");
    const [selectedCommuneName, setSelectedCommuneName] = useState("");
    const [newCommuneName, setNewCommuneName] = useState("");
    const [totalWater, setTotalWater] = useState("");
    const [actualWater, setActualWater] = useState("");
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

    const loadEntries = async (token: string) => {
        const response = await fetch("/api/water-entries", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load water entries");
        }

        const payload = await response.json();
        setEntries(payload.entries ?? []);
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

            await Promise.all([loadDistricts(token), loadEntries(token)]);
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

        await Promise.all([loadDistricts(token), loadEntries(token)]);
    };

    const resetForm = () => {
        setBasinName("");
        setLocation("");
        setSelectedDistrictId("");
        setNewDistrictName("");
        setSelectedCommuneName("");
        setNewCommuneName("");
        setTotalWater("");
        setActualWater("");
        setNote("");
        setEditingId(null);
    };

    const computedFormPercent = useMemo(() => {
        const total = parseNonNegativeInput(totalWater);
        const actual = parseNonNegativeInput(actualWater);

        if (total === null || actual === null) {
            return "0%";
        }

        return formatPercent(total, actual);
    }, [totalWater, actualWater]);

    const totals = useMemo(() => {
        return entries.reduce(
            (acc, entry) => ({
                totalWater: acc.totalWater + entry.totalWater,
                actualWater: acc.actualWater + entry.actualWater,
            }),
            { totalWater: 0, actualWater: 0 },
        );
    }, [entries]);

    const activeDistrictName = useMemo(() => {
        if (selectedDistrictId === "__new__") {
            return newDistrictName.trim();
        }

        const districtId = Number(selectedDistrictId);
        if (!selectedDistrictId || Number.isNaN(districtId)) {
            return "";
        }

        const district = districts.find((item) => item.id === districtId);
        return district?.name ?? "";
    }, [districts, newDistrictName, selectedDistrictId]);

    const communeOptions = useMemo(() => {
        const normalizedDistrict = activeDistrictName.toLowerCase();

        const names = entries
            .filter((entry) => {
                if (!entry.communeName) {
                    return false;
                }

                if (!normalizedDistrict) {
                    return true;
                }

                return entry.districtName.toLowerCase() === normalizedDistrict;
            })
            .map((entry) => entry.communeName?.trim() ?? "")
            .filter((name) => name !== "");

        const deduped = new Map<string, string>();
        for (const name of names) {
            const key = name.toLowerCase();
            if (!deduped.has(key)) {
                deduped.set(key, name);
            }
        }

        return Array.from(deduped.values()).sort((a, b) => a.localeCompare(b));
    }, [activeDistrictName, entries]);

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
            const parsedActualWater = parseNonNegativeInput(actualWater);

            if (!basinName.trim()) {
                throw new Error("Basin name is required");
            }

            if (!location.trim()) {
                throw new Error("Location is required");
            }

            if (parsedTotalWater === null || parsedActualWater === null) {
                throw new Error("Total water and actual water must be non-negative numbers");
            }

            const payload: {
                id?: number;
                basinName: string;
                location: string;
                districtId?: number;
                districtName?: string;
                communeName: string;
                totalWater: number;
                actualWater: number;
                note: string;
            } = {
                basinName: basinName.trim(),
                location: location.trim(),
                communeName: "",
                totalWater: parsedTotalWater,
                actualWater: parsedActualWater,
                note: note.trim(),
            };

            if (selectedDistrictId === "__new__") {
                if (!newDistrictName.trim()) {
                    throw new Error("Please input district name");
                }

                payload.districtName = newDistrictName.trim();
            } else {
                const districtId = Number(selectedDistrictId);
                if (!selectedDistrictId || Number.isNaN(districtId)) {
                    throw new Error("Please select district or choose custom district");
                }

                payload.districtId = districtId;
            }

            const resolvedCommuneName =
                selectedCommuneName === "__new__" ? newCommuneName.trim() : selectedCommuneName.trim();

            if (selectedCommuneName === "__new__" && !resolvedCommuneName) {
                throw new Error("Please input commune name");
            }

            payload.communeName = resolvedCommuneName;

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
        setActualWater(String(entry.actualWater));
        setNote(entry.note ?? "");

        if (entry.districtId) {
            setSelectedDistrictId(String(entry.districtId));
            setNewDistrictName("");
        } else {
            setSelectedDistrictId("__new__");
            setNewDistrictName(entry.districtName);
        }

        if (entry.communeName) {
            setSelectedCommuneName(entry.communeName);
            setNewCommuneName("");
        } else {
            setSelectedCommuneName("");
            setNewCommuneName("");
        }

        setStatus("");
        setMessage("Editing selected water entry.");
    };

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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                    Logged in as <strong>{currentUser?.username}</strong> ({currentUser?.role})
                </p>
                <p className="mt-1">
                    Province access: <strong>{currentUser?.provinceName ?? "Not assigned"}</strong>
                </p>
            </div>

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
                    </div>

                    <div>
                        <label htmlFor="district" className="mb-2 block text-sm font-medium text-slate-700">
                            ស្រុក
                        </label>
                        <select
                            id="district"
                            value={selectedDistrictId}
                            onChange={(e) => {
                                setSelectedDistrictId(e.target.value);
                                setSelectedCommuneName("");
                                setNewCommuneName("");
                            }}
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        >
                            <option value="">ជ្រើសរើសស្រុក</option>
                            {districts.map((district) => (
                                <option key={district.id} value={district.id}>
                                    {district.name}
                                </option>
                            ))}
                            <option value="__new__">+ បញ្ចូលស្រុកដោយដៃ</option>
                        </select>
                    </div>

                    {selectedDistrictId === "__new__" && (
                        <div>
                            <label htmlFor="newDistrictName" className="mb-2 block text-sm font-medium text-slate-700">
                                ឈ្មោះស្រុកថ្មី
                            </label>
                            <input
                                id="newDistrictName"
                                value={newDistrictName}
                                onChange={(e) => {
                                    setNewDistrictName(e.target.value);
                                    setSelectedCommuneName("");
                                    setNewCommuneName("");
                                }}
                                placeholder="បញ្ចូលឈ្មោះស្រុក"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="communeName" className="mb-2 block text-sm font-medium text-slate-700">
                            ឈ្មោះឃុំ
                        </label>
                        <select
                            id="communeName"
                            value={selectedCommuneName}
                            onChange={(e) => setSelectedCommuneName(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        >
                            <option value="">ជ្រើសរើសឃុំ</option>
                            {communeOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                            <option value="__new__">+ បញ្ចូលឃុំដោយដៃ</option>
                        </select>
                    </div>

                    {selectedCommuneName === "__new__" && (
                        <div>
                            <label htmlFor="newCommuneName" className="mb-2 block text-sm font-medium text-slate-700">
                                ឈ្មោះឃុំថ្មី
                            </label>
                            <input
                                id="newCommuneName"
                                value={newCommuneName}
                                onChange={(e) => setNewCommuneName(e.target.value)}
                                placeholder="បញ្ចូលឈ្មោះឃុំ"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="totalWater" className="mb-2 block text-sm font-medium text-slate-700">
                            Total Water
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
                        <label htmlFor="actualWater" className="mb-2 block text-sm font-medium text-slate-700">
                            Actual Water Have
                        </label>
                        <input
                            id="actualWater"
                            value={actualWater}
                            onChange={(e) => setActualWater(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <p className="mb-2 block text-sm font-medium text-slate-700">Actual Water Percentage</p>
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">
                            {computedFormPercent}
                        </div>
                    </div>

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

            <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Province Water Report (Preview)</h3>
                <button
                    type="button"
                    onClick={handlePrint}
                    disabled={entries.length === 0}
                    className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    Preview & Print
                </button>
            </div>

            <section className="report-print-root rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-2 text-center text-slate-900">
                    <p className="text-sm font-semibold tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</p>
                    <p className="text-sm">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                </div>

                <div className="mt-3 grid gap-3 text-slate-900 sm:grid-cols-3 sm:items-start">
                    <div className="text-left text-sm leading-relaxed">
                        <p className="font-semibold">ក្រសួងធនធានទឹក និងឧតុនិយម</p>
                        <p>មន្ទីធនធានទឹក និងឧតុនិយម ខេត្ត{currentUser?.provinceName ?? "-"}</p>
                    </div>

                    <div className="text-center">
                        <h2 className="print-title text-lg font-bold tracking-tight">របាយការណ៍អាងទឹកតាមខេត្ត</h2>
                        <p className="text-sm">ខេត្ត: {currentUser?.provinceName ?? "-"}</p>
                        <p className="text-xs text-slate-600">ថ្ងៃបង្កើតរបាយការណ៍: {printedDate}</p>
                    </div>

                    <div aria-hidden="true" className="hidden sm:block"></div>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-400">
                    <table className="print-table min-w-full border-collapse text-xs sm:text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="border border-slate-400 px-2 py-2 text-left">ល.រ</th>
                                <th className="border border-slate-400 px-2 py-2 text-left">ឈ្មោះអាងទឹក</th>
                                <th className="border border-slate-400 px-2 py-2 text-left">ទីតាំង</th>
                                <th className="border border-slate-400 px-2 py-2 text-left">ស្រុក</th>
                                <th className="border border-slate-400 px-2 py-2 text-left">ឃុំ</th>
                                <th className="border border-slate-400 px-2 py-2 text-right">Total Water</th>
                                <th className="border border-slate-400 px-2 py-2 text-right">Actual Water</th>
                                <th className="border border-slate-400 px-2 py-2 text-right">Actual (%)</th>
                                <th className="border border-slate-400 px-2 py-2 text-left">ផ្សេងៗ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 && (
                                <tr>
                                    <td className="border border-slate-300 px-2 py-3 text-center text-slate-500" colSpan={9}>
                                        No water report data yet.
                                    </td>
                                </tr>
                            )}
                            {entries.map((entry, index) => (
                                <tr key={entry.id}>
                                    <td className="border border-slate-300 px-2 py-2">{index + 1}</td>
                                    <td className="border border-slate-300 px-2 py-2">{entry.basinName}</td>
                                    <td className="border border-slate-300 px-2 py-2">{entry.location}</td>
                                    <td className="border border-slate-300 px-2 py-2">{entry.districtName}</td>
                                    <td className="border border-slate-300 px-2 py-2">{entry.communeName || "-"}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.totalWater)}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-right">{formatNumber(entry.actualWater)}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-right">{formatPercent(entry.totalWater, entry.actualWater)}</td>
                                    <td className="border border-slate-300 px-2 py-2">{entry.note || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 font-semibold">
                                <td className="border border-slate-400 px-2 py-2" colSpan={5}>
                                    សរុប
                                </td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.totalWater)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatNumber(totals.actualWater)}</td>
                                <td className="border border-slate-400 px-2 py-2 text-right">{formatPercent(totals.totalWater, totals.actualWater)}</td>
                                <td className="border border-slate-400 px-2 py-2"></td>
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Recent Water Entries</h3>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-left text-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold">ឈ្មោះអាងទឹក</th>
                                <th className="px-4 py-3 font-semibold">ទីតាំង</th>
                                <th className="px-4 py-3 font-semibold">ស្រុក</th>
                                <th className="px-4 py-3 font-semibold">ឃុំ</th>
                                <th className="px-4 py-3 font-semibold">Total Water</th>
                                <th className="px-4 py-3 font-semibold">Actual Water</th>
                                <th className="px-4 py-3 font-semibold">Actual (%)</th>
                                <th className="px-4 py-3 font-semibold">ថ្ងៃបញ្ចូល</th>
                                <th className="px-4 py-3 font-semibold">កែប្រែ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                                        No water entries yet.
                                    </td>
                                </tr>
                            )}
                            {entries.map((entry) => (
                                <tr key={entry.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3">{entry.basinName}</td>
                                    <td className="px-4 py-3">{entry.location}</td>
                                    <td className="px-4 py-3">{entry.districtName}</td>
                                    <td className="px-4 py-3">{entry.communeName || "-"}</td>
                                    <td className="px-4 py-3">{formatNumber(entry.totalWater)}</td>
                                    <td className="px-4 py-3">{formatNumber(entry.actualWater)}</td>
                                    <td className="px-4 py-3">{formatPercent(entry.totalWater, entry.actualWater)}</td>
                                    <td className="px-4 py-3">{new Date(entry.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
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
