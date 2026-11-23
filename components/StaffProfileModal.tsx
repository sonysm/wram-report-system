import React from "react";

export interface StaffExperienceItem {
  id?: number;
  title: string;
  organization: string;
  location: string | null;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface StaffEducationItem {
  id?: number;
  level: string;
  school: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  gradeOrHonors: string | null;
  description: string | null;
}

export interface StaffTrainingItem {
  id?: number;
  name: string;
  issuingOrganization: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  durationOrHours: string | null;
  credentialId: string | null;
  description: string | null;
}

export interface StaffMemberProfile {
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
  experiences?: StaffExperienceItem[];
  educations?: StaffEducationItem[];
  trainings?: StaffTrainingItem[];
}

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

interface StaffProfileModalProps {
  member: StaffMemberProfile | null;
  onClose: () => void;
  onEdit: (member: StaffMemberProfile) => void;
}

export default function StaffProfileModal({
  member,
  onClose,
  onEdit,
}: StaffProfileModalProps) {
  if (!member) return null;

  const initials = member.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("");

  const experiences = member.experiences ?? [];
  const educations = member.educations ?? [];
  const trainings = member.trainings ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl my-8 overflow-hidden">
        {/* LinkedIn-style Banner Header */}
        <div className="relative h-24 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-lg bg-black/25 p-1.5 text-white hover:bg-black/40 transition"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Profile Identity */}
          <div className="-mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white dark:border-slate-900 bg-cyan-700 text-xl font-bold text-white shadow-md">
                {initials || "ម"}
              </div>
              <div className="pt-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {member.fullName}
                </h2>
                {member.latinName && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {member.latinName}
                  </p>
                )}
                <p className="mt-1 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                  {member.position} • {member.office || "ថ្នាក់ដឹកនាំមន្ទីរ"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(member);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition self-start sm:self-auto"
            >
              កែប្រែប្រវត្តិរូប
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">ខេត្ត / រាជធានី</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {member.province?.khmerName || member.province?.name || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">ភេទ / ក្របខ័ណ្ឌ</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {member.gender} {member.civilServantRank ? `• ${member.civilServantRank}` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">ទូរស័ព្ទ / អត្តលេខ</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {member.phoneNumber || "-"}
                {member.civilServantId ? ` (${member.civilServantId})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">ជំនាញចម្បង</span>
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                {member.skill}
              </span>
            </div>
          </div>

          {/* Experience Section (LinkedIn Style) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span>ប្រវត្តិការងារ (Work Experience)</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {experiences.length}
              </span>
            </h3>
            {experiences.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                មិនទាន់មានទិន្នន័យប្រវត្តិការងារពីមុននៅឡើយទេ។
              </p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div
                    key={exp.id ?? idx}
                    className="relative pl-4 border-l-2 border-cyan-500/40 space-y-0.5"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {exp.title}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {exp.organization}
                      {exp.employmentType ? ` • ${exp.employmentType}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDateDisplay(exp.startDate) || "មិនស្គាល់"} —{" "}
                      {exp.isCurrent
                        ? "បច្ចុប្បន្ន"
                        : formatDateDisplay(exp.endDate) || "មិនស្គាល់"}
                      {exp.location ? ` • ${exp.location}` : ""}
                    </p>
                    {exp.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Section (LinkedIn Style) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span>ប្រវត្តិការសិក្សា (Education)</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {educations.length || 1}
              </span>
            </h3>
            {educations.length === 0 ? (
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">{member.educationLevel}</span>
                {member.majorDetail ? ` — ${member.majorDetail}` : ""}
              </div>
            ) : (
              <div className="space-y-3">
                {educations.map((edu, idx) => (
                  <div
                    key={edu.id ?? idx}
                    className="relative pl-4 border-l-2 border-blue-500/40 space-y-0.5"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {edu.school}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {edu.level}
                      {edu.fieldOfStudy ? ` • ${edu.fieldOfStudy}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {edu.startYear || "?"} - {edu.endYear || "?"}
                      {edu.gradeOrHonors ? ` • និទ្ទេស៖ ${edu.gradeOrHonors}` : ""}
                    </p>
                    {edu.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Training & Certifications Section (LinkedIn Style) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span>វគ្គបណ្ដុះបណ្ដាល និងវិញ្ញាបនបត្រ (Training & Certifications)</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {trainings.length}
              </span>
            </h3>
            {trainings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {member.trainingNotes || "មិនទាន់មានទិន្នន័យវគ្គបណ្ដុះបណ្ដាលនៅឡើយទេ។"}
              </p>
            ) : (
              <div className="space-y-3">
                {trainings.map((tr, idx) => (
                  <div
                    key={tr.id ?? idx}
                    className="relative pl-4 border-l-2 border-emerald-500/40 space-y-0.5"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {tr.name}
                    </p>
                    {tr.issuingOrganization && (
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {tr.issuingOrganization}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tr.issueDate ? `កាលបរិច្ឆេទ៖ ${formatDateDisplay(tr.issueDate)}` : ""}
                      {tr.durationOrHours ? ` • រយៈពេល៖ ${tr.durationOrHours}` : ""}
                      {tr.credentialId ? ` • លេខវិញ្ញាបនបត្រ៖ ${tr.credentialId}` : ""}
                    </p>
                    {tr.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {tr.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
