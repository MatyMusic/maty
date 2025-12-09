import type { ExerciseItem, ExerciseQuery } from "@/types/fit";
import { cacheGet, cacheSet } from "@/lib/fit/cache";
import { slugify } from "@/lib/fit/util";
import { demoList, demoGet } from "@/lib/fit/providers/demo";
import { wgerList, wgerGet } from "@/lib/fit/providers/wger";
import { exerciseDbList, exerciseDbGet } from "@/lib/fit/providers/exerciseDb";
import { ninjasList, ninjasGet } from "@/lib/fit/providers/apininjas";

export const PROVIDERS = ["wger", "exercisedb", "apininjas", "demo"] as const;

function dedupe(items: ExerciseItem[]): ExerciseItem[] {
  const seen = new Map<string, ExerciseItem>();
  for (const it of items) {
    const key = slugify(
      `${it.name}-${it.muscle}-${(it.equipment || []).join("-")}`,
    );
    if (!seen.has(key)) seen.set(key, it);
  }
  return [...seen.values()];
}

export async function listProviders() {
  return PROVIDERS;
}

export async function aggregateList(
  q: ExerciseQuery,
): Promise<{ items: ExerciseItem[]; total: number }> {
  const page = Math.max(1, q.page || 1);
  const pageSize = Math.min(60, Math.max(12, q.pageSize || 24));
  const prov = (
    q.providers?.length ? q.providers : PROVIDERS
  ) as ReadonlyArray<string>;
  const key = `agg:${JSON.stringify({ ...q, page, pageSize, prov })}`;
  const cached = cacheGet<{ items: ExerciseItem[]; total: number }>(key);
  if (cached) return cached;

  const batches: ExerciseItem[][] = await Promise.all(
    prov.map(async (p) => {
      try {
        if (p === "demo") return await demoList();
        if (p === "wger") return await wgerList();
        if (p === "exercisedb") return await exerciseDbList(1200);
        if (p === "apininjas")
          return await ninjasList(
            q.q || "",
            q.muscle || "",
            (q.level || "").toString(),
          );
        return [];
      } catch {
        return [];
      }
    }),
  );

  let items = dedupe(batches.flat());

  // filter client-side (אחרי איגום)
  if (q.q) {
    const s = q.q.toLowerCase();
    items = items.filter((x) =>
      [x.name, x.instructions || ""].join(" ").toLowerCase().includes(s),
    );
  }
  if (q.muscle) items = items.filter((x) => x.muscle === q.muscle);
  if (q.level) items = items.filter((x) => x.level === q.level);
  if (q.equipment)
    items = items.filter((x) => (x.equipment || []).includes(q.equipment!));

  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = items.slice(start, end);

  const out = { items: pageItems, total };
  cacheSet(key, out, 1000 * 60 * 5); // 5 דקות
  return out;
}

export async function aggregateGet(
  globalId: string,
): Promise<ExerciseItem | null> {
  const [provider] = globalId.split(":");
  try {
    if (provider === "demo") return await demoGet(globalId);
    if (provider === "wger") return await wgerGet(globalId);
    if (provider === "exercisedb") return await exerciseDbGet(globalId);
    if (provider === "apininjas") return await ninjasGet(globalId);
  } catch {
    /* ignore */
  }
  return null;
}
