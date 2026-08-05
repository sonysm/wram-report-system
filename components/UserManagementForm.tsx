import Link from "next/link";
import { useEffect, useState } from "react";

interface ProvinceOption {
    id: number;
    code: string | null;
    name: string;
    khmerName: string;
    postalCode: number | null;
    sortOrder: number | null;
}

interface ManagedUser {
    id: number;
    username: string;
    role: string;
    provinceId: number | null;
    provinceName: string | null;
}

function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem("token");
}

export default function UserManagementForm() {
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [resetPasswords, setResetPasswords] = useState<Record<number, string>>({});

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [provinceId, setProvinceId] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resettingUserId, setResettingUserId] = useState<number | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [authError, setAuthError] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"success" | "error" | "">("");

    const authHeaders = (token: string) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    });

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

    const loadUsers = async (token: string) => {
        const response = await fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? "Unable to load users");
        }

        const payload = await response.json();
        setUsers(payload.users ?? []);
    };

    const loadInitialData = async () => {
        const token = getToken();
        if (!token) {
            setAuthError("Please login as super admin to manage users.");
            setIsLoading(false);
            return;
        }

        try {
            await Promise.all([loadProvinces(token), loadUsers(token)]);
            setAuthError("");
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Unable to load user management data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadInitialData();
    }, []);

    const handleResetPassword = async (user: ManagedUser) => {
        const token = getToken();
        if (!token) {
            setStatus("error");
            setMessage("Please login first.");
            return;
        }

        const nextPassword = (resetPasswords[user.id] ?? "").trim();

        if (!nextPassword) {
            setStatus("error");
            setMessage("Please enter a new password before reset.");
            return;
        }

        if (nextPassword.length < 6) {
            setStatus("error");
            setMessage("Password must be at least 6 characters.");
            return;
        }

        setResettingUserId(user.id);
        setStatus("");
        setMessage("");

        try {
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: authHeaders(token),
                body: JSON.stringify({
                    userId: user.id,
                    newPassword: nextPassword,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error ?? "Unable to reset password");
            }

            setResetPasswords((prev) => ({ ...prev, [user.id]: "" }));
            setStatus("success");
            setMessage(payload.message ?? `Password reset for ${user.username}`);
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to reset password");
        } finally {
            setResettingUserId(null);
        }
    };

    const handleDeleteUser = async (user: ManagedUser) => {
        const token = getToken();
        if (!token) {
            setStatus("error");
            setMessage("Please login first.");
            return;
        }

        const confirmed = window.confirm(
            `Disable ${user.username}? They will disappear from the system, but their reference data will stay.`,
        );

        if (!confirmed) {
            return;
        }

        setDeletingUserId(user.id);
        setStatus("");
        setMessage("");

        try {
            const response = await fetch("/api/users", {
                method: "DELETE",
                headers: authHeaders(token),
                body: JSON.stringify({ userId: user.id }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error ?? "Unable to disable user");
            }

            setResetPasswords((prev) => {
                const next = { ...prev };
                delete next[user.id];
                return next;
            });
            setUsers((prev) => prev.filter((currentUser) => currentUser.id !== user.id));
            setStatus("success");
            setMessage(payload.message ?? `User ${user.username} disabled`);
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to disable user");
        } finally {
            setDeletingUserId(null);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = getToken();
        if (!token) {
            setStatus("error");
            setMessage("Please login first.");
            return;
        }

        const normalizedUsername = username.trim();
        const normalizedPassword = password.trim();
        const parsedProvinceId = Number(provinceId);

        if (!normalizedUsername || !normalizedPassword || !provinceId || Number.isNaN(parsedProvinceId)) {
            setStatus("error");
            setMessage("Username, password, and province are required.");
            return;
        }

        setIsSubmitting(true);
        setStatus("");
        setMessage("");

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: authHeaders(token),
                body: JSON.stringify({
                    username: normalizedUsername,
                    password: normalizedPassword,
                    provinceId: parsedProvinceId,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error ?? "Unable to create user");
            }

            setStatus("success");
            setMessage("User created successfully.");
            setUsername("");
            setPassword("");
            setProvinceId("");

            await loadUsers(token);
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to create user");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <p className="text-sm text-slate-500">Loading user management...</p>;
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
            <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                        <label htmlFor="newUsername" className="mb-2 block text-sm font-medium text-slate-700">
                            Username
                        </label>
                        <input
                            id="newUsername"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            required
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            id="newPassword"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            type="password"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="newProvince" className="mb-2 block text-sm font-medium text-slate-700">
                            Province
                        </label>
                        <select
                            id="newProvince"
                            value={provinceId}
                            onChange={(e) => setProvinceId(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            required
                        >
                            <option value="">Select province</option>
                            {provinces.map((province) => (
                                <option key={province.id} value={province.id}>
                                    {(province.code ? `${province.code} - ` : "") + (province.khmerName || province.name)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? "Creating..." : "Create User"}
                </button>

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

            <div>
                <h3 className="text-base font-semibold text-slate-900">Existing users</h3>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-left text-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Username</th>
                                <th className="px-4 py-3 font-semibold">Role</th>
                                <th className="px-4 py-3 font-semibold">Province</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                                        No users yet.
                                    </td>
                                </tr>
                            )}
                            {users.map((user) => (
                                <tr key={user.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3">{user.username}</td>
                                    <td className="px-4 py-3">{user.role}</td>
                                    <td className="px-4 py-3">{user.provinceName ?? "-"}</td>
                                    <td className="px-4 py-3">
                                        {user.role === "user" ? (
                                            <div className="flex min-w-[320px] items-center gap-2">
                                                <input
                                                    value={resetPasswords[user.id] ?? ""}
                                                    onChange={(e) =>
                                                        setResetPasswords((prev) => ({
                                                            ...prev,
                                                            [user.id]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="New password"
                                                    type="password"
                                                    minLength={6}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => void handleResetPassword(user)}
                                                    disabled={resettingUserId === user.id || deletingUserId === user.id}
                                                    className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {resettingUserId === user.id ? "Resetting..." : "Reset"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteUser(user)}
                                                    disabled={resettingUserId === user.id || deletingUserId === user.id}
                                                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {deletingUserId === user.id ? "Disabling..." : "Delete"}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500">Not available</span>
                                        )}
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