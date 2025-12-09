// src/lib/fit/util.ts
import type { FitEquipment, FitLevel, FitMuscle } from "@/types/fit";

/**
 * slugify – מחרוזת לקריאה ל-ids ו-slugs
 */
export function slugify(input: string): string {
  const base = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "item";
}

/**
 * fetchJson – wrapper קטן ל-fetch שמחזיר JSON.
 */
export async function fetchJson<T = any>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `fetchJson failed ${res.status} ${res.statusText} – ${txt.slice(0, 200)}`,
    );
  }

  return (await res.json()) as T;
}

/**
 * מיפוי שרירים לשמות בעברית
 */
export function mapMuscle(src: string): FitMuscle {
  const s = src.toLowerCase();

  if (s.includes("chest") || s.includes("pector")) return "חזה";
  if (s.includes("back") || s.includes("lats")) return "גב";
  if (s.includes("shoulder") || s.includes("deltoid")) return "כתפיים";
  if (s.includes("quad")) return "ירך קדמית";
  if (s.includes("hamstring")) return "ירך אחורית";
  if (s.includes("glute")) return "ישבן";
  if (s.includes("calf")) return "שוקיים";
  if (s.includes("bicep")) return "יד קדמית";
  if (s.includes("tricep")) return "יד אחורית";
  if (s.includes("forearm")) return "אמות";
  if (s.includes("ab") || s.includes("core")) return "בטן";
  if (s.includes("cardio") || s.includes("aerobic")) return "לב/ריאה";
  if (s.includes("leg")) return "רגליים";

  return "כללי";
}

/**
 * מיפוי ציוד – שמות אנגליים -> enums שלך
 */
export function mapEquipment(src: string): FitEquipment {
  const s = src.toLowerCase();

  if (s.includes("dumbbell")) return "דאמבלים";
  if (s.includes("barbell")) return "מוט";
  if (s.includes("machine")) return "מכונה";
  if (s.includes("cable")) return "כבלים";
  if (s.includes("body") || s.includes("weight")) return "משקל גוף";
  if (s.includes("kettlebell")) return "קטלבל";
  if (s.includes("band")) return "אלסטיות";
  if (s.includes("bench")) return "ספסל";
  if (s.includes("trx")) return "TRX";

  if (s.trim() === "" || s.includes("none")) return "ללא";
  return "אחר";
}

/**
 * מיפוי רמת קושי
 */
export function mapLevel(src: string): FitLevel {
  const s = src.toLowerCase();
  if (s.includes("beginner") || s.includes("easy") || s.includes("novice"))
    return "קל";
  if (s.includes("intermediate") || s.includes("medium")) return "בינוני";
  if (s.includes("advanced") || s.includes("hard")) return "מתקדם";
  return "כללי";
}
