"use client";

export type ProfilePatch = Partial<{
  displayName: string | null;
  birthDate: string | null; // YYYY-MM-DD
  gender: "male" | "female" | "other" | null;
  country: string | null;
  city: string | null;
  languages: string[] | null;
  judaism_direction:
    | "orthodox"
    | "haredi"
    | "chasidic"
    | "modern"
    | "conservative"
    | "reform"
    | "reconstructionist"
    | "secular"
    | null;
  kashrut_level: "strict" | "partial" | "none" | null;
  shabbat_level: "strict" | "partial" | "none" | null;
  goals: "serious" | "marriage" | "friendship" | null;
  about_me: string | null;
  avatarUrl: string | null;
}>;

const LABEL: Record<keyof ProfilePatch, string> = {
  displayName: "שם תצוגה",
  birthDate: "תאריך לידה",
  gender: "מין",
  country: "מדינה",
  city: "עיר",
  languages: "שפות",
  judaism_direction: "זרם ביהדות",
  kashrut_level: "כשרות",
  shabbat_level: "שבת",
  goals: "מטרה",
  about_me: "על עצמי",
  avatarUrl: "תמונת פרופיל",
};

const ORDER: (keyof ProfilePatch)[] = [
  "displayName",
  "birthDate",
  "gender",
  "country",
  "city",
  "languages",
  "judaism_direction",
  "kashrut_level",
  "shabbat_level",
  "goals",
  "about_me",
  "avatarUrl",
];

// קריטריונים פשוטים ל"נוכחות" שדה
function present(key: keyof ProfilePatch, v: any): boolean {
  if (v == null) return false;
  if (key === "languages") return Array.isArray(v) && v.length > 0;
  if (key === "about_me") return typeof v === "string" && v.trim().length >= 20; // קצת תוכן
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

export function computeProfileProgress(p: ProfilePatch) {
  const total = ORDER.length;
  const filled: string[] = [];
  const missing: string[] = [];
  for (const k of ORDER) {
    if (present(k, (p as any)[k])) filled.push(k);
    else missing.push(LABEL[k]);
  }
  const percent = Math.round((filled.length / total) * 100);
  return { percent, missing, filledKeys: filled, total };
}
