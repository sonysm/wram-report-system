import { NextPage } from "next";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getStoredToken, fetchSessionUser, SessionUser } from "../../lib/session";

interface Station {
    id: number;
    name: string;
    khmerName: string;
    river: string | null;
    category: string | null;
    monitoringFunctions: string | null;
    warningLevel: number | null;
    latitude: number | null;
    longitude: number | null;
    order: number;
    province: { name: string };
}

const StationsPage: NextPage = () => {
    const [stations, setStations] = useState<Station[]>([]);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [khmerName, setKhmerName] = useState("");
    const [river, setRiver] = useState("");
    const [category, setCategory] = useState("");
    const [monitoringFunctions, setMonitoringFunctions] = useState("");
    const [warningLevel, setWarningLevel] = useState<number | "">("");
    const [latitude, setLatitude] = useState<number | "">("");
    const [longitude, setLongitude] = useState<number | "">("");
    const [order, setOrder] = useState<number | "">("");

    useEffect(() => {
        const init = async () => {
            const token = getStoredToken();
            if (token) {
                const user = await fetchSessionUser(token);
                setSessionUser(user);
            }
            await loadStations();
            setLoading(false);
        };
        init();
    }, []);

    const loadStations = async () => {
        const token = getStoredToken();
        if (!token) return;

        const res = await fetch("/api/stations", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setStations(data.stations);
        }
    };

    const handleEdit = (st: Station) => {
        setEditId(st.id);
        setName(st.name);
        setKhmerName(st.khmerName);
        setRiver(st.river || "");
        setCategory(st.category || "");
        setMonitoringFunctions(st.monitoringFunctions || "");
        setWarningLevel(st.warningLevel ?? "");
        setLatitude(st.latitude ?? "");
        setLongitude(st.longitude ?? "");
        setOrder(st.order ?? "");
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setName("");
        setKhmerName("");
        setRiver("");
        setCategory("");
        setMonitoringFunctions("");
        setWarningLevel("");
        setLatitude("");
        setLongitude("");
        setOrder("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getStoredToken();
        if (!token) return;

        const payload = {
            name,
            khmerName,
            river: river || undefined,
            category: category || undefined,
            monitoringFunctions: monitoringFunctions || undefined,
            warningLevel: warningLevel !== "" ? Number(warningLevel) : undefined,
            latitude: latitude !== "" ? Number(latitude) : undefined,
            longitude: longitude !== "" ? Number(longitude) : undefined,
            order: order !== "" ? Number(order) : undefined,
        };

        const res = await fetch(editId ? `/api/stations/${editId}` : "/api/stations", {
            method: editId ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            handleCancelEdit();
            await loadStations();
        } else {
            alert(editId ? "Failed to update station" : "Failed to create station");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        const token = getStoredToken();
        if (!token) return;
        const res = await fetch(`/api/stations/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            await loadStations();
        }
    };

    return (
        <Layout>
            <section className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Station List</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        គ្រប់គ្រងព័ត៌មាន ស្ថានីយជលសាស្ត្រ
                    </p>
                </div>

                {sessionUser?.role !== "admin" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-slate-800">{editId ? "កែប្រែស្ថានីយ (Edit Station)" : "បន្ថែមស្ថានីយថ្មី (Add New Station)"}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Station Name (English)</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Station Name (Khmer)</label>
                                <input type="text" value={khmerName} onChange={e => setKhmerName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">River/Lake</label>
                                <input type="text" value={river} onChange={e => setRiver(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Monitoring Functions</label>
                                <input type="text" value={monitoringFunctions} onChange={e => setMonitoringFunctions(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">កម្រិតកម្ពស់ប្រុងប្រយ័ត្ន (Warning Level)</label>
                                <input type="number" step="any" value={warningLevel} onChange={e => setWarningLevel(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Lat./X</label>
                                <input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Long./Y</label>
                                <input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Order (លេខរៀង)</label>
                                <input type="number" value={order} onChange={e => setOrder(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div className="md:col-span-1 lg:col-span-1 flex items-end space-x-2">
                                <button type="submit" className="w-full rounded-xl bg-cyan-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700">
                                    {editId ? "Update" : "រក្សាទុក (Save)"}
                                </button>
                                {editId && (
                                    <button type="button" onClick={handleCancelEdit} className="w-full rounded-xl bg-slate-400 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-500">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-700">
                                <tr>
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Station Name</th>
                                    <th className="px-4 py-3">Khmer Name</th>
                                    <th className="px-4 py-3">Province</th>
                                    <th className="px-4 py-3">River/Lake</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Monitoring Functions</th>
                                    <th className="px-4 py-3">Warning Level</th>
                                    <th className="px-4 py-3">Lat./X</th>
                                    <th className="px-4 py-3">Long./Y</th>
                                    {sessionUser?.role !== "admin" && (
                                        <th className="px-4 py-3">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {stations.map(st => (
                                    <tr key={st.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{st.order}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{st.name}</td>
                                        <td className="px-4 py-3">{st.khmerName}</td>
                                        <td className="px-4 py-3">{st.province.name}</td>
                                        <td className="px-4 py-3">{st.river}</td>
                                        <td className="px-4 py-3">{st.category}</td>
                                        <td className="px-4 py-3">{st.monitoringFunctions}</td>
                                        <td className="px-4 py-3">{st.warningLevel}</td>
                                        <td className="px-4 py-3">{st.latitude}</td>
                                        <td className="px-4 py-3">{st.longitude}</td>
                                        {sessionUser?.role !== "admin" && (
                                            <td className="px-4 py-3 space-x-2">
                                                <button onClick={() => handleEdit(st)} className="text-cyan-600 hover:text-cyan-800 font-semibold">Edit</button>
                                                <button onClick={() => handleDelete(st.id)} className="text-red-500 hover:text-red-700 font-semibold">Delete</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {stations.length === 0 && (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                                            មិនមានទិន្នន័យ (No data)
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

export default StationsPage;
