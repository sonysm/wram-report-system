import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  clearStoredToken,
  fetchSessionUser,
  getStoredToken,
  type SessionUser,
} from "../lib/session";
import ThemeSwitcher from "./ThemeSwitcher";
import NotificationDropdown from "./NotificationDropdown";

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

  const mainNavItems: NavItem[] = [
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
      href: "/staff-structure",
      label: "រចនាសម្ព័ន្ធមន្រ្តី បុគ្គលិក",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      href: "/irrigation-systems",
      label: "ប្រព័ន្ធធារាសាស្រ្ត",
      badge: "Coming Soon",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />
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
      href: "/waterways",
      label: "ទន្លេ ស្ទឹង ព្រែក អូរ",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75c2.5-1.5 5 1.5 7.5 0s5-1.5 7.5 0 4.5.75 4.5.75M2.25 17.25c2.5-1.5 5 1.5 7.5 0s5-1.5 7.5 0 4.5.75 4.5.75M2.25 8.25c2.5-1.5 5 1.5 7.5 0s5-1.5 7.5 0 4.5.75 4.5.75" />
        </svg>
      ),
    },
    {
      href: "/subprojects",
      label: "ផែនការអនុគម្រោង",
      badge: "Concept Note",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
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
      href: "/reports",
      label: "របាយការណ៍ផលប៉ះពាល់",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.143 2.143L15.75 6" />
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
    {
      href: "/flood-reports",
      label: "របាយការណ៍ទឹកជំនន់",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 14.25v-2.625a3.375 3.375 0 0 1 3.375-3.375h1.5M10.5 8.25h3m-3 3h3m-10.5 4.5h15m-15 3h15" />
        </svg>
      ),
    },
  ];

  const systemNavItems: NavItem[] = [
    {
      href: "/settings",
      label: "ការកំណត់ប្រព័ន្ធ",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
    {
      href: "/about",
      label: "អំពីប្រព័ន្ធ (About)",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      ),
    },
    {
      href: "/contact",
      label: "ទំនាក់ទំនង (Contact)",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
        </svg>
      ),
    },
  ];

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#f8fafc_40%,_#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_top_left,_#0c2538_0%,_#090d16_50%,_#050811_100%)] px-5 py-10 text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-6 py-4 shadow-sm text-sm text-slate-600 dark:text-slate-300">
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
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_#cffafe_0%,_#f8fafc_40%,_#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_top_left,_#0b1e2e_0%,_#090d16_40%,_#050811_100%)] text-slate-800 dark:text-slate-100 transition-colors">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden no-print"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 no-print ${isCollapsed ? "lg:w-20" : "lg:w-72"
          } w-72 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-18 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4">
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
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">WRAM Platform</p>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">Report System</h2>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 lg:block transition"
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
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Modules */}
          <div>
            {!isCollapsed && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                មឺនុយមេ (Main Modules)
              </div>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const active = isCurrent(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${active
                      ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/25 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                      } ${isCollapsed ? "justify-center px-2" : ""}`}
                  >
                    <span
                      className={
                        active
                          ? "text-white"
                          : "text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                      }
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active
                              ? "bg-white/20 text-white"
                              : "bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300"
                              }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* System & Support */}
          <div>
            {!isCollapsed && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                ប្រព័ន្ធ & ជំនួយ (System & Support)
              </div>
            )}
            <nav className="space-y-1">
              {systemNavItems.map((item) => {
                const active = isCurrent(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${active
                      ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/25 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                      } ${isCollapsed ? "justify-center px-2" : ""}`}
                  >
                    <span
                      className={
                        active
                          ? "text-white"
                          : "text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                      }
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer / User & Logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-bold text-xs uppercase shadow-xs">
                  {sessionUser.username ? sessionUser.username.charAt(0) : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {sessionUser.username}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="capitalize font-medium text-cyan-700 dark:text-cyan-400">{sessionUser.role}</span>
                    {sessionUser.provinceName ? ` • ${sessionUser.provinceName}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 transition hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-[0.98]"
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition"
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
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-md no-print">
          {/* Left section: mobile hamburger & breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">ក្រសួងធនធានទឹក និងឧតុនិយម</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                {sessionUser.provinceName ? `មន្ទីរ${sessionUser.provinceName}` : "ថ្នាក់កណ្តាល (National)"}
              </span>
            </div>
          </div>

          {/* Right section: Theme Switcher, Notifications, Quick Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Theme Switcher (System, Light, Dark) */}
            <ThemeSwitcher />

            {/* Settings Quick Link */}
            <Link
              href="/settings"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title="ការកំណត់ (Settings)"
              aria-label="Settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </Link>

            {/* Profile Avatar */}
            <div
              className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-default"
              title={`${sessionUser.username} (${sessionUser.role})`}
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
