import { NextPage } from "next";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getStoredToken, fetchSessionUser, SessionUser } from "../../lib/session";

interface Station {
    powerSupply: string | null;
    communication: string | null;
    elevation: number | null;
    id: number;
    name: string;
    khmerName: string;
    river: string | null;
    category: string | null;
    monitoringFunctions: string | null;
    status: string | null;
    installationDate: string | null;
    remark: string | null;
    warningLevel: number | null;
    latitude: number | null;
    longitude: number | null;
    order: number;
    province: { name: string };
    districtId?: number | null;
    communeId?: number | null;
    district?: { name: string, khmerName: string } | null;
    commune?: { name: string, khmerName: string } | null;
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
    const [powerSupply, setPowerSupply] = useState("");
    const [communication, setCommunication] = useState("");
    const [elevation, setElevation] = useState<number | "">("");
    const [status, setStatus] = useState("");
    const [installationDate, setInstallationDate] = useState("");
    const [remark, setRemark] = useState("");
    const [warningLevel, setWarningLevel] = useState<number | "">("");
    const [latitude, setLatitude] = useState<number | "">("");
    const [longitude, setLongitude] = useState<number | "">("");
    const [order, setOrder] = useState<number | "">("");
    const [districtId, setDistrictId] = useState<number | "">("");
    const [communeId, setCommuneId] = useState<number | "">("");

    const [districts, setDistricts] = useState<{ id: number; name: string; khmerName: string }[]>([]);
    const [communes, setCommunes] = useState<{ id: number; name: string; khmerName: string; districtId: number }[]>([]);

    useEffect(() => {
        const init = async () => {
            const token = getStoredToken();
            if (token) {
                const user = await fetchSessionUser(token);
                setSessionUser(user);
            }
            await loadStations();
            if (token) {
                const [dRes, cRes] = await Promise.all([
                    fetch("/api/districts", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("/api/communes", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                if (dRes.ok) {
                    const dData = await dRes.json();
                    setDistricts(dData.districts || []);
                }
                if (cRes.ok) {
                    const cData = await cRes.json();
                    setCommunes(cData.communes || []);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    const loadStations = async () => {
        const token = getStoredToken();
        if (!token) return;

        const res = await fetch("/api/meteorological-stations", {
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
        setPowerSupply(st.powerSupply || "");
        setCommunication(st.communication || "");
        setElevation(st.elevation ?? "");
        setStatus(st.status || "");
        setInstallationDate(st.installationDate ? new Date(st.installationDate).toISOString().split('T')[0] : "");
        setRemark(st.remark || "");
        setWarningLevel(st.warningLevel ?? "");
        setLatitude(st.latitude ?? "");
        setLongitude(st.longitude ?? "");
        setOrder(st.order ?? "");
        setDistrictId(st.districtId ?? "");
        setCommuneId(st.communeId ?? "");
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setName("");
        setKhmerName("");
        setRiver("");
        setCategory("");
        setMonitoringFunctions("");
        setPowerSupply("");
        setCommunication("");
        setElevation("");
        setStatus("");
        setInstallationDate("");
        setRemark("");
        setWarningLevel("");
        setLatitude("");
        setLongitude("");
        setOrder("");
        setDistrictId("");
        setCommuneId("");
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
            powerSupply: powerSupply || undefined,
            communication: communication || undefined,
            elevation: elevation !== "" ? Number(elevation) : undefined,
            status: status || undefined,
            installationDate: installationDate || undefined,
            remark: remark || undefined,
            warningLevel: warningLevel !== "" ? Number(warningLevel) : undefined,
            latitude: latitude !== "" ? Number(latitude) : undefined,
            longitude: longitude !== "" ? Number(longitude) : undefined,
            order: order !== "" ? Number(order) : undefined,
            districtId: districtId !== "" ? Number(districtId) : null,
            communeId: communeId !== "" ? Number(communeId) : null,
        };

        const res = await fetch(editId ? `/api/meteorological-stations/${editId}` : "/api/meteorological-stations", {
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
            alert(editId ? "Failed to update meteorological station" : "Failed to create meteorological station");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        const token = getStoredToken();
        if (!token) return;
        const res = await fetch(`/api/meteorological-stations/${id}`, {
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
                    <h1 className="text-3xl font-bold text-slate-900">Meteorological Station List</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        គ្រប់គ្រងព័ត៌មាន ស្ថានីយឧតុនិយម
                    </p>
                </div>

                {sessionUser?.role !== "admin" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-slate-800">{editId ? "កែប្រែស្ថានីយ (Edit Meteorological Station)" : "បន្ថែមស្ថានីយថ្មី (Add New Meteorological Station)"}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Meteorological Station Name (English)</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Meteorological Station Name (Khmer)</label>
                                <input type="text" value={khmerName} onChange={e => setKhmerName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            {/* <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">River/Lake</label>
                                <input type="text" value={river} onChange={e => setRiver(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div> */}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Monitoring Functions</label>
                                <input type="text" value={monitoringFunctions} onChange={e => setMonitoringFunctions(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">ប្រភពថាមពល (Power Supply)</label>
                                <select value={powerSupply} onChange={e => setPowerSupply(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                                    <option value="">ជ្រើសរើស (Select)</option>
                                    <option value="Solar">Solar</option>
                                    <option value="Electricity">Electricity</option>
                                    <option value="Battery">Battery</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">ការបញ្ជូនទិន្នន័យ (Communication)</label>
                                <select value={communication} onChange={e => setCommunication(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                                    <option value="">ជ្រើសរើស (Select)</option>
                                    <option value="4G">4G</option>
                                    <option value="Internet">Internet</option>
                                    <option value="Satellite">Satellite</option>
                                    <option value="Manual">Manual</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">កម្ពស់ពីនីវ៉ូទឹកសមុទ្រ (Elevation)</label>
                                <input type="number" step="any" value={elevation} onChange={e => setElevation(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">ស្ថានភាព (Status)</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                                    <option value="">ជ្រើសរើសស្ថានភាព</option>
                                    <option value="ដំណើរការ">ដំណើរការ</option>
                                    <option value="កំពុងជួសជុល">កំពុងជួសជុល</option>
                                    <option value="ខូច">ខូច</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">កាលបរិច្ឆេទដំឡើង (Installation Date)</label>
                                <input type="date" value={installationDate} onChange={e => setInstallationDate(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>

                            {/* <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">កម្រិតកម្ពស់ប្រុងប្រយ័ត្ន (Warning Level)</label>
                                <input type="number" step="any" value={warningLevel} onChange={e => setWarningLevel(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div> */}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Lat./X</label>
                                <input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Long./Y</label>
                                <input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">ស្រុក (District)</label>
                                <select
                                    value={districtId}
                                    onChange={e => {
                                        setDistrictId(e.target.value === "" ? "" : Number(e.target.value));
                                        setCommuneId("");
                                    }}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="">ជ្រើសរើសស្រុក (Select District)</option>
                                    {districts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} {d.khmerName ? `(${d.khmerName})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">ឃុំ/សង្កាត់ (Commune)</label>
                                <select
                                    value={communeId}
                                    onChange={e => setCommuneId(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                    disabled={!districtId}
                                >
                                    <option value="">ជ្រើសរើសឃុំ (Select Commune)</option>
                                    {communes.filter(c => c.districtId === districtId).map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.khmerName ? `(${c.khmerName})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Order (លេខរៀង)</label>
                                <input type="number" value={order} onChange={e => setOrder(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="mb-1 block text-sm font-semibold text-slate-700">ផ្សេងៗ (Remark)</label>
                                <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
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
                                    <th className="px-4 py-3">Meteorological Station Name</th>
                                    <th className="px-4 py-3">Khmer Name</th>
                                    {/* <th className="px-4 py-3">Province</th> */}
                                    <th className="px-4 py-3">District</th>
                                    <th className="px-4 py-3">Commune</th>
                                    {/* <th className="px-4 py-3">River/Lake</th>
                                    <th className="px-4 py-3">Category</th> */}
                                    <th className="px-4 py-3">Monitoring Functions</th>
                                    <th className="px-4 py-3">Power Supply</th>
                                    <th className="px-4 py-3">Communication</th>
                                    <th className="px-4 py-3">Elevation</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Installation Date</th>
                                    {/* <th className="px-4 py-3">Warning Level</th> */}
                                    <th className="px-4 py-3">Remark</th>
                                    {/* <th className="px-4 py-3">Lat./X</th>
                                    <th className="px-4 py-3">Long./Y</th> */}
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
                                        {/* <td className="px-4 py-3">{st.province.name}</td> */}
                                        <td className="px-4 py-3">{st.district?.khmerName || ""}</td>
                                        <td className="px-4 py-3">{st.commune?.khmerName || ""}</td>
                                        {/* <td className="px-4 py-3">{st.river}</td>
                                        <td className="px-4 py-3">{st.category}</td> */}
                                        <td className="px-4 py-3">{st.monitoringFunctions}</td>
                                        <td className="px-4 py-3">{st.powerSupply}</td>
                                        <td className="px-4 py-3">{st.communication}</td>
                                        <td className="px-4 py-3">{st.elevation}</td>
                                        <td className="px-4 py-3">{st.status}</td>
                                        <td className="px-4 py-3">{st.installationDate ? new Date(st.installationDate).toLocaleDateString("km-KH") : ""}</td>
                                        {/* <td className="px-4 py-3">{st.warningLevel}</td> */}
                                        <td className="px-4 py-3">{st.remark}</td>
                                        {/* <td className="px-4 py-3">{st.latitude}</td>
                                        <td className="px-4 py-3">{st.longitude}</td> */}
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
                                        <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
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
