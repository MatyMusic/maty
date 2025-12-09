// src/scripts/fit-import.ts
/* eslint-disable no-console */
import { connectMongo } from "@/lib/fit/db";
import FitExercise from "@/lib/fit/models/FitExercise";

type Difficulty = "" | "beginner" | "intermediate" | "advanced";
type MediaItem = {
  type: "image" | "gif" | "video" | "model3d";
  url: string;
  thumb?: string;
  title?: string;
  source?: string;
  width?: number;
  height?: number;
  durationSec?: number;
};

type Exercise = {
  providerId: string;
  provider: string;
  name: string;
  description?: string;
  category: string;
  primaryMuscles?: string[];
  equipment?: string[];
  difficulty?: Difficulty;
  media?: MediaItem[];
  sources?: string[];
  providerHint?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s?: string) => (s || "").normalize("NFKC").trim();
const lc = (s?: string) => (s || "").toLowerCase();

function inferCategory(muscles: string[], fallback?: string) {
  const s = muscles.map(lc);
  if (s.some((m) => /(chest|pect|push-up|bench|pec)/.test(m))) return "chest";
  if (s.some((m) => /(back|lats|row|latissimus)/.test(m))) return "back";
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
  return (fallback || "other").toLowerCase().replace(/[^a-z_]/g, "") || "other";
}
function mapDifficulty(v?: string | null): Difficulty {
  const t = lc(v);
  if (t.includes("begin")) return "beginner";
  if (t.includes("inter") || t.includes("medium")) return "intermediate";
  if (t.includes("adv") || t.includes("expert")) return "advanced";
  return "";
}

function keySlug(name: string, category: string) {
  const a = lc(norm(name)).replace(/\s+/g, " ").trim();
  const b = lc(norm(category)).trim();
  return `${a}|${b}`;
}

/** -------------------- Providers -------------------- */

// WGER: exerciseinfo (paged)
async function importWger(limit = 5000): Promise<Exercise[]> {
  const base = "https://wger.de/api/v2/exerciseinfo/";
  let items: Exercise[] = [];
  const pageSize = 100;
  for (let offset = 0; items.length < limit; offset += pageSize) {
    const u = new URL(base);
    u.searchParams.set("language", "2"); // en
    u.searchParams.set("status", "2");
    u.searchParams.set("limit", String(pageSize));
    u.searchParams.set("offset", String(offset));
    const res = await fetch(u.toString(), { cache: "no-store" });
    if (!res.ok) break;
    const j = await res.json();
    const rows = Array.isArray(j?.results) ? j.results : [];
    if (!rows.length) break;

    const mapped: Exercise[] = rows.map((x: any) => {
      const id = String(x.id ?? x.uuid ?? crypto.randomUUID());
      const name = x.name ?? x.name_translations?.en ?? "Unnamed";
      const desc = (x.description || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
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
      const media: MediaItem[] = images.map((url) => ({
        type: "image",
        url,
        source: "wger",
      }));

      return {
        providerId: `wger:${id}`,
        provider: "wger",
        name,
        description: desc,
        category: inferCategory(muscles, x.category?.name),
        primaryMuscles: muscles,
        equipment,
        difficulty: mapDifficulty(x.level ?? x.difficulty ?? ""),
        media,
        sources: ["wger"],
        providerHint: "wger",
      };
    });

    items = items.concat(mapped);
    if (rows.length < pageSize) break;
    await sleep(150); // להיות נחמדים
    if (items.length >= limit) break;
  }
  return items.slice(0, limit);
}

// ExerciseDB (RapidAPI) – מחזיר הכל במכה; נסנן לפי limit
async function importExerciseDB(limit = 5000): Promise<Exercise[]> {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";
  if (!key) return [];
  const u = `https://${host}/exercises`;
  const res = await fetch(u, {
    headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host } as any,
  });
  if (!res.ok) return [];
  const arr = (await res.json()) as any[];
  const out: Exercise[] = (arr || []).slice(0, limit).map((x) => {
    const muscles: string[] = [
      x?.target,
      ...(Array.isArray(x?.secondaryMuscles) ? x.secondaryMuscles : []),
    ].filter(Boolean);
    const steps: string[] = Array.isArray(x?.instructions)
      ? x.instructions
      : [];
    const gifs: string[] = x?.gifUrl ? [String(x.gifUrl)] : [];
    const media: MediaItem[] = gifs.map((url) => ({
      type: "gif",
      url,
      source: "exercisedb",
    }));
    return {
      providerId: `exdb:${String(x?.id ?? crypto.randomUUID())}`,
      provider: "exercisedb",
      name: x?.name || "Unnamed",
      description: steps.join(" ").trim() || "",
      category: inferCategory(muscles, x?.bodyPart),
      primaryMuscles: muscles,
      equipment: x?.equipment ? [String(x.equipment)] : [],
      difficulty: mapDifficulty(x?.difficulty),
      media,
      sources: ["exercisedb"],
      providerHint: "exercisedb",
    };
  });
  return out;
}

// API Ninjas – נמשוך לפי רשימת שרירים כדי להגיע לאלפים
const NINJAS_MUSCLES = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower_back",
  "middle_back",
  "neck",
  "quadriceps",
  "traps",
  "triceps",
];
async function importNinjas(limit = 4000): Promise<Exercise[]> {
  const key = process.env.API_NINJAS_KEY;
  if (!key) return [];
  let items: Exercise[] = [];
  for (const m of NINJAS_MUSCLES) {
    const u = new URL("https://api.api-ninjas.com/v1/exercises");
    u.searchParams.set("muscle", m);
    const res = await fetch(u.toString(), {
      headers: { "X-Api-Key": key } as any,
    });
    if (!res.ok) continue;
    const arr = (await res.json()) as any[];
    const mapped: Exercise[] = (arr || []).map((x) => ({
      providerId: `nin:${crypto.randomUUID()}`,
      provider: "api-ninjas",
      name: x?.name || "Unnamed",
      description: x?.instructions || "",
      category: inferCategory([x?.muscle].filter(Boolean) as string[], x?.type),
      primaryMuscles: [x?.muscle].filter(Boolean) as string[],
      equipment: x?.equipment ? [String(x.equipment)] : [],
      difficulty: mapDifficulty(x?.difficulty),
      media: [],
      sources: ["api-ninjas"],
      providerHint: "api-ninjas",
    }));
    items = items.concat(mapped);
    if (items.length >= limit) break;
    await sleep(200);
  }
  return items.slice(0, limit);
}

/** -------------------- Enrichment (optional) -------------------- */
async function enrichYouTubeTitle(q: string) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const u = new URL("https://www.googleapis.com/youtube/v3/search");
  u.searchParams.set("key", key);
  u.searchParams.set("part", "snippet");
  u.searchParams.set("maxResults", "1");
  u.searchParams.set("q", `${q} exercise tutorial`);
  u.searchParams.set("type", "video");
  try {
    const r = await fetch(u.toString());
    const j = await r.json();
    const v = j?.items?.[0];
    const vid = v?.id?.videoId;
    if (!vid) return null;
    return {
      type: "video" as const,
      url: `https://www.youtube.com/watch?v=${vid}`,
      thumb: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      source: "youtube",
      title: v?.snippet?.title,
    };
  } catch {
    return null;
  }
}

/** -------------------- Main -------------------- */
function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.split("=");
      return [k.replace(/^--/, ""), v ?? true];
    }),
  );
  const providers = String(args.providers ?? "wger,exercisedb")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    providers,
    limit: Number(args.limit ?? 5000),
    useNigunim: args.db === "nigunim",
    enrich: String(args.enrich ?? "false") === "true",
  };
}

(async () => {
  const { providers, limit, useNigunim, enrich } = parseArgs();

  await connectMongo({ useNigunim });
  console.log("✅ Mongo connected", useNigunim ? "(nigunim)" : "");

  // 1) משיכה מהספקים
  let pool: Exercise[] = [];
  if (providers.includes("wger")) {
    const w = await importWger(limit);
    console.log(`→ WGER: ${w.length}`);
    pool = pool.concat(w);
  }
  if (providers.includes("exercisedb")) {
    const e = await importExerciseDB(limit);
    console.log(`→ ExerciseDB: ${e.length}`);
    pool = pool.concat(e);
  }
  if (providers.includes("apininjas")) {
    const n = await importNinjas(limit);
    console.log(`→ API Ninjas: ${n.length}`);
    pool = pool.concat(n);
  }

  // 2) נרמול + דילול כפילויות לפי (nameLower|category)
  const map = new Map<string, Exercise>();
  for (const r of pool) {
    const slug = keySlug(r.name, r.category);
    const prev = map.get(slug);
    if (!prev) map.set(slug, r);
    else {
      map.set(slug, {
        ...prev,
        description: prev.description?.length
          ? prev.description
          : r.description,
        primaryMuscles: prev.primaryMuscles?.length
          ? prev.primaryMuscles
          : r.primaryMuscles,
        equipment: prev.equipment?.length ? prev.equipment : r.equipment,
        difficulty: prev.difficulty || r.difficulty,
        media: [...(prev.media || []), ...(r.media || [])].slice(0, 12),
        sources: Array.from(
          new Set([...(prev.sources || []), ...(r.sources || [])]),
        ),
        providerHint: prev.providerHint || r.providerHint,
      });
    }
  }
  let items = Array.from(map.values());

  // 3) העשרת YouTube (רק פריטים בלי מדיה)
  if (enrich) {
    console.log("🔎 Enriching YouTube (חלקי)...");
    const targets = items
      .filter((x) => !x.media || x.media.length === 0)
      .slice(0, 250);
    for (const t of targets) {
      const m = await enrichYouTubeTitle(t.name);
      if (m) t.media = [m];
      await sleep(60);
    }
  }

  // 4) כתיבה לבסיס
  const bulk = items.map((e) => {
    const slug = keySlug(e.name, e.category);
    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            slug,
            providerId: e.providerId,
            provider: e.provider,
            name: e.name,
            nameLower: lc(e.name),
            description: e.description || "",
            category: e.category,
            primaryMuscles: e.primaryMuscles || [],
            equipment: e.equipment || [],
            difficulty: e.difficulty || "",
            media: e.media || [],
            sources: e.sources || [],
            providerHint: e.providerHint || e.provider,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    };
  });

  if (!bulk.length) {
    console.log("⚠️ No items to import.");
    process.exit(0);
  }

  // ליצור אינדקסים לפני בלוק גדול
  await FitExercise.syncIndexes();
  const res = await FitExercise.bulkWrite(bulk, { ordered: false });
  console.log("✅ Import done:", {
    upserts: res.upsertedCount,
    modified: res.modifiedCount,
    matched: res.matchedCount,
  });

  process.exit(0);
})().catch((err) => {
  console.error("❌ fit-import failed:", err);
  process.exit(1);
});
