/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/scripts/import-exercises.ts
import "dotenv/config";
import { connectMongo } from "@/lib/fit/db";
import { ExerciseModel, type ExerciseDoc } from "@/lib/fit/models/Exercise";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// -------- CLI --------
const argv = await yargs(hideBin(process.argv))
  .option("db", {
    type: "string",
    choices: ["music", "nigunim"],
    desc: "בחר DB מוכן מה-env",
  })
  .option("dbUri", { type: "string", desc: "URI מלא ידני (מעלים על הכל)" })
  .option("providers", {
    type: "string",
    default: "wger,exercisedb,apininjas",
    desc: "רשימת ספקים עם פסיקים",
  })
  .option("limit", {
    type: "number",
    default: 3000,
    desc: "מקס׳ רשומות לייבוא",
  })
  .option("enrich", {
    type: "boolean",
    default: true,
    desc: "להעשיר (YouTube/GIPHY/Photos) במידת האפשר",
  })
  .help()
  .parse();

if (argv.db) {
  process.env.IMPORT_DB = argv.db === "nigunim" ? "nigunim" : "music";
}

// ----------------- Utils -----------------
const norm = (s?: string | null) => (s || "").normalize("NFKC").trim();
const lc = (s?: string | null) => norm(s).toLowerCase();
const stripHtml = (html?: string) =>
  (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type Difficulty = "" | "beginner" | "intermediate" | "advanced";
function mapDifficulty(v?: string | null): Difficulty {
  const t = lc(v);
  if (t.includes("begin")) return "beginner";
  if (t.includes("inter") || t.includes("medium")) return "intermediate";
  if (t.includes("adv") || t.includes("expert")) return "advanced";
  return "";
}
function inferCategory(muscles: string[], fallback?: string) {
  const s = muscles.map((m) => lc(m));
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

type ExerciseIn = {
  name: string;
  description?: string;
  category: string;
  primaryMuscles: string[];
  equipment: string[];
  difficulty: Difficulty;
  media: MediaItem[];
  sources: string[];
  providerHint?: string;
  altIds?: string[];
};

// חתימת ייחוד (מונעת כפילויות בין ספקים)
function makeSignature(name: string, category: string) {
  return `${lc(name)}|${lc(category)}`;
}

// ----------------- Fetch helpers -----------------
async function fetchJSON<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 12000,
): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal } as any);
    clearTimeout(id);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
}

// WGER (Exercise Info)
async function importFromWGER(limitMax: number): Promise<ExerciseIn[]> {
  const out: ExerciseIn[] = [];
  let offset = 0;
  const pageSize = 100;
  while (out.length < limitMax) {
    const u = new URL("https://wger.de/api/v2/exerciseinfo/");
    u.searchParams.set("language", "2");
    u.searchParams.set("status", "2");
    u.searchParams.set("limit", String(pageSize));
    u.searchParams.set("offset", String(offset));
    const j = await fetchJSON<any>(u.toString());
    const rows = Array.isArray(j?.results) ? j.results : [];
    for (const x of rows) {
      const id = String(x.id ?? x.uuid ?? "");
      const name = x.name ?? x.name_translations?.en ?? "Unnamed";
      const desc = stripHtml(x.description);
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
      out.push({
        name,
        description: desc,
        category: inferCategory(muscles, x.category?.name),
        primaryMuscles: muscles,
        equipment,
        difficulty: mapDifficulty(x.level ?? x.difficulty ?? ""),
        media,
        sources: ["wger"],
        providerHint: "wger",
        altIds: id ? [`wger:${id}`] : [],
      });
      if (out.length >= limitMax) break;
    }
    offset += pageSize;
    if (!j?.next) break;
  }
  return out;
}

// ExerciseDB (RapidAPI) – דורש RAPIDAPI_KEY
async function importFromExerciseDB(limitMax: number): Promise<ExerciseIn[]> {
  const key = process.env.RAPIDAPI_KEY || "";
  if (!key) return [];
  const host = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";
  const u = new URL(`https://${host}/exercises`);
  const arr = await fetchJSON<any[]>(u.toString(), {
    headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
  });
  const out: ExerciseIn[] = [];
  for (const x of arr.slice(0, limitMax)) {
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
    out.push({
      name: x?.name || "Unnamed",
      description: steps.join(" ").trim() || "",
      category: inferCategory(muscles, x?.bodyPart),
      primaryMuscles: muscles,
      equipment: x?.equipment ? [String(x.equipment)] : [],
      difficulty: mapDifficulty(x?.difficulty),
      media,
      sources: ["exercisedb"],
      providerHint: "exercisedb",
      altIds: x?.id ? [`exdb:${x.id}`] : [],
    });
  }
  return out;
}

// API Ninjas – לולאה על שרירים ידועים
async function importFromNinjas(limitMax: number): Promise<ExerciseIn[]> {
  const key = process.env.API_NINJAS_KEY || "";
  if (!key) return [];
  const MUSCLES = [
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
    "shoulders",
    "traps",
    "triceps",
  ];
  const out: ExerciseIn[] = [];
  for (const m of MUSCLES) {
    if (out.length >= limitMax) break;
    const u = new URL("https://api.api-ninjas.com/v1/exercises");
    u.searchParams.set("muscle", m);
    const arr = await fetchJSON<any[]>(u.toString(), {
      headers: { "X-Api-Key": key },
    });
    for (const x of arr) {
      const muscles: string[] = [x?.muscle].filter(Boolean);
      out.push({
        name: x?.name || "Unnamed",
        description: x?.instructions || "",
        category: inferCategory(muscles, x?.type),
        primaryMuscles: muscles,
        equipment: x?.equipment ? [String(x.equipment)] : [],
        difficulty: mapDifficulty(x?.difficulty),
        media: [],
        sources: ["api-ninjas"],
        providerHint: "api-ninjas",
        altIds: [],
      });
      if (out.length >= limitMax) break;
    }
  }
  return out;
}

// דמו (למקרה שאין מפתחות בכלל)
function demoSeed(): ExerciseIn[] {
  return [
    {
      name: "Push-Up",
      description: "Classic push-up.",
      category: "chest",
      primaryMuscles: ["chest", "triceps", "front-delts", "core"],
      equipment: [],
      difficulty: "beginner",
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642",
          source: "demo",
        },
      ],
      sources: ["demo"],
      providerHint: "demo",
      altIds: ["demo:pushup"],
    },
    {
      name: "Bodyweight Squat",
      description: "Sit back, chest up.",
      category: "legs",
      primaryMuscles: ["quads", "glutes", "hamstrings"],
      equipment: [],
      difficulty: "beginner",
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1518611012118-696072aa579a",
          source: "demo",
        },
      ],
      sources: ["demo"],
      providerHint: "demo",
      altIds: ["demo:squat"],
    },
    {
      name: "Plank",
      description: "Brace the core.",
      category: "abs",
      primaryMuscles: ["abs", "core"],
      equipment: [],
      difficulty: "intermediate",
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
          source: "demo",
        },
      ],
      sources: ["demo"],
      providerHint: "demo",
      altIds: ["demo:plank"],
    },
  ];
}

// ----------------- Enrichment (קליל) -----------------
async function enrichYouTube(name: string): Promise<MediaItem[]> {
  const key = process.env.YOUTUBE_API_KEY || "";
  if (!key) return [];
  const u = new URL("https://www.googleapis.com/youtube/v3/search");
  u.searchParams.set("key", key);
  u.searchParams.set("part", "snippet");
  u.searchParams.set("maxResults", "1");
  u.searchParams.set("q", `${name} exercise tutorial`);
  u.searchParams.set("type", "video");
  try {
    const j = await fetchJSON<any>(u.toString());
    const v = j.items?.[0];
    const vid = v?.id?.videoId;
    if (!vid) return [];
    return [
      {
        type: "video",
        url: `https://www.youtube.com/watch?v=${vid}`,
        thumb: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        source: "youtube",
        title: v.snippet?.title,
      },
    ];
  } catch {
    return [];
  }
}

async function enrichGiphy(name: string): Promise<MediaItem[]> {
  const key = process.env.GIPHY_API_KEY || "";
  if (!key) return [];
  const u = new URL("https://api.giphy.com/v1/gifs/search");
  u.searchParams.set("api_key", key);
  u.searchParams.set("q", name);
  u.searchParams.set("limit", "1");
  try {
    const j = await fetchJSON<any>(u.toString());
    return (j.data || []).slice(0, 1).map((g: any) => ({
      type: "gif",
      url: g.images?.original?.url || g.url,
      source: "giphy",
    }));
  } catch {
    return [];
  }
}

// ----------------- Merge & Upsert -----------------
function mergePools(pools: ExerciseIn[]) {
  const map = new Map<string, ExerciseIn>();
  for (const r of pools) {
    const sig = makeSignature(r.name, r.category);
    const prev = map.get(sig);
    if (!prev) map.set(sig, r);
    else {
      map.set(sig, {
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
        altIds: Array.from(
          new Set([...(prev.altIds || []), ...(r.altIds || [])]),
        ),
      });
    }
  }
  return Array.from(map.values());
}

async function upsertMany(items: ExerciseIn[], enrich = true) {
  let inserted = 0,
    updated = 0,
    skipped = 0;
  for (const chunk of chunks(items, 100)) {
    await Promise.all(
      chunk.map(async (e) => {
        // enrich עדין
        if (enrich && (!e.media || e.media.length === 0)) {
          const [yt, gif] = await Promise.all([
            enrichYouTube(e.name),
            enrichGiphy(e.name),
          ]);
          e.media = [...(e.media || []), ...yt, ...gif].slice(0, 6);
          e.sources = Array.from(
            new Set([
              ...(e.sources || []),
              ...[...yt, ...gif].map((m) => m.source || "").filter(Boolean),
            ]),
          );
        }
        const signature = makeSignature(e.name, e.category);
        const doc: Partial<ExerciseDoc> = {
          signature,
          name: e.name,
          name_lc: lc(e.name),
          description: e.description,
          category: e.category,
          primaryMuscles: e.primaryMuscles,
          equipment: e.equipment,
          difficulty: e.difficulty,
          media: e.media,
          sources: e.sources,
          providerHint: e.providerHint,
          altIds: e.altIds || [],
        };
        const res = await ExerciseModel.updateOne(
          { signature },
          { $set: doc, $addToSet: { altIds: { $each: doc.altIds || [] } } },
          { upsert: true },
        );
        if (res.upsertedId as any) inserted++;
        else if (res.modifiedCount) updated++;
        else skipped++;
      }),
    );
    process.stdout.write(".");
  }
  console.log(
    `\n✅ upsert done. inserted=${inserted}, updated=${updated}, skipped=${skipped}`,
  );
}

function* chunks<T>(arr: T[], size: number) {
  for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size);
}

// ----------------- MAIN -----------------
(async () => {
  await connectMongo({ uri: argv.dbUri || undefined });
  console.log("Mongo connected");

  const want = argv.providers.split(",").map((s) => s.trim().toLowerCase());
  const limit = Math.max(100, Math.min(argv.limit || 3000, 10000));

  const pools: ExerciseIn[] = [];

  if (want.includes("wger")) {
    console.log("↻ WGER…");
    pools.push(...(await importFromWGER(limit)));
  }
  if (want.includes("exercisedb")) {
    console.log("↻ ExerciseDB…");
    pools.push(...(await importFromExerciseDB(limit)));
  }
  if (
    want.includes("apininjas") ||
    want.includes("ninjas") ||
    want.includes("api-ninjas")
  ) {
    console.log("↻ API Ninjas…");
    pools.push(...(await importFromNinjas(limit)));
  }
  if (pools.length === 0) {
    console.log("⚠️ No providers with keys—seeding DEMO only");
    pools.push(...demoSeed());
  }

  const merged = mergePools(pools);
  console.log(`Merged unique: ${merged.length}`);

  await ExerciseModel.syncIndexes();
  await upsertMany(merged, !!argv.enrich);

  console.log("Done.");
  process.exit(0);
})();
