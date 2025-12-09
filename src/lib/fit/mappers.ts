// src/lib/fit/mappers.ts
import type { FitRow } from "./types";

function mapDifficulty(en?: string | null): FitRow["difficulty"] {
  const v = (en || "").toLowerCase();
  if (v.includes("begin")) return "beginner";
  if (v.includes("inter") || v.includes("medium")) return "intermediate";
  if (v.includes("adv")) return "advanced";
  return "";
}

// ניחוש קטגוריה לפי שרירים/שם
function inferCategoryFromMuscles(muscles: string[]): string {
  const s = muscles.map((m) => m.toLowerCase());
  if (s.some((m) => /(chest|pect|bench|push-up)/.test(m))) return "chest";
  if (s.some((m) => /(back|lats|latissimus|row)/.test(m))) return "back";
  if (s.some((m) => /(quad|hamstring|glute|leg|calf|thigh)/.test(m)))
    return "legs";
  if (s.some((m) => /(shoulder|deltoid|overhead|press)/.test(m)))
    return "shoulders";
  if (s.some((m) => /(bicep|tricep|arm|curl|extension)/.test(m))) return "arms";
  if (s.some((m) => /(abs|core|abdom|oblique|crunch|plank)/.test(m)))
    return "abs";
  if (s.some((m) => /(mobility|stretch)/.test(m))) return "mobility";
  if (s.some((m) => /(run|cardio|aerobic|jump rope|hiit)/.test(m)))
    return "cardio";
  return "other";
}

export function mapWgerExerciseToFitRow(x: any): FitRow {
  const id = String(x.id ?? x.uuid ?? Math.random());
  const name = x.name ?? x.name_translations?.en ?? "Unnamed";
  const desc = (x.description ?? "").replace(/<[^>]+>/g, " ").trim();

  const muscles: string[] = [
    ...((x.muscles ?? []).map((m: any) => m.name ?? m.name_en ?? "") || []),
    ...((x.muscles_secondary ?? []).map(
      (m: any) => m.name ?? m.name_en ?? "",
    ) || []),
  ].filter(Boolean);

  const equipment: string[] = (x.equipment ?? [])
    .map((e: any) => e.name ?? e.name_en ?? "")
    .filter(Boolean);

  const images: string[] = (x.images ?? [])
    .map((im: any) => im.image ?? im.image_main ?? "")
    .filter(Boolean);

  const category = x.category?.name ?? inferCategoryFromMuscles(muscles);
  const difficulty = mapDifficulty(x.level ?? x.difficulty ?? "");

  return {
    _id: id,
    name,
    description: desc,
    category: category?.toLowerCase?.().replace(/[^a-z_]/g, "") || "other",
    primaryMuscles: muscles,
    equipment,
    images,
    difficulty,
  };
}
