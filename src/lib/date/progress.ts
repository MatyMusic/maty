import type { DateProfileDoc } from "@/lib/db/date-repo";

export function calcProgress(p: Partial<DateProfileDoc> | null) {
  if (!p)
    return {
      percent: 0,
      missing: ["שם", "תאריך לידה", "עיר", "זרם", "רמת שבת", "רמת כשרות"],
    };
  const checks: [string, boolean][] = [
    ["שם", !!p.displayName],
    ["תאריך לידה", !!p.birthDate],
    ["מין", !!p.gender],
    ["מדינה", !!p.country],
    ["עיר", !!p.city],
    ["שפות", !!(p.languages && p.languages.length)],
    ["זרם", !!p.judaism_direction],
    ["כשרות", !!p.kashrut_level],
    ["שבת", !!p.shabbat_level],
    ["מטרה", !!p.goals],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  const total = checks.length;
  const percent = Math.round((done / total) * 100);
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  return { percent, missing };
}
