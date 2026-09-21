import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  clearStoredToken,
  fetchSessionUser,
  getStoredToken,
  type SessionUser,
} from "../lib/session";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
  icon: ReactNode;
}

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [router.pathname]);

  const handleLogout = async () => {
    clearStoredToken();
    setSessionUser(null);
    await router.push("/login");
  };

  const isCurrent = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname === href || router.pathname.startsWith(href + "/");
  };

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "ទំព័រដើម",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: "/province-water",
      label: "អាងស្ដុកទឹក",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.25 7.5-6.75 10.5-6.75 13.5a6.75 6.75 0 0 0 13.5 0c0-3-1.5-6-6.75-13.5Z" />
        </svg>
      ),
    },
    {
      href: "/fwuc",
      label: "សកបទ (FWUC)",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
    {
      href: "/reports",
      label: "របាយការណ៍ទិន្ន័យផលប៉ះពាល់",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      href: "/stations",
      label: "ស្ថានីយជលសាស្ត្រ",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M3.75 18c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M12 3v7m-3-4 3-3 3 3" />
        </svg>
      ),
    },
    {
      href: "/meteorological-stations",
      label: "ស្ថានីយឧតុនិយម",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
        </svg>
      ),
    },
    {
      href: "/station-reports",
      label: "របាយការណ៍កម្ពស់ទឹក",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
    {
      href: "/province-daily-report",
      label: "របាយការណ៍ប្រចាំថ្ងៃ",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
      ),
    },
  ];

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#f8fafc_40%,_#f1f5f9_100%)] px-5 py-10 text-slate-800">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 shadow-sm text-sm text-slate-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
          <span>កំពុងផ្ទៀងផ្ទាត់គណនី (Checking session...)...</span>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#f8fafc_40%,_#f1f5f9_100%)] text-slate-800">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden no-print"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 no-print ${
          isCollapsed ? "lg:w-20" : "lg:w-72"
        } w-72 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-18 items-center justify-between border-b border-slate-100 px-4">
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.25 7.5-6.75 10.5-6.75 13.5a6.75 6.75 0 0 0 13.5 0c0-3-1.5-6-6.75-13.5Z" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">WRAM Platform</p>
                <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">Report System</h2>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:block transition"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!isCollapsed && (
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              មឺនុយមេ (Navigation)
            </div>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isCurrent(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/25 font-semibold"
                      : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                >
                  <span
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-cyan-600 transition-colors"
                    }
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User & Logout */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2.5">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-bold text-xs uppercase shadow-xs">
                  {sessionUser.username ? sessionUser.username.charAt(0) : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
                    {sessionUser.username}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 mt-0.5">
                    <span className="capitalize font-medium text-cyan-700">{sessionUser.role}</span>
                    {sessionUser.provinceName ? ` • ${sessionUser.provinceName}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                <span>ចាកចេញ (Logout)</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-bold text-xs uppercase shadow-xs"
                title={`${sessionUser.username} (${sessionUser.role}${sessionUser.provinceName ? ` • ${sessionUser.provinceName}` : ""})`}
              >
                {sessionUser.username ? sessionUser.username.charAt(0) : "U"}
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 transition"
                title="ចាកចេញ (Logout)"
                aria-label="Logout"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden no-print">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-xs">
              W
            </div>
            <strong className="text-sm font-bold text-slate-900">WRAM Report</strong>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-xs font-bold"
              title={sessionUser.username}
            >
              {sessionUser.username ? sessionUser.username.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
