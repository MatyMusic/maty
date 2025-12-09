import type { ExerciseItem } from "@/types/fit";
import { fetchJson, mapEquipment, mapMuscle, slugify } from "@/lib/fit/util";

const HOST = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";
const KEY = process.env.RAPIDAPI_KEY || "";

export async function exerciseDbList(limit = 1000): Promise<ExerciseItem[]> {
  if (!KEY) return [];
  const url = `https://${HOST}/exercises?limit=${limit}`;
  const data = await fetchJson(url, {
    headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": KEY },
  });
  const arr: any[] = Array.isArray(data) ? data : data.results || [];
  return arr.map((r) => ({
    id: `exdb:${r.id}`,
    provider: "exercisedb",
    name: r.name || "Exercise",
    slug: slugify(r.name || String(r.id)),
    muscle: mapMuscle(String(r.target || r.bodyPart || "")),
    equipment: mapEquipment(String(r.equipment || "")),
    level: "כללי",
    instructions: Array.isArray(r.instructions)
      ? r.instructions.join(" ")
      : String(r.instructions || ""),
    images: [r.gifUrl || r.image || ""].filter(Boolean),
    videoUrl: r.videoUrl || undefined,
  }));
}

export async function exerciseDbGet(
  globalId: string,
): Promise<ExerciseItem | null> {
  if (!KEY) return null;
  const rid = globalId.split(":").pop();
  if (!rid) return null;
  const url = `https://${HOST}/exercises/exercise/${rid}`;
  const r = await fetchJson(url, {
    headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": KEY },
  });
  return {
    id: `exdb:${r.id}`,
    provider: "exercisedb",
    name: r.name || "Exercise",
    slug: slugify(r.name || String(r.id)),
    muscle: mapMuscle(String(r.target || r.bodyPart || "")),
    equipment: mapEquipment(String(r.equipment || "")),
    level: "כללי",
    instructions: Array.isArray(r.instructions)
      ? r.instructions.join(" ")
      : String(r.instructions || ""),
    images: [r.gifUrl || r.image || ""].filter(Boolean),
    videoUrl: r.videoUrl || undefined,
  };
}
