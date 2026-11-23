export function parseOptionalDate(value: unknown): Date | null {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
}

export const STAFF_INCLUDE = {
  province: {
    select: { id: true, name: true, khmerName: true, sortOrder: true },
  },
  user: {
    select: { id: true, username: true },
  },
  experiences: {
    orderBy: [{ isCurrent: "desc" as const }, { startDate: "desc" as const }, { id: "asc" as const }],
  },
  educations: {
    orderBy: [{ endYear: "desc" as const }, { startYear: "desc" as const }, { id: "asc" as const }],
  },
  trainings: {
    orderBy: [{ issueDate: "desc" as const }, { id: "asc" as const }],
  },
};

export function sanitizeExperiences(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const title = cleanString(obj.title);
      const organization = cleanString(obj.organization);
      if (!title || !organization) return null;
      const isCurrent = Boolean(obj.isCurrent);
      return {
        title,
        organization,
        location: cleanString(obj.location),
        employmentType: cleanString(obj.employmentType),
        startDate: parseOptionalDate(obj.startDate),
        endDate: isCurrent ? null : parseOptionalDate(obj.endDate),
        isCurrent,
        description: cleanString(obj.description),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function sanitizeEducations(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const level = cleanString(obj.level);
      const school = cleanString(obj.school);
      if (!level || !school) return null;
      return {
        level,
        school,
        fieldOfStudy: cleanString(obj.fieldOfStudy),
        startYear: parseOptionalInt(obj.startYear),
        endYear: parseOptionalInt(obj.endYear),
        gradeOrHonors: cleanString(obj.gradeOrHonors),
        description: cleanString(obj.description),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function sanitizeTrainings(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const name = cleanString(obj.name);
      if (!name) return null;
      return {
        name,
        issuingOrganization: cleanString(obj.issuingOrganization),
        issueDate: parseOptionalDate(obj.issueDate),
        expirationDate: parseOptionalDate(obj.expirationDate),
        durationOrHours: cleanString(obj.durationOrHours),
        credentialId: cleanString(obj.credentialId),
        description: cleanString(obj.description),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
