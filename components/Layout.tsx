import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  clearStoredToken,
  fetchSessionUser,
  getStoredToken,
  type SessionUser,
} from "../lib/session";

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const ensureSession = async () => {
      const token = getStoredToken();
      if (!token) {
        clearStoredToken();
        if (!isCancelled) {
          setSessionUser(null);
          setIsCheckingSession(false);
        }
        void router.replace("/login");
        return;
      }

      const user = await fetchSessionUser(token);
      if (!user) {
        clearStoredToken();
        if (!isCancelled) {
          setSessionUser(null);
          setIsCheckingSession(false);
        }
        void router.replace("/login");
        return;
      }

      if (!isCancelled) {
        setSessionUser(user);
        setIsCheckingSession(false);
      }
    };

    void ensureSession();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    clearStoredToken();
    setSessionUser(null);
    await router.push("/login");
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/province-water", label: "Province Water" },
    { href: "/reports", label: "WRAM Reports" },
  ];

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#f8fafc_40%,_#f1f5f9_100%)] px-5 py-10 text-slate-800 sm:px-8">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          Checking session...
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#f8fafc_40%,_#f1f5f9_100%)] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">WRAM Platform</p>
              <strong className="text-lg text-slate-900">Report System</strong>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{sessionUser.username}</p>
                <p className="mt-0.5">
                  {sessionUser.role}
                  {sessionUser.provinceName ? ` • ${sessionUser.provinceName}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Logout
              </button>
            </div>
          </div>

          <div>
            <nav className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 p-1">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
