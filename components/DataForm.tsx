import Link from "next/link";
import { useEffect, useState } from "react";

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

interface EntryRecord {
    id: number;
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
    note: string | null;
    createdAt: string;
    district: { id: number; name: string; khmerName?: string | null } | null;
    province: { id: number; name: string; khmerName?: string | null } | null;
}

function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem("token");
}

function parseDecimalInput(value: string): number | null {
    if (value.trim() === "") {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
}
interface DataFormProps {
    onEntrySaved?: () => void;
}

export default function DataForm({ onEntrySaved }: DataFormProps = {}) {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [districts, setDistricts] = useState<District[]>([]);
    const [entries, setEntries] = useState<EntryRecord[]>([]);
    const [selectedDistrictId, setSelectedDistrictId] = useState("");

    const [planArea, setPlanArea] = useState("");
    const [planDone, setPlanDone] = useState("");
    const [actualArea, setActualArea] = useState("0");
    const [interventionArea, setInterventionArea] = useState("0");
    const [interventionAreaDrought, setInterventionAreaDrought] = useState("0");
    const [interventionAreaFlood, setInterventionAreaFlood] = useState("0");
    const [householdPlan, setHouseholdPlan] = useState("0");
    const [householdDone, setHouseholdDone] = useState("0");
    const [unsalvageableArea, setUnsalvageableArea] = useState("0");
    const [unsalvageableAreaDrought, setUnsalvageableAreaDrought] = useState("0");
    const [unsalvageableAreaFlood, setUnsalvageableAreaFlood] = useState("0");
    const [waterSource, setWaterSource] = useState("");
    const [note, setNote] = useState("");

    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"success" | "error" | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    const authHeaders = (token: string) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    });

    const loadDistricts = async (token: string) => {
        const districtsRes = await fetch("/api/districts", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!districtsRes.ok) {
            const payload = await districtsRes.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load districts");
        }

        const payload = await districtsRes.json();
        setDistricts(payload.districts ?? []);
    };

    const loadEntries = async (token: string) => {
        const entriesRes = await fetch("/api/entries", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!entriesRes.ok) {
            const payload = await entriesRes.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load entries");
        }

        const payload = await entriesRes.json();
        setEntries(payload.entries ?? []);
    };

    const loadInitialData = async () => {
        const token = getToken();
        if (!token) {
            setAuthError("Please login first to submit district reports.");
            setIsLoading(false);
            return;
        }

        try {
            const meRes = await fetch("/api/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!meRes.ok) {
                throw new Error("Session expired. Please login again.");
            }

            const mePayload = await meRes.json();
            setCurrentUser(mePayload);

            await Promise.all([loadDistricts(token), loadEntries(token)]);
            setAuthError("");
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Unable to load your profile");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadInitialData();
    }, []);

    const resetForm = () => {
        setSelectedDistrictId("");
        setPlanArea("");
        setPlanDone("");
        setActualArea("0");
        setInterventionArea("0");
        setInterventionAreaDrought("0");
        setInterventionAreaFlood("0");
        setHouseholdPlan("0");
        setHouseholdDone("0");
        setUnsalvageableArea("0");
        setUnsalvageableAreaDrought("0");
        setUnsalvageableAreaFlood("0");
        setWaterSource("");
        setNote("");
        setEditingEntryId(null);
    };

    const refreshAfterSave = async () => {
        const token = getToken();
        if (!token) {
            return;
        }

        await Promise.all([loadDistricts(token), loadEntries(token)]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            const parsedPlanArea = parseDecimalInput(planArea);
            const parsedPlanDone = parseDecimalInput(planDone);
            const parsedActualArea = parseDecimalInput(actualArea);
            const parsedInterventionArea = (parseDecimalInput(interventionAreaDrought) ?? 0) + (parseDecimalInput(interventionAreaFlood) ?? 0);
            const parsedInterventionAreaDrought = parseDecimalInput(interventionAreaDrought) ?? 0;
            const parsedInterventionAreaFlood = parseDecimalInput(interventionAreaFlood) ?? 0;
            const parsedHouseholdPlan = parseDecimalInput(householdPlan);
            const parsedHouseholdDone = parseDecimalInput(householdDone);
            const parsedUnsalvageableArea = (parseDecimalInput(unsalvageableAreaDrought) ?? 0) + (parseDecimalInput(unsalvageableAreaFlood) ?? 0);
            const parsedUnsalvageableAreaDrought = parseDecimalInput(unsalvageableAreaDrought) ?? 0;
            const parsedUnsalvageableAreaFlood = parseDecimalInput(unsalvageableAreaFlood) ?? 0;
            const parsedOverUnderPlan = parsedPlanArea !== null && parsedPlanDone !== null ? parsedPlanDone - parsedPlanArea : 0;

            if (parsedPlanArea === null || parsedPlanDone === null) {
                throw new Error("Plan area and plan done must be non-negative numbers");
            }

            const normalizedWaterSource = waterSource.trim();
            if (!normalizedWaterSource) {
                throw new Error("Water source is required");
            }

            if (
                parsedActualArea === null ||
                parsedInterventionArea === null ||
                parsedHouseholdPlan === null ||
                parsedHouseholdDone === null ||
                parsedUnsalvageableArea === null
            ) {
                throw new Error("Optional fields must be non-negative numbers");
            }

            const payload: {
                id?: number;
                districtId?: number;
                districtName?: string;
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
            } = {
                planArea: parsedPlanArea,
                planDone: parsedPlanDone,
                actualArea: parsedActualArea,
                interventionArea: parsedInterventionArea,
                interventionAreaDrought: parsedInterventionAreaDrought,
                interventionAreaFlood: parsedInterventionAreaFlood,
                householdPlan: parsedHouseholdPlan,
                householdDone: parsedHouseholdDone,
                unsalvageableArea: parsedUnsalvageableArea,
                unsalvageableAreaDrought: parsedUnsalvageableAreaDrought,
                unsalvageableAreaFlood: parsedUnsalvageableAreaFlood,
                overUnderPlan: parsedOverUnderPlan,
                waterSource: normalizedWaterSource,
                note: note.trim(),
            };


            const districtId = Number(selectedDistrictId);
            if (!selectedDistrictId || Number.isNaN(districtId)) {
                throw new Error("Please select a district");
            }
            payload.districtId = districtId;

            if (editingEntryId !== null) {
                payload.id = editingEntryId;
            }

            const requestMethod = editingEntryId === null ? "POST" : "PUT";
            const response = await fetch("/api/entries", {
                method: requestMethod,
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });

            const responsePayload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(responsePayload.error ?? "Unable to save entry");
            }

            setStatus("success");
            setMessage(editingEntryId === null ? "Record added successfully." : "Record updated successfully.");
            resetForm();
            await refreshAfterSave();
            if (onEntrySaved) {
                onEntrySaved();
            }
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to save record.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (entry: EntryRecord) => {
        setEditingEntryId(entry.id);
        setPlanArea(String(entry.planArea));
        setPlanDone(String(entry.planDone));
        setActualArea(String(entry.actualArea));
        setInterventionArea(String(entry.interventionArea));
        setInterventionAreaDrought(String(entry.interventionAreaDrought ?? 0));
        setInterventionAreaFlood(String(entry.interventionAreaFlood ?? 0));
        setHouseholdPlan(String(entry.householdPlan));
        setHouseholdDone(String(entry.householdDone));
        setUnsalvageableArea(String(entry.unsalvageableArea));
        setUnsalvageableAreaDrought(String(entry.unsalvageableAreaDrought ?? 0));
        setUnsalvageableAreaFlood(String(entry.unsalvageableAreaFlood ?? 0));
        setWaterSource(entry.waterSource ?? "");
        setNote(entry.note ?? "");
        setSelectedDistrictId(entry.district ? String(entry.district.id) : "");
        setStatus("");
        setMessage("Editing selected record. Save to confirm changes.");
    };

    const computedOverUnderPlan = (() => {
        const parsedPlanArea = parseDecimalInput(planArea);
        const parsedPlanDone = parseDecimalInput(planDone);

        if (parsedPlanArea === null || parsedPlanDone === null) {
            return 0;
        }

        return parsedPlanDone - parsedPlanArea;
    })();

    if (isLoading) {
        return <p className="text-sm text-slate-500">Loading form...</p>;
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

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="district" className="mb-2 block text-sm font-medium text-slate-700">
                        ស្រុក
                    </label>
                    <select
                        id="district"
                        value={selectedDistrictId}
                        onChange={(e) => setSelectedDistrictId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        required
                    >
                        <option value="">ជ្រើសរើសស្រុក</option>
                        {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                                {district.khmerName || district.name}
                            </option>
                        ))}
                    </select>
                </div>



                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">(ហ.ត) គិតជាហត្តា</p>
                    </div>

                    <div>
                        <label htmlFor="planArea" className="mb-2 block text-sm font-medium text-slate-700">
                            ផែនការដាំដុះ (ហ.ត)
                        </label>
                        <input
                            id="planArea"
                            value={planArea}
                            onChange={(e) => setPlanArea(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="planDone" className="mb-2 block text-sm font-medium text-slate-700">
                            ផ្ទៃដីអនុវត្ត (ហ.ត)
                        </label>
                        <input
                            id="planDone"
                            value={planDone}
                            onChange={(e) => setPlanDone(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <p className="mb-2 block text-sm font-medium text-slate-700">
                            លើស-ក្រោមផែនការ (ហ.ត)
                        </p>
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">
                            {computedOverUnderPlan.toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 block text-sm font-medium text-slate-700">លើស-ក្រោមផែនការ (%)</p>
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">
                            {Number(planArea) > 0
                                ? `${((computedOverUnderPlan * 100) / Number(planArea)).toFixed(2)}%`
                                : "0%"}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="actualArea" className="mb-2 block text-sm font-medium text-slate-700">
                            ផ្ទៃដីប៉ះពាល់-រាំងស្ងួត (ហ.ត)
                        </label>
                        <input
                            id="actualArea"
                            value={actualArea}
                            onChange={(e) => setActualArea(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="householdPlan" className="mb-2 block text-sm font-medium text-slate-700">
                            ផ្ទៃដីប៉ះពាល់-ជំនន់ (ហ.ត)
                        </label>
                        <input
                            id="householdPlan"
                            value={householdPlan}
                            onChange={(e) => setHouseholdPlan(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="interventionAreaDrought" className="mb-2 block text-sm font-medium text-slate-700">
                            បានអន្តរាគមន៍-រាំងស្ងួត (ហ.ត)
                        </label>
                        <input
                            id="interventionAreaDrought"
                            value={interventionAreaDrought}
                            onChange={(e) => setInterventionAreaDrought(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="interventionAreaFlood" className="mb-2 block text-sm font-medium text-slate-700">
                            បានអន្តរាគមន៍-ជំនន់ (ហ.ត)
                        </label>
                        <input
                            id="interventionAreaFlood"
                            value={interventionAreaFlood}
                            onChange={(e) => setInterventionAreaFlood(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="unsalvageableAreaDrought" className="mb-2 block text-sm font-medium text-slate-700">
                            ផ្ទៃដីខូចខាត-រាំងស្ងួត (ហ.ត)
                        </label>
                        <input
                            id="unsalvageableAreaDrought"
                            value={unsalvageableAreaDrought}
                            onChange={(e) => setUnsalvageableAreaDrought(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="unsalvageableAreaFlood" className="mb-2 block text-sm font-medium text-slate-700">
                            ផ្ទៃដីខូចខាត-ជំនន់ (ហ.ត)
                        </label>
                        <input
                            id="unsalvageableAreaFlood"
                            value={unsalvageableAreaFlood}
                            onChange={(e) => setUnsalvageableAreaFlood(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="waterSource" className="mb-2 block text-sm font-medium text-slate-700">
                            ប្រភពទឹក-អាងស្ដុកទឹក
                        </label>
                        <input
                            id="waterSource"
                            value={waterSource}
                            onChange={(e) => setWaterSource(e.target.value)}
                            placeholder="បញ្ចូលប្រភពទឹក"
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="householdDone" className="mb-2 block text-sm font-medium text-slate-700">
                            បរិមាណទឹក %
                        </label>
                        <input
                            id="householdDone"
                            value={householdDone}
                            onChange={(e) => setHouseholdDone(e.target.value)}
                            placeholder="0"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="note" className="mb-2 block text-sm font-medium text-slate-700">
                            ផ្សេងៗ
                        </label>
                        <textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="ចំណាំ"
                            rows={3}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        />
                    </div>
                </div >

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:from-cyan-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Saving..." : editingEntryId === null ? "Save Record" : "Update Record"}
                    </button>

                    {editingEntryId !== null && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                {
                    message && (
                        <p
                            className={`rounded-lg px-3 py-2 text-sm ${status === "success"
                                ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border border-rose-300 bg-rose-50 text-rose-700"
                                }`}
                        >
                            {message}
                        </p>
                    )
                }
            </form >

            <div>
                <h3 className="text-base font-semibold text-slate-900">Recent records</h3>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-left text-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold">ឈ្មោះក្រុង-ស្រុក</th>
                                <th className="px-4 py-3 font-semibold">ផែនការដាំដុះ (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">ផ្ទៃដីអនុវត្ត (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">លើស-ក្រោមផែនការ (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">ផ្ទៃដីប៉ះពាល់-រាំងស្ងួត (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">បានអន្តរាគមន៍-រាំងស្ងួត (ហ.ត)</th>
<th className="px-4 py-3 font-semibold">បានអន្តរាគមន៍-ជំនន់ (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">ផ្ទៃដីប៉ះពាល់-ជំនន់ (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">បរិមាណទឹក %</th>
                                <th className="px-4 py-3 font-semibold">ផ្ទៃដីខូចខាត-រាំងស្ងួត (ហ.ត)</th>
<th className="px-4 py-3 font-semibold">ផ្ទៃដីខូចខាត-ជំនន់ (ហ.ត)</th>
                                <th className="px-4 py-3 font-semibold">ប្រភពទឹក-អាងស្ដុកទឹក</th>
                                <th className="px-4 py-3 font-semibold">ផ្សេងៗ</th>
                                <th className="px-4 py-3 font-semibold">ថ្ងៃបញ្ចូល</th>
                                <th className="px-4 py-3 font-semibold">កែប្រែ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={14} className="px-4 py-6 text-center text-slate-500">
                                        No records yet.
                                    </td>
                                </tr>
                            )}
                            {entries.map((entry) => (
                                <tr key={entry.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3">{entry.district?.khmerName || entry.district?.name || "-"}</td>
                                    <td className="px-4 py-3">{entry.planArea}</td>
                                    <td className="px-4 py-3">{entry.planDone}</td>
                                    <td className="px-4 py-3">{entry.overUnderPlan}</td>
                                    <td className="px-4 py-3">{entry.actualArea}</td>
                                    <td className="px-4 py-3">{entry.interventionAreaDrought}</td>
<td className="px-4 py-3">{entry.interventionAreaFlood}</td>
                                    <td className="px-4 py-3">{entry.householdPlan}</td>
                                    <td className="px-4 py-3">{entry.householdDone}</td>
                                    <td className="px-4 py-3">{entry.unsalvageableAreaDrought}</td>
<td className="px-4 py-3">{entry.unsalvageableAreaFlood}</td>
                                    <td className="px-4 py-3">{entry.waterSource || "-"}</td>
                                    <td className="px-4 py-3">{entry.note ?? "-"}</td>
                                    <td className="px-4 py-3">{new Date(entry.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => handleEditClick(entry)}
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
        </div >
    );
}
