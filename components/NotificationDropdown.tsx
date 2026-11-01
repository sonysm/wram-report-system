import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export interface SystemNotification {
  id: string;
  type: "ALERT" | "FLOOD" | "SUBPROJECT" | "WEATHER" | "SYSTEM";
  severity: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  title: string;
  message: string;
  link?: string;
  timestamp: string;
  provinceName?: string;
}

const READ_STORAGE_KEY = "wram_read_notifications";

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "ALERTS">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(READ_STORAGE_KEY);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read stored notifications", e);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications();
    // Poll every 60s
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      try {
        window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(allIds));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const filteredList = notifications.filter((n) => {
    const isUnread = !readIds.includes(n.id);
    if (filter === "UNREAD") return isUnread;
    if (filter === "ALERTS") return n.severity === "CRITICAL" || n.severity === "WARNING";
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">អាសន្ន</span>;
      case "WARNING":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">ប្រុងប្រយ័ត្ន</span>;
      case "SUCCESS":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">ជោគជ័យ</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">ព័ត៌មាន</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ALERT":
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "FLOOD":
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 14.25v-2.625a3.375 3.375 0 0 1 3.375-3.375h1.5M10.5 8.25h3m-3 3h3m-10.5 4.5h15m-15 3h15" />
            </svg>
          </div>
        );
      case "SUBPROJECT":
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        title="ការជូនដំណឹង (Notifications)"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">ការជូនដំណឹង</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                  {unreadCount} ថ្មី
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
              >
                សម្គាល់ថាអានរួច
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-3 py-1.5 gap-1 text-xs bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === "ALL"
                  ? "bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              ទាំងអស់ ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("UNREAD")}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === "UNREAD"
                  ? "bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              មិនទាន់អាន ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("ALERTS")}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filter === "ALERTS"
                  ? "bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              អាសន្ន/ជំនន់
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">កំពុងទាញយកការជូនដំណឹង...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">មិនមានការជូនដំណឹងថ្មីឡើយ</p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isRead = readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      if (item.link) {
                        setIsOpen(false);
                        void router.push(item.link);
                      }
                    }}
                    className={`p-3.5 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                      !isRead ? "bg-cyan-50/30 dark:bg-cyan-950/20" : ""
                    }`}
                  >
                    {getTypeIcon(item.type)}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </span>
                        {getSeverityBadge(item.severity)}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>{new Date(item.timestamp).toLocaleString("km-KH", { hour12: true })}</span>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-cyan-600"></span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              ⚙️ កំណត់ការជូនដំណឹង (Notification Settings)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

