import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  CIVIL_SERVANT_RANKS,
  DEPARTMENT_LEADERSHIP_POSITIONS,
  EDUCATION_LEVELS,
  STAFF_GENDERS,
  STAFF_OFFICES,
  STAFF_POSITIONS,
  STAFF_SKILLS,
  getPositionRank,
} from "../lib/staffConstants";

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  provinceId: number | null;
  provinceName: string | null;
}

interface ProvinceOption {
  id: number;
  name: string;
  khmerName: string;
  sortOrder?: number | null;
}

interface StaffMember {
  id: number;
  provinceId: number;
  fullName: string;
  latinName: string | null;
  gender: string;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  email: string | null;
  civilServantId: string | null;
  position: string;
  office: string | null;
  civilServantRank: string | null;
  educationLevel: string;
  skill: string;
  majorDetail: string | null;
  startWorkDate: string | null;
  assignedLocation: string | null;
  trainingNotes: string | null;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  province?: { id: number; name: string; khmerName: string; sortOrder?: number | null };
  user?: { id: number; username: string } | null;
}

interface StaffFormState {
  provinceId: string;
  fullName: string;
  latinName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  civilServantId: string;
  position: string;
  office: string;
  civilServantRank: string;
  educationLevel: string;
  skill: string;
  majorDetail: string;
  startWorkDate: string;
  assignedLocation: string;
  trainingNotes: string;
  isActive: boolean;
  note: string;
}

type ActiveTab = "list" | "stats" | "structure";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function createEmptyForm(defaultProvinceId = ""): StaffFormState {
  return {
    provinceId: defaultProvinceId,
    fullName: "",
    latinName: "",
    gender: "ប្រុស",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    civilServantId: "",
    position: "មន្រ្តី",
    office: STAFF_OFFICES[0],
    civilServantRank: "ក្របខ័ណ្ឌ ក",
    educationLevel: "បរិញ្ញាបត្រ (Bachelor)",
    skill: STAFF_SKILLS[0],
    majorDetail: "",
    startWorkDate: "",
    assignedLocation: "",
    trainingNotes: "",
    isActive: true,
    note: "",
  };
}

export default function StaffManagementFeature() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const isAdmin = currentUser?.role === "admin";

  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffFormState>(createEmptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvinceId, setFilterProvinceId] = useState("");
  const [filterOffice, setFilterOffice] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterEducation, setFilterEducation] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const loadData = async () => {
    const token = getToken();
    if (!token) {
      setAuthError("សូមចូលប្រើប្រាស់ប្រព័ន្ធជាមុនសិន។");
      setIsLoading(false);
      return;
    }

    try {
      const userRes = await fetch("/api/me", { headers: authHeaders(token) });
      if (!userRes.ok) throw new Error("Session expired.");
      const user: CurrentUser = await userRes.json();
      setCurrentUser(user);

      const staffRes = await fetch("/api/staff", { headers: authHeaders(token) });
      if (staffRes.ok) {
        const data: StaffMember[] = await staffRes.json();
        setStaffList(data);
      }

      if (user.role === "admin") {
        const provRes = await fetch("/api/provinces", { headers: authHeaders(token) });
        if (provRes.ok) {
          const provData = await provRes.json();
          setProvinces(provData.provinces || provData);
        }
      }
    } catch (err) {
      console.error(err);
      setAuthError("មិនអាចទាញយកទិន្នន័យបានទេ។ សូមព្យាយាមម្ដងទៀត។");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const isDeptLeadership = (
    DEPARTMENT_LEADERSHIP_POSITIONS as readonly string[]
  ).includes(form.position);

  const openAddForm = () => {
    setEditingId(null);
    const defaultProv = isAdmin
      ? filterProvinceId || (provinces[0]?.id ? String(provinces[0].id) : "")
      : currentUser?.provinceId
      ? String(currentUser.provinceId)
      : "";
    setForm(createEmptyForm(defaultProv));
    setFeedback(null);
    setIsFormOpen(true);
  };

  const openEditForm = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({
      provinceId: String(member.provinceId),
      fullName: member.fullName,
      latinName: member.latinName || "",
      gender: member.gender || "ប្រុស",
      dateOfBirth: toDateInputValue(member.dateOfBirth),
      phoneNumber: member.phoneNumber || "",
      email: member.email || "",
      civilServantId: member.civilServantId || "",
      position: member.position,
      office: member.office || "",
      civilServantRank: member.civilServantRank || "",
      educationLevel: member.educationLevel,
      skill: member.skill,
      majorDetail: member.majorDetail || "",
      startWorkDate: toDateInputValue(member.startWorkDate),
      assignedLocation: member.assignedLocation || "",
      trainingNotes: member.trainingNotes || "",
      isActive: member.isActive,
      note: member.note || "",
    });
    setFeedback(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        ...form,
        provinceId: isAdmin ? Number(form.provinceId) : currentUser?.provinceId,
        office: isDeptLeadership ? form.office || null : form.office || null,
      };

      const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "រក្សាទុកមិនបានជោគជ័យ" });
        return;
      }

      if (editingId) {
        setStaffList((prev) => prev.map((s) => (s.id === editingId ? data : s)));
        setFeedback({ type: "success", text: "កែប្រែព័ត៌មានមន្ត្រី-បុគ្គលិកបានជោគជ័យ!" });
      } else {
        setStaffList((prev) => [data, ...prev]);
        setFeedback({ type: "success", text: "បន្ថែមមន្ត្រី-បុគ្គលិកថ្មីបានជោគជ័យ!" });
      }

      setIsFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "មានបញ្ហាបច្ចេកទេសក្នុងការរក្សាទុក។" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (member: StaffMember) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបឈ្មោះ «${member.fullName}» មែនទេ?`)) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) {
        const data = await res.json();
        setFeedback({ type: "error", text: data.error || "លុបមិនបានជោគជ័យ" });
        return;
      }
      setStaffList((prev) => prev.filter((s) => s.id !== member.id));
      setFeedback({ type: "success", text: `បានលុប «${member.fullName}» រួចរាល់។` });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "មានបញ្ហាក្នុងការលុបទិន្នន័យ។" });
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staffList.filter((s) => {
      if (isAdmin && filterProvinceId && String(s.provinceId) !== filterProvinceId) {
        return false;
      }
      if (filterOffice) {
        if (filterOffice === "__LEADERSHIP__") {
          if (s.office) return false;
        } else if (s.office !== filterOffice) {
          return false;
        }
      }
      if (filterPosition && s.position !== filterPosition) return false;
      if (filterEducation && s.educationLevel !== filterEducation) return false;
      if (filterSkill && s.skill !== filterSkill) return false;
      if (filterGender && s.gender !== filterGender) return false;

      if (q) {
        const haystack = [
          s.fullName,
          s.latinName || "",
          s.phoneNumber || "",
          s.civilServantId || "",
          s.majorDetail || "",
          s.assignedLocation || "",
          s.skill,
          s.position,
          s.office || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    staffList,
    isAdmin,
    filterProvinceId,
    filterOffice,
    filterPosition,
    filterEducation,
    filterSkill,
    filterGender,
    searchQuery,
  ]);

  // Statistics computed on filteredStaff so filters also slice the stats!
  const stats = useMemo(() => {
    const total = filteredStaff.length;
    const active = filteredStaff.filter((s) => s.isActive).length;
    const female = filteredStaff.filter((s) => s.gender === "ស្រី").length;
    const male = total - female;

    const higherEdSet = new Set([
      "បណ្ឌិត (PhD)",
      "អនុបណ្ឌិត (Master)",
      "បរិញ្ញាបត្រ (Bachelor)",
    ]);
    const higherEd = filteredStaff.filter((s) => higherEdSet.has(s.educationLevel)).length;

    const contractAndGuard = filteredStaff.filter(
      (s) => s.position === "បុគ្គលិកកិច្ចសន្យា" || s.position === "ឆ្មាំទំនប់"
    ).length;

    const byEducation = EDUCATION_LEVELS.map((level) => {
      const items = filteredStaff.filter((s) => s.educationLevel === level);
      return {
        label: level,
        count: items.length,
        female: items.filter((s) => s.gender === "ស្រី").length,
      };
    });

    const bySkill = STAFF_SKILLS.map((sk) => {
      const items = filteredStaff.filter((s) => s.skill === sk);
      return {
        label: sk,
        count: items.length,
        female: items.filter((s) => s.gender === "ស្រី").length,
      };
    }).sort((a, b) => b.count - a.count);

    const byPosition = STAFF_POSITIONS.map((pos) => {
      const items = filteredStaff.filter((s) => s.position === pos);
      return {
        label: pos,
        count: items.length,
        female: items.filter((s) => s.gender === "ស្រី").length,
      };
    });

    const leadershipItems = filteredStaff.filter(
      (s) =>
        !s.office ||
        (DEPARTMENT_LEADERSHIP_POSITIONS as readonly string[]).includes(s.position)
    );
    const byOffice = [
      {
        label: "ថ្នាក់ដឹកនាំមន្ទីរ",
        count: leadershipItems.length,
        female: leadershipItems.filter((s) => s.gender === "ស្រី").length,
      },
      ...STAFF_OFFICES.map((off) => {
        const items = filteredStaff.filter((s) => s.office === off);
        return {
          label: off,
          count: items.length,
          female: items.filter((s) => s.gender === "ស្រី").length,
        };
      }),
    ];

    // Province summary (for Admin)
    const provinceMap = new Map<
      number,
      {
        id: number;
        name: string;
        sortOrder: number;
        total: number;
        female: number;
        higherEd: number;
        civilServants: number;
        contractOrGuard: number;
      }
    >();

    for (const s of filteredStaff) {
      const pid = s.provinceId;
      const existing = provinceMap.get(pid) || {
        id: pid,
        name: s.province?.khmerName || s.province?.name || `Province ${pid}`,
        sortOrder: s.province?.sortOrder ?? 999,
        total: 0,
        female: 0,
        higherEd: 0,
        civilServants: 0,
        contractOrGuard: 0,
      };
      existing.total += 1;
      if (s.gender === "ស្រី") existing.female += 1;
      if (higherEdSet.has(s.educationLevel)) existing.higherEd += 1;
      if (s.position === "បុគ្គលិកកិច្ចសន្យា" || s.position === "ឆ្មាំទំនប់") {
        existing.contractOrGuard += 1;
      } else {
        existing.civilServants += 1;
      }
      provinceMap.set(pid, existing);
    }

    const byProvince = Array.from(provinceMap.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    return {
      total,
      active,
      male,
      female,
      higherEd,
      contractAndGuard,
      byEducation,
      bySkill,
      byPosition,
      byOffice,
      byProvince,
    };
  }, [filteredStaff]);

  const handleExportExcel = () => {
    const rows = filteredStaff.map((s, idx) => ({
      "ល.រ": idx + 1,
      ខេត្ត: s.province?.khmerName || s.province?.name || "",
      "គោត្តនាម និងនាម": s.fullName,
      "ឈ្មោះឡាតាំង": s.latinName || "",
      ភេទ: s.gender,
      "អត្តលេខមន្ត្រី": s.civilServantId || "",
      តួនាទី: s.position,
      ការិយាល័យ: s.office || "ថ្នាក់ដឹកនាំមន្ទីរ",
      ក្របខ័ណ្ឌ: s.civilServantRank || "",
      "កម្រិតសិក្សា": s.educationLevel,
      ជំនាញ: s.skill,
      "មុខជំនាញលម្អិត": s.majorDetail || "",
      "លេខទូរស័ព្ទ": s.phoneNumber || "",
      អ៊ីមែល: s.email || "",
      "តំបន់/ទំនប់ទទួលបន្ទុក": s.assignedLocation || "",
      ស្ថានភាព: s.isActive ? "កំពុងបម្រើការងារ" : "ឈប់/ចូលនិវត្តន៍",
      កំណត់សម្គាល់: s.note || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff_List");

    const eduRows = stats.byEducation.map((e) => ({
      "កម្រិតសិក្សា": e.label,
      "ចំនួនសរុប": e.count,
      ស្រី: e.female,
      ប្រុស: e.count - e.female,
    }));
    const wsEdu = XLSX.utils.json_to_sheet(eduRows);
    XLSX.utils.book_append_sheet(wb, wsEdu, "Education_Stats");

    const skillRows = stats.bySkill.map((sk) => ({
      ជំនាញ: sk.label,
      "ចំនួនសរុប": sk.count,
      ស្រី: sk.female,
      ប្រុស: sk.count - sk.female,
    }));
    const wsSkill = XLSX.utils.json_to_sheet(skillRows);
    XLSX.utils.book_append_sheet(wb, wsSkill, "Skill_Stats");

    XLSX.writeFile(wb, `staff-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterProvinceId("");
    setFilterOffice("");
    setFilterPosition("");
    setFilterEducation("");
    setFilterSkill("");
    setFilterGender("");
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
        កំពុងទាញយកទិន្នន័យមន្ត្រី-បុគ្គលិក...
      </div>
    );
  }

  if (authError) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-6 text-sm text-rose-700 dark:text-rose-300">
        {authError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            រចនាសម្ព័ន្ធមន្រ្តី បុគ្គលិក (Staff & Skills)
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            គ្រប់គ្រងបញ្ជីមន្ត្រីរាជការ បុគ្គលិកកិច្ចសន្យា ឆ្មាំទំនប់ កម្រិតសិក្សា និងជំនាញតាមការិយាល័យ{" "}
            {!isAdmin && currentUser?.provinceName ? (
              <span className="inline-flex items-center rounded-md bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 ml-1">
                មន្ទីរខេត្ត {currentUser.provinceName}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredStaff.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            ទាញយក Excel
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            បន្ថែមមន្ត្រី-បុគ្គលិក
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-75 hover:opacity-100"
          >
            បិទ
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">សរុបមន្ត្រី-បុគ្គលិក</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            កំពុងបម្រើការងារ: {stats.active} នាក់
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">បែងចែកតាមភេទ</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            ស្រី {stats.female}{" "}
            <span className="text-sm font-normal text-slate-500">/ ប្រុស {stats.male}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ស្ត្រី {stats.total ? Math.round((stats.female / stats.total) * 100) : 0}% នៃសរុប
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            កម្រិតបរិញ្ញាបត្រឡើង
          </p>
          <p className="mt-1 text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {stats.higherEd}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            បណ្ឌិត, អនុបណ្ឌិត, បរិញ្ញាបត្រ (
            {stats.total ? Math.round((stats.higherEd / stats.total) * 100) : 0}%)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            កិច្ចសន្យា & ឆ្មាំទំនប់
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.contractAndGuard}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            មន្ត្រីក្របខ័ណ្ឌ: {stats.total - stats.contractAndGuard} នាក់
          </p>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? "កែប្រែព័ត៌មានមន្ត្រី-បុគ្គលិក" : "បន្ថែមមន្ត្រី-បុគ្គលិកថ្មី"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Personal Info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3">
                  ១. ព័ត៌មានផ្ទាល់ខ្លួន
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ខេត្ត / រាជធានី *
                      </label>
                      <select
                        required
                        value={form.provinceId}
                        onChange={(e) => setForm({ ...form, provinceId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                      >
                        <option value="">-- ជ្រើសរើសខេត្ត --</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.khmerName || p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      គោត្តនាម និងនាម (ខ្មែរ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="ឧ. សុខ ចាន់"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឈ្មោះជាអក្សរឡាតាំង
                    </label>
                    <input
                      type="text"
                      value={form.latinName}
                      onChange={(e) => setForm({ ...form, latinName: e.target.value })}
                      placeholder="e.g. SOK CHAN"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ភេទ *
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {STAFF_GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ថ្ងៃខែឆ្នាំកំណើត
                    </label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      លេខទូរស័ព្ទ
                    </label>
                    <input
                      type="text"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="012 345 678"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      អត្តលេខមន្ត្រីរាជការ
                    </label>
                    <input
                      type="text"
                      value={form.civilServantId}
                      onChange={(e) => setForm({ ...form, civilServantId: e.target.value })}
                      placeholder="អត្តលេខ"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      អ៊ីមែល
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Position & Office */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3">
                  ២. តួនាទី និងការិយាល័យ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      តួនាទី (Position) *
                    </label>
                    <select
                      required
                      value={form.position}
                      onChange={(e) => {
                        const nextPos = e.target.value;
                        const nextIsLeader = (
                          DEPARTMENT_LEADERSHIP_POSITIONS as readonly string[]
                        ).includes(nextPos);
                        setForm({
                          ...form,
                          position: nextPos,
                          office: nextIsLeader ? "" : form.office || STAFF_OFFICES[0],
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {STAFF_POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ការិយាល័យ {!isDeptLeadership ? "*" : "(ស្រេចចិត្ត)"}
                    </label>
                    <select
                      required={!isDeptLeadership}
                      value={form.office}
                      onChange={(e) => setForm({ ...form, office: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="">
                        {isDeptLeadership ? "ថ្នាក់ដឹកនាំមន្ទីរ (មិនចំណុះការិយាល័យ)" : "-- ជ្រើសរើសការិយាល័យ --"}
                      </option>
                      {STAFF_OFFICES.map((off) => (
                        <option key={off} value={off}>
                          {off}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ក្របខ័ណ្ឌ
                    </label>
                    <select
                      value={form.civilServantRank}
                      onChange={(e) => setForm({ ...form, civilServantRank: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="">-- ជ្រើសរើស --</option>
                      {CIVIL_SERVANT_RANKS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ថ្ងៃចូលបម្រើការងារ
                    </label>
                    <input
                      type="date"
                      value={form.startWorkDate}
                      onChange={(e) => setForm({ ...form, startWorkDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ទីតាំង / អាងទឹក / ទំនប់ទទួលបន្ទុក
                    </label>
                    <input
                      type="text"
                      value={form.assignedLocation}
                      onChange={(e) => setForm({ ...form, assignedLocation: e.target.value })}
                      placeholder="ឧ. ទំនប់កំពីងពួយ (សម្រាប់ឆ្មាំទំនប់ ឬមន្ត្រី)"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>កំពុងបម្រើការងារ (Active)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 3: Education & Skills */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3">
                  ៣. កម្រិតសិក្សា និងជំនាញ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      កម្រិតសិក្សា / កម្រិតវប្បធម៌ *
                    </label>
                    <select
                      required
                      value={form.educationLevel}
                      onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {EDUCATION_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ជំនាញចម្បង (Skill) *
                    </label>
                    <select
                      required
                      value={form.skill}
                      onChange={(e) => setForm({ ...form, skill: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {STAFF_SKILLS.map((sk) => (
                        <option key={sk} value={sk}>
                          {sk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      មុខជំនាញលម្អិត / សញ្ញាបត្រ
                    </label>
                    <input
                      type="text"
                      value={form.majorDetail}
                      onChange={(e) => setForm({ ...form, majorDetail: e.target.value })}
                      placeholder="ឧ. វិស្វករធនធានទឹក និងហេដ្ឋារចនាសម្ព័ន្ធជនបទ"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      វគ្គបណ្ដុះបណ្ដាលបន្ថែម
                    </label>
                    <input
                      type="text"
                      value={form.trainingNotes}
                      onChange={(e) => setForm({ ...form, trainingNotes: e.target.value })}
                      placeholder="ឧ. GIS, AutoCAD, គ្រប់គ្រងគម្រោង"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      កំណត់សម្គាល់
                    </label>
                    <textarea
                      rows={2}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "កំពុងរក្សាទុក..." : editingId ? "រក្សាទុកការកែប្រែ" : "បន្ថែមមន្ត្រី"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ លេខទូរស័ព្ទ អត្តលេខ ជំនាញ..."
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          />

          {isAdmin && (
            <select
              value={filterProvinceId}
              onChange={(e) => setFilterProvinceId(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              <option value="">គ្រប់ខេត្ត-រាជធានី</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.khmerName || p.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterOffice}
            onChange={(e) => setFilterOffice(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">គ្រប់ការិយាល័យ</option>
            <option value="__LEADERSHIP__">ថ្នាក់ដឹកនាំមន្ទីរ</option>
            {STAFF_OFFICES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">គ្រប់តួនាទី</option>
            {STAFF_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterEducation}
            onChange={(e) => setFilterEducation(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">គ្រប់កម្រិតសិក្សា</option>
            {EDUCATION_LEVELS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">គ្រប់ជំនាញ</option>
            {STAFF_SKILLS.map((sk) => (
              <option key={sk} value={sk}>
                {sk}
              </option>
            ))}
          </select>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">គ្រប់ភេទ</option>
            {STAFF_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            សម្អាតតម្រង (Reset)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "list"
              ? "bg-cyan-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          បញ្ជីមន្ត្រី-បុគ្គលិក ({filteredStaff.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "stats"
              ? "bg-cyan-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          ស្ថិតិកម្រិតសិក្សា និងជំនាញ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("structure")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "structure"
              ? "bg-cyan-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          រចនាសម្ព័ន្ធតាមការិយាល័យ
        </button>
      </div>

      {/* TAB 1: Staff Table */}
      {activeTab === "list" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">ល.រ</th>
                  {isAdmin && <th className="px-4 py-3 text-left">ខេត្ត</th>}
                  <th className="px-4 py-3 text-left">គោត្តនាម និងនាម</th>
                  <th className="px-4 py-3 text-left">ភេទ</th>
                  <th className="px-4 py-3 text-left">តួនាទី</th>
                  <th className="px-4 py-3 text-left">ការិយាល័យ</th>
                  <th className="px-4 py-3 text-left">កម្រិតសិក្សា</th>
                  <th className="px-4 py-3 text-left">ជំនាញ</th>
                  <th className="px-4 py-3 text-left">ទូរស័ព្ទ</th>
                  <th className="px-4 py-3 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 10 : 9}
                      className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      មិនទាន់មានទិន្នន័យមន្ត្រី-បុគ្គលិកនៅឡើយទេ។ សូមចុច «បន្ថែមមន្ត្រី-បុគ្គលិក» ដើម្បីចាប់ផ្ដើម។
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {s.province?.khmerName || s.province?.name}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {s.fullName}
                        </div>
                        {s.latinName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {s.latinName}
                          </div>
                        )}
                        {!s.isActive && (
                          <span className="mt-0.5 inline-block rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            ឈប់ / ចូលនិវត្តន៍
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {s.gender}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-lg bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          {s.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {s.office || (
                          <span className="text-xs italic text-slate-400">ថ្នាក់ដឹកនាំមន្ទីរ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {s.educationLevel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {s.skill}
                        </div>
                        {s.majorDetail && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {s.majorDetail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {s.phoneNumber || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(s)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          កែប្រែ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="rounded-lg border border-rose-200 dark:border-rose-900/60 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          លុប
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Education & Skill Statistics */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Education Level Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                ស្ថិតិតាមកម្រិតសិក្សា (Education Level)
              </h3>
              <div className="space-y-3">
                {stats.byEducation.map((item) => {
                  const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-white">{item.count}</strong>{" "}
                          នាក់ (ស្រី {item.female}) • {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                ស្ថិតិតាមជំនាញ (Skills)
              </h3>
              <div className="space-y-3">
                {stats.bySkill.map((item) => {
                  const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-white">{item.count}</strong>{" "}
                          នាក់ (ស្រី {item.female}) • {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Position Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                ស្ថិតិតាមតួនាទី (Positions)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {stats.byPosition.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3"
                  >
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {item.count}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        (ស្រី {item.female})
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                ស្ថិតិតាមការិយាល័យ (Offices)
              </h3>
              <div className="space-y-3">
                {stats.byOffice.map((item) => {
                  const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-white">{item.count}</strong>{" "}
                          នាក់ (ស្រី {item.female})
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Admin Province Summary Table */}
          {isAdmin && stats.byProvince.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  សង្ខេបចំនួនមន្ត្រី-បុគ្គលិកតាមរាជធានី-ខេត្ត
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">ខេត្ត / រាជធានី</th>
                      <th className="px-4 py-3 text-right">សរុប</th>
                      <th className="px-4 py-3 text-right">ស្រី</th>
                      <th className="px-4 py-3 text-right">មន្ត្រីក្របខ័ណ្ឌ</th>
                      <th className="px-4 py-3 text-right">កិច្ចសន្យា & ឆ្មាំទំនប់</th>
                      <th className="px-4 py-3 text-right">បរិញ្ញាបត្រឡើង</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.byProvince.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold">{p.total}</td>
                        <td className="px-4 py-2.5 text-right">{p.female}</td>
                        <td className="px-4 py-2.5 text-right">{p.civilServants}</td>
                        <td className="px-4 py-2.5 text-right">{p.contractOrGuard}</td>
                        <td className="px-4 py-2.5 text-right text-cyan-600 dark:text-cyan-400 font-semibold">
                          {p.higherEd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Office Structure View */}
      {activeTab === "structure" && (
        <div className="space-y-6">
          {/* Department Leadership */}
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-50/50 to-white dark:from-slate-900 dark:to-cyan-950/20 p-5 shadow-2xs">
            <h3 className="text-base font-bold text-cyan-900 dark:text-cyan-300 mb-4">
              ថ្នាក់ដឹកនាំមន្ទីរ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStaff
                .filter(
                  (s) =>
                    !s.office ||
                    (DEPARTMENT_LEADERSHIP_POSITIONS as readonly string[]).includes(s.position)
                )
                .sort((a, b) => getPositionRank(a.position) - getPositionRank(b.position))
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{s.fullName}</p>
                        <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                          {s.position}
                        </p>
                      </div>
                      <span className="text-[11px] rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300">
                        {s.gender}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      {s.educationLevel} • {s.skill}
                    </p>
                    {isAdmin && s.province && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {s.province.khmerName || s.province.name}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* 5 Offices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {STAFF_OFFICES.map((officeName) => {
              const members = filteredStaff
                .filter((s) => s.office === officeName)
                .sort((a, b) => getPositionRank(a.position) - getPositionRank(b.position));
              return (
                <div
                  key={officeName}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {officeName}
                    </h4>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {members.length} នាក់
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">មិនទាន់មានបុគ្គលិកក្នុងការិយាល័យនេះ</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {m.fullName}
                            </span>
                            <span className="ml-2 text-cyan-600 dark:text-cyan-400 font-medium">
                              ({m.position})
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {m.educationLevel} • {m.skill}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500">{m.gender}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
