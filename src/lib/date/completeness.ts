// src/lib/date/completeness.ts
export type ProfileLike = {
  displayName?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  gender?: "male" | "female" | "other" | null;
  country?: string | null;
  city?: string | null;
  languages?: string[];
  judaism_direction?:
    | "orthodox"
    | "haredi"
    | "chasidic"
    | "modern"
    | "conservative"
    | "reform"
    | "reconstructionist"
    | "secular"
    | null;
  kashrut_level?: "strict" | "partial" | "none" | null;
  shabbat_level?: "strict" | "partial" | "none" | null;
  goals?: "serious" | "marriage" | "friendship" | null;
  about_me?: string | null;
};

export function computeProfileCompleteness(p: ProfileLike) {
  const checks: Array<[keyof ProfileLike, boolean, string, number]> = [
    ["displayName", !!p.displayName?.trim(), "שם", 8],
    [
      "birthDate",
      !!p.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(p.birthDate),
      "תאריך לידה",
      10,
    ],
    ["gender", !!p.gender, "מין", 6],
    ["country", !!p.country?.trim(), "מדינה", 6],
    ["city", !!p.city?.trim(), "עיר", 6],
    [
      "languages",
      Array.isArray(p.languages) && p.languages.length > 0,
      "שפות",
      8,
    ],
    ["judaism_direction", !!p.judaism_direction, "זרם ביהדות", 14],
    ["kashrut_level", !!p.kashrut_level, "רמת כשרות", 10],
    ["shabbat_level", !!p.shabbat_level, "שמירת שבת", 10],
    ["goals", !!p.goals, "מטרה", 12],
  ];

  let score = 0;
  const missingLabels: string[] = [];
  for (const [_, ok, label, weight] of checks) {
    if (ok) score += weight;
    else missingLabels.push(label);
  }

  // בונוס קטן על "על עצמי" (לא חובה)
  if ((p.about_me || "").trim().length >= 40) score += 10;

  const percent = Math.max(0, Math.min(100, Math.round(score)));
  return { percent, missingLabels };
}
