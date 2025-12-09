import type { ExerciseItem } from "@/types/fit";
import {
  fetchJson,
  mapEquipment,
  mapLevel,
  mapMuscle,
  slugify,
} from "@/lib/fit/util";

const KEY = process.env.API_NINJAS_KEY || "";

export async function ninjasList(
  q = "",
  muscle = "",
  difficulty = "",
): Promise<ExerciseItem[]> {
  if (!KEY) return [];
  const sp = new URLSearchParams();
  if (q) sp.set("name", q);
  if (muscle) sp.set("muscle", muscle);
  if (difficulty) sp.set("difficulty", difficulty);
  const url = `https://api.api-ninjas.com/v1/exercises?${sp.toString()}`;

  const data: any[] = await fetchJson(url, { headers: { "X-Api-Key": KEY } });
  return data.map((r) => ({
    id: `nin:${slugify(r.name)}-${slugify(r.muscle || "")}`,
    provider: "apininjas",
    name: r.name || "Exercise",
    slug: slugify(r.name || ""),
    muscle: mapMuscle(String(r.muscle || "")),
    equipment: mapEquipment(String(r.equipment || "")),
    level: mapLevel(String(r.difficulty || "")) || "כללי",
    instructions: String(r.instructions || ""),
    images: [],
  }));
}

export async function ninjasGet(
  globalId: string,
): Promise<ExerciseItem | null> {
  // API Ninjas לא תומך ב-get לפי ID; נחפש לפי שם בסיסי (פחות מדויק)
  if (!KEY) return null;
  const namePart = globalId.split(":").pop()?.split("-")[0] || "";
  const url = `https://api.api-ninjas.com/v1/exercises?name=${encodeURIComponent(namePart)}`;
  const data: any[] = await fetchJson(url, { headers: { "X-Api-Key": KEY } });
  const r = data[0];
  if (!r) return null;
  return {
    id: `nin:${slugify(r.name)}-${slugify(r.muscle || "")}`,
    provider: "apininjas",
    name: r.name || "Exercise",
    slug: slugify(r.name || ""),
    muscle: mapMuscle(String(r.muscle || "")),
    equipment: mapEquipment(String(r.equipment || "")),
    level: mapLevel(String(r.difficulty || "")) || "כללי",
    instructions: String(r.instructions || ""),
    images: [],
  };
}
