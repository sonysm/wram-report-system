import type { NextPage } from "next";
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useTheme, type ThemeMode } from "../lib/theme";
import { getStoredToken, fetchSessionUser, type SessionUser } from "../lib/session";

const SettingsPage: NextPage = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  // Notification Preferences
  const [notifyWaterLevel, setNotifyWaterLevel] = useState(true);
  const [notifyFloodAlert, setNotifyFloodAlert] = useState(true);
  const [notifySubproject, setNotifySubproject] = useState(true);
  const [notifySound, setNotifySound] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      void fetchSessionUser(token).then((user) => {
        if (user) setSessionUser(user);
      });
    }

    // Load saved preferences
    try {
      const prefs = window.localStorage.getItem("wram_notification_prefs");
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.notifyWaterLevel !== undefined) setNotifyWaterLevel(parsed.notifyWaterLevel);
        if (parsed.notifyFloodAlert !== undefined) setNotifyFloodAlert(parsed.notifyFloodAlert);
        if (parsed.notifySubproject !== undefined) setNotifySubproject(parsed.notifySubproject);
        if (parsed.notifySound !== undefined) setNotifySound(parsed.notifySound);
      }
    } catch (e) {
      console.warn("Could not load notification preferences", e);
    }
  }, []);

  const savePreferences = () => {
    const prefs = {
      notifyWaterLevel,
      notifyFloodAlert,
      notifySubproject,
      notifySound,
    };
    try {
      window.localStorage.setItem("wram_notification_prefs", JSON.stringify(prefs));
      setSaveMessage("ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const themeOptions: {
    id: ThemeMode;
    titleKh: string;
    titleEn: string;
    desc: string;
    icon: React.ReactNode;
    previewBg: string;
  }[] = [
    {
      id: "system",
      titleKh: "តាមប្រព័ន្ធ (System Default)",
      titleEn: "System Theme",
      desc: "ប្តូរពណ៌ពន្លឺ ឬងងឹតដោយស្វ័យប្រវត្តិតាមការកំណត់របស់ឧបករណ៍ ឬកុំព្យូទ័ររបស់អ្នក",
      previewBg: "bg-gradient-to-r from-slate-100 to-slate-900 border-slate-300",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "light",
      titleKh: "ផ្ទៃពណ៌ពន្លឺ (Light)",
      titleEn: "Light Mode",
      desc: "ផ្ទៃពណ៌ស ភ្លឺច្បាស់ ងាយស្រួលមើលក្នុងបរិស្ថានដែលមានពន្លឺថ្ងៃគ្រប់គ្រាន់",
      previewBg: "bg-white border-slate-200 text-slate-800",
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "dark",
      titleKh: "ផ្ទៃពណ៌ងងឹត (Dark)",
      titleEn: "Dark Mode",
      desc: "ផ្ទៃពណ៌ខ្មៅ-ប្រផេះខ្មៅ កាត់បន្ថយចំណាំងពន្លឺ និងជួយសម្រួលដល់ការក្រឡេកមើលពេលយប់",
      previewBg: "bg-slate-950 border-slate-800 text-slate-100",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
              ការកំណត់ទូទៅ • General Settings
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ការកំណត់ប្រព័ន្ធ (System Settings)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              កំណត់ស្បែកពណ៌ (Theme), ការជូនដំណឹង (Notifications) និងព័ត៌មានគណនីរបស់អ្នក
            </p>
          </div>

          {saveMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              ✓ {saveMessage}
            </div>
          )}
        </div>

        {/* 1. Theme Setting Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎨 ស្បែកពណ៌ប្រព័ន្ធ (System Theme)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ជ្រើសរើសទម្រង់ពណ៌ដែលអ្នកពេញចិត្ត (កំពុងប្រើប្រាស់ជាក់ស្តែង៖{" "}
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {resolvedTheme === "dark" ? "ងងឹត (Dark)" : "ពន្លឺ (Light)"}
                </span>
                )
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected
                      ? "border-cyan-600 bg-cyan-50/40 dark:bg-cyan-950/30 shadow-md ring-2 ring-cyan-600/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {opt.icon}
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {opt.titleKh}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-cyan-600 bg-cyan-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {opt.desc}
                  </p>

                  <div className={`h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold ${opt.previewBg}`}>
                    {opt.titleEn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔔 ការកំណត់ការជូនដំណឹង (Notification Preferences)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ជ្រើសរើសប្រភេទសារប្រកាសអាសន្នដែលអ្នកចង់ឱ្យប្រព័ន្ធជូនដំណឹង
              </p>
            </div>

            <button
              type="button"
              onClick={savePreferences}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              រក្សាទុកជម្រើស
            </button>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
            <label className="pt-3 flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  ការប្រកាសអាសន្នកម្ពស់ទឹក (Water Level Warning Alerts)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  ជូនដំណឹងនៅពេលស្ថានីយកម្ពស់ទឹកឡើងដល់ ឬលើសកម្រិតប្រុងប្រយ័ត្ន
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyWaterLevel}
                onChange={(e) => setNotifyWaterLevel(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            <label className="pt-3 flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  របាយការណ៍ផលប៉ះពាល់ទឹកជំនន់ (Provincial Flood Reports)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  ជូនដំណឹងនៅពេលមានរបាយការណ៍គ្រួសាររងគ្រោះ ឬខូចខាតដំណាំស្រូវថ្មី
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyFloodAlert}
                onChange={(e) => setNotifyFloodAlert(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            <label className="pt-3 flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  បច្ចុប្បន្នភាពសំណើអនុគម្រោង (Subproject Plan Updates)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  ជូនដំណឹងនៅពេលមានការដាក់ស្នើ ឬអនុម័តសំណើអនុគម្រោងស្រាវជ្រាវថ្មី
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifySubproject}
                onChange={(e) => setNotifySubproject(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            <label className="pt-3 flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  សំឡេងរោទ៍ជូនដំណឹង (Sound Alert on Urgent Warning)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  បន្លឺសំឡេងនៅពេលមានការប្រកាសអាសន្នទឹកជំនន់បន្ទាន់
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifySound}
                onChange={(e) => setNotifySound(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>
          </div>
        </div>

        {/* 3. Account Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>👤 ព័ត៌មានគណនី (Account Profile)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ព័ត៌មានគណនីដែលកំពុងដំណើរការក្នុងប្រព័ន្ធ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400">ឈ្មោះគណនី (Username)</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {sessionUser?.username || "N/A"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400">តួនាទី (Role)</div>
              <div className="font-bold text-cyan-700 dark:text-cyan-400 text-sm mt-0.5 capitalize">
                {sessionUser?.role || "user"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400">រាជធានី-ខេត្ត (Province)</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {sessionUser?.provinceName || "គ្រប់ខេត្ត (All Provinces)"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;

