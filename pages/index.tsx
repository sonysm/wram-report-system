import Link from "next/link";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import UserManagementForm from "../components/UserManagementForm";

interface CurrentUser {
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

const Home: NextPage = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = getToken();
      if (!token) {
        setAuthError("Please login first.");
        setIsLoadingUser(false);
        return;
      }

      try {
        const response = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Session expired. Please login again.");
        }

        const payload = await response.json();
        setCurrentUser(payload);
        setAuthError("");
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Unable to load profile");
      } finally {
        setIsLoadingUser(false);
      }
    };

    void loadCurrentUser();
  }, []);

  const isAdmin = currentUser?.role === "admin";

  return (
    <Layout>
      <section className="space-y-6">
        <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.55)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
                Operations Dashboard
              </p>
              <h1 className="mt-4 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                WRAM Report System
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Capture monthly department metrics and keep your reporting data clean and consistent.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Submission Status</p>
                <p className="mt-2 text-2xl font-bold text-emerald-900">{isAdmin ? "Admin Mode" : "Ready"}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Data Scope</p>
                <p className="mt-2 text-2xl font-bold text-amber-900">{isAdmin ? "All Provinces" : "Province"}</p>
              </div>
            </div>
          </div>
        </article>

        {isLoadingUser ? (
          <article className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.55)] sm:p-10">
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </article>
        ) : authError ? (
          <article className="rounded-3xl border border-amber-300 bg-amber-50 p-7 text-amber-900 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.55)] sm:p-10">
            <p className="text-sm font-medium">{authError}</p>
            <Link href="/login" className="mt-3 inline-flex text-sm font-semibold underline">
              Go to login
            </Link>
          </article>
        ) : isAdmin ? (
          <article className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.55)] sm:p-10">
            <h2 className="text-xl font-semibold text-slate-900">Manage Users</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create province user accounts and assign each user to their province.
            </p>
            <div className="mt-6">
              <UserManagementForm />
            </div>
          </article>
        ) : (
          <article className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.55)] sm:p-10">
            <h2 className="text-xl font-semibold text-slate-900">Welcome to WRAM Report System</h2>
            <p className="mt-2 text-sm text-slate-600">
              You are logged in as {currentUser?.username} ({currentUser?.provinceName}).
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/reports"
                className="inline-flex rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
              >
                របាយការណ៍ទិន្ន័យផលប៉ះពាល់
              </Link>
              <Link
                href="/province-water"
                className="inline-flex rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
              >
                អាងស្ដុកទឹក
              </Link>
            </div>
          </article>
        )}
      </section>
    </Layout>
  );
};

export default Home;
