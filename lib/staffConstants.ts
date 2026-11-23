export const STAFF_POSITIONS = [
  "ប្រធានមន្ទីរ",
  "អនុប្រធានក្ដាប់រួម",
  "អនុប្រធានមន្ទីរ",
  "ប្រធានការិយាល័យ",
  "អនុប្រធានការិយាល័យ",
  "មន្រ្តី",
  "បុគ្គលិកកិច្ចសន្យា",
  "ឆ្មាំទំនប់",
] as const;

export const DEPARTMENT_LEADERSHIP_POSITIONS = [
  "ប្រធានមន្ទីរ",
  "អនុប្រធានក្ដាប់រួម",
  "អនុប្រធានមន្ទីរ",
] as const;

export const STAFF_OFFICES = [
  "ការិយាល័យ គ្រប់គ្រង និងអភិរក្ស",
  "ការិយាល័យ រដ្ឋបាល និងបុគ្គលិក",
  "ការិយាល័យ ឧតុនិយម និងជលសាស្រ្ត",
  "ការិយាល័យ ធារាសាស្រ្តកសិកម្ម",
  "ការិយាល័យ ទឹកស្អាត និងអនាម័យ",
] as const;

export const EDUCATION_LEVELS = [
  "បណ្ឌិត (PhD)",
  "អនុបណ្ឌិត (Master)",
  "បរិញ្ញាបត្រ (Bachelor)",
  "បរិញ្ញាបត្ររង (Associate)",
  "មធ្យមសិក្សាទុតិយភូមិ (បាក់ឌុប)",
  "មធ្យមសិក្សាបឋមភូមិ (ឌីប្លូម)",
  "បឋមសិក្សា / ផ្សេងៗ",
] as const;

export const STAFF_SKILLS = [
  "វិស្វកម្មធារាសាស្ត្រ",
  "ជលសាស្ត្រ",
  "ឧតុនិយម",
  "សំណង់ស៊ីវិល",
  "ធារាសាស្ត្រកសិកម្ម / កសិកម្ម",
  "ទឹកស្អាត និងអនាម័យ",
  "គ្រប់គ្រងធនធានទឹក",
  "រដ្ឋបាលសាធារណៈ",
  "គណនេយ្យ និងហិរញ្ញវត្ថុ",
  "ព័ត៌មានវិទ្យា (IT / GIS)",
  "ច្បាប់",
  "បច្ចេកទេស / ជំនាញទូទៅ",
  "ផ្សេងៗ",
] as const;

export const CIVIL_SERVANT_RANKS = [
  "ក្របខ័ណ្ឌ ក",
  "ក្របខ័ណ្ឌ ខ",
  "ក្របខ័ណ្ឌ គ",
  "បុគ្គលិកកិច្ចសន្យា",
  "ឆ្មាំទំនប់ / កម្មករជំនាញ",
] as const;

export const STAFF_GENDERS = ["ប្រុស", "ស្រី"] as const;

export const EXPERIENCE_EMPLOYMENT_TYPES = [
  "ពេញម៉ោង / មន្ត្រីរាជការ",
  "បុគ្គលិកកិច្ចសន្យា",
  "ក្រៅម៉ោង",
  "ហាត់ការ (Internship)",
  "ស្ម័គ្រចិត្ត",
  "ផ្សេងៗ",
] as const;

export function getPositionRank(position: string): number {
  const idx = STAFF_POSITIONS.indexOf(position as (typeof STAFF_POSITIONS)[number]);
  return idx === -1 ? STAFF_POSITIONS.length : idx;
}

export function getHighestEducationLevel(levels: string[]): string | null {
  let bestIdx: number = EDUCATION_LEVELS.length;
  let bestLevel: string | null = null;
  for (const lvl of levels) {
    const idx = EDUCATION_LEVELS.indexOf(lvl as (typeof EDUCATION_LEVELS)[number]);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      bestLevel = lvl;
    }
  }
  return bestLevel;
}
