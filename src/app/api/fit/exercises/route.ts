/* eslint-disable @typescript-eslint/no-explicit-any */
import { Db, MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========================== Types ========================== */

type Difficulty = "" | "beginner" | "intermediate" | "advanced";
type MediaType = "image" | "gif" | "video" | "model3d";

type MediaItem = {
  type: MediaType;
  url: string;
  thumb?: string;
  title?: string;
  source?: string;
  width?: number;
  height?: number;
  durationSec?: number;
};

type Exercise = {
  _id: string; // provider-prefixed
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

type FitQuery = {
  q?: string;
  category?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: Difficulty;
  page: number;
  limit: number;
  sort?: "relevance" | "name_asc" | "name_desc" | "difficulty" | "media_rich";
  providers: string[];
  enrich?: boolean;
  includeRaw?: boolean;
};

type Paged<T> = {
  ok: boolean;
  items: T[];
  total: number;
  page: number;
  pages: number;
  facets?: Record<string, Record<string, number>>;
  note?: string;
  error?: string;
};

/* ========================== Env ========================== */

const EXDB_HOST = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const API_NINJAS_KEY = process.env.API_NINJAS_KEY || "";

const YT_KEY = process.env.YOUTUBE_API_KEY || "";
const GIPHY_KEY = process.env.GIPHY_API_KEY || "";
const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
const UNSPLASH_KEY = process.env.UNSPLASH_KEY || "";

// Mongo
const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "maty-music";
const FIT_COLLECTION = process.env.FIT_DB_COLLECTION || "fit_exercises";
const FIT_SOURCE_DEFAULT = (process.env.FIT_SOURCE || "mongo") as
  | "mongo"
  | "live"
  | "hybrid";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 96;
const MIN_LIMIT = 6;

const WGER_INFO = "https://wger.de/api/v2/exerciseinfo/";

/* ========================== Utils ========================== */

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const toInt = (v: string | null, d = 0) => (v ? (isNaN(+v) ? d : +v) : d);
const norm = (s?: string | null) => (s || "").normalize("NFKC").trim();
const lc = (s?: string) => (s || "").toLowerCase();
const stripHtml = (html?: string) =>
  (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function includesAny(hay: string, needles: string[]) {
  const h = hay.toLowerCase();
  return needles.some((x) => h.includes(x.toLowerCase()));
}

function mapDifficulty(v?: string | null): Difficulty {
  const t = lc(v);
  if (t.includes("begin")) return "beginner";
  if (t.includes("inter") || t.includes("medium")) return "intermediate";
  if (t.includes("adv") || t.includes("expert")) return "advanced";
  return "";
}

function inferCategory(muscles: string[], fallback?: string): string {
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

/* ========================== fetchJSON ========================== */

async function fetchJSON<T>(
  url: string,
  init: RequestInit = {},
  {
    timeoutMs = 8000,
    retries = 1,
  }: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (e) {
      clearTimeout(id);
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 200 + attempt * 200));
    }
  }
  throw new Error("unreachable");
}

/* ========================== Providers: Live ========================== */

async function wger_list(q: Partial<FitQuery>): Promise<Exercise[]> {
  const u = new URL(WGER_INFO);
  if (q.q) u.searchParams.set("name", q.q);
  u.searchParams.set("language", "2");
  u.searchParams.set("status", "2");
  u.searchParams.set("limit", String(Math.min(q.limit || DEFAULT_LIMIT, 100)));
  u.searchParams.set(
    "offset",
    String(((q.page || 1) - 1) * (q.limit || DEFAULT_LIMIT)),
  );

  const j = await fetchJSON<any>(u.toString(), {
    next: { revalidate: 300 },
  });
  const rows = Array.isArray(j?.results) ? j.results : [];

  return rows.map((x: any): Exercise => {
    const id = String(x.id ?? x.uuid ?? crypto.randomUUID());
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

    return {
      _id: `wger:${id}`,
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
}

async function exercisedb_list(q: Partial<FitQuery>): Promise<Exercise[]> {
  if (!RAPIDAPI_KEY) return [];
  const u = new URL(`https://${EXDB_HOST}/exercises`);
  if (q.q) u.searchParams.set("name", q.q);
  if (q.category) u.searchParams.set("bodyPart", q.category);
  if (q.muscle) u.searchParams.set("target", q.muscle);
  if (q.equipment) u.searchParams.set("equipment", q.equipment);

  const arr = await fetchJSON<any[]>(u.toString(), {
    headers: {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": EXDB_HOST,
    },
    next: { revalidate: 300 },
  });

  const page = q.page || 1;
  const limit = q.limit || DEFAULT_LIMIT;
  const start = (page - 1) * limit;

  return (arr || []).slice(start, start + limit).map((x: any): Exercise => {
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
      _id: `exdb:${String(x?.id ?? crypto.randomUUID())}`,
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
}

async function ninjas_list(q: Partial<FitQuery>): Promise<Exercise[]> {
  if (!API_NINJAS_KEY) return [];
  const u = new URL("https://api.api-ninjas.com/v1/exercises");
  if (q.muscle) u.searchParams.set("muscle", q.muscle);
  else if (q.q) u.searchParams.set("name", q.q);
  else if (q.category) u.searchParams.set("type", q.category);

  const arr = await fetchJSON<any[]>(u.toString(), {
    headers: { "X-Api-Key": API_NINJAS_KEY },
    next: { revalidate: 300 },
  });

  const page = q.page || 1;
  const limit = q.limit || DEFAULT_LIMIT;
  const start = (page - 1) * limit;

  return (arr || []).slice(start, start + limit).map((x) => {
    const muscles: string[] = [x?.muscle].filter(Boolean);
    return {
      _id: `nin:${crypto.randomUUID()}`,
      name: x?.name || "Unnamed",
      description: x?.instructions || "",
      category: inferCategory(muscles, x?.type),
      primaryMuscles: muscles,
      equipment: x?.equipment ? [String(x.equipment)] : [],
      difficulty: mapDifficulty(x?.difficulty),
      media: [],
      sources: ["api-ninjas"],
      providerHint: "api-ninjas",
    } as Exercise;
  });
}

/* ========================== Enrichment ========================== */

async function enrich_giphy(name: string): Promise<MediaItem[]> {
  if (!GIPHY_KEY) return [];
  try {
    const u = new URL("https://api.giphy.com/v1/gifs/search");
    u.searchParams.set("api_key", GIPHY_KEY);
    u.searchParams.set("q", name);
    u.searchParams.set("limit", "2");
    u.searchParams.set("rating", "g");

    const j = await fetchJSON<any>(u.toString(), {
      next: { revalidate: 86400 },
    });
    const data = Array.isArray(j?.data) ? j.data : [];
    return data.map((g: any) => ({
      type: "gif",
      url: g.images?.original?.url,
      thumb: g.images?.downsized_still?.url,
      title: g.title || name,
      source: "giphy",
      width: Number(g.images?.original?.width) || undefined,
      height: Number(g.images?.original?.height) || undefined,
    }));
  } catch (e) {
    console.error("giphy enrich err", e);
    return [];
  }
}

async function enrich_photos(name: string): Promise<MediaItem[]> {
  const items: MediaItem[] = [];

  // PEXELS
  if (PEXELS_KEY) {
    try {
      const u = new URL("https://api.pexels.com/v1/search");
      u.searchParams.set("query", name);
      u.searchParams.set("per_page", "2");

      const j = await fetchJSON<any>(u.toString(), {
        headers: { Authorization: PEXELS_KEY },
        next: { revalidate: 86400 },
      });
      const photos = Array.isArray(j?.photos) ? j.photos : [];
      for (const p of photos) {
        items.push({
          type: "image",
          url: p.src?.large2x || p.src?.large || p.src?.medium,
          thumb: p.src?.tiny || p.src?.small,
          title: p.alt || name,
          width: p.width,
          height: p.height,
          source: "pexels",
        });
      }
    } catch (e) {
      console.error("pexels enrich err", e);
    }
  }

  // UNSPLASH (fallback / תוספת בלי קריאה ל־API אם אין KEY)
  const querySlug = encodeURIComponent(`fitness,workout,${name}`);
  const unsplashUrl = UNSPLASH_KEY
    ? `https://source.unsplash.com/featured/?${querySlug}`
    : `https://source.unsplash.com/800x600/?${querySlug}`;

  items.push({
    type: "image",
    url: unsplashUrl,
    thumb: unsplashUrl,
    title: name,
    source: "unsplash",
  });

  return items;
}

async function enrich_youtube(name: string): Promise<MediaItem[]> {
  if (!YT_KEY) return [];
  try {
    const u = new URL("https://www.googleapis.com/youtube/v3/search");
    u.searchParams.set("part", "snippet");
    u.searchParams.set("type", "video");
    u.searchParams.set("maxResults", "2");
    u.searchParams.set("q", `${name} exercise tutorial`);

    const j = await fetchJSON<any>(u.toString(), {
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });
    const items = Array.isArray(j?.items) ? j.items : [];
    return items.map((v: any): MediaItem => {
      const id = v.id?.videoId;
      const sn = v.snippet ?? {};
      return {
        type: "video",
        url: id ? `https://www.youtube.com/watch?v=${id}` : "",
        thumb: sn.thumbnails?.medium?.url,
        title: sn.title || name,
        source: "youtube",
      };
    });
  } catch (e) {
    console.error("youtube enrich err", e);
    return [];
  }
}

/* ========================== Merge / Filter / Sort ========================== */

function keyOf(r: Exercise) {
  return `${lc(r.name)}|${lc(r.category)}`;
}

function mergePools(pools: Exercise[][]): Exercise[] {
  const map = new Map<string, Exercise>();

  for (const pool of pools) {
    for (const ex of pool) {
      const k = keyOf(ex);
      const existing = map.get(k);
      if (!existing) {
        map.set(k, {
          ...ex,
          sources: Array.from(
            new Set(ex.sources || [ex.providerHint || "live"]),
          ),
        });
        continue;
      }

      // merge
      const merged: Exercise = {
        _id: existing._id || ex._id,
        name: existing.name.length >= ex.name.length ? existing.name : ex.name,
        description:
          (existing.description || "").length >= (ex.description || "").length
            ? existing.description
            : ex.description,
        category: existing.category || ex.category,
        primaryMuscles: Array.from(
          new Set([
            ...(existing.primaryMuscles || []),
            ...(ex.primaryMuscles || []),
          ]),
        ),
        equipment: Array.from(
          new Set([...(existing.equipment || []), ...(ex.equipment || [])]),
        ),
        difficulty:
          existing.difficulty && existing.difficulty !== ""
            ? existing.difficulty
            : ex.difficulty,
        media: mergeMedia(existing.media, ex.media),
        sources: Array.from(
          new Set(
            [
              ...(existing.sources || []),
              ...(ex.sources || []),
              existing.providerHint || "",
              ex.providerHint || "",
            ].filter(Boolean),
          ),
        ),
        providerHint: existing.providerHint || ex.providerHint,
      };
      map.set(k, merged);
    }
  }

  return Array.from(map.values());
}

function mergeMedia(a?: MediaItem[], b?: MediaItem[]): MediaItem[] {
  const arr = [...(a || []), ...(b || [])];
  const byUrl = new Map<string, MediaItem>();
  for (const m of arr) {
    if (!m?.url) continue;
    if (!byUrl.has(m.url)) byUrl.set(m.url, m);
  }
  // נגביל ל-8 פריטים כדי לא להתחרפן
  return Array.from(byUrl.values()).slice(0, 8);
}

function localFilter(items: Exercise[], q: FitQuery): Exercise[] {
  let out = items;

  if (q.q) {
    const needle = lc(q.q);
    out = out.filter((e) => {
      const hay = [
        e.name,
        e.description || "",
        (e.primaryMuscles || []).join(" "),
        (e.equipment || []).join(" "),
        e.category,
      ].join(" ");
      return includesAny(hay, [needle]);
    });
  }

  if (q.category) {
    const cat = lc(q.category);
    out = out.filter(
      (e) => lc(e.category) === cat || lc(e.category).includes(cat),
    );
  }

  if (q.muscle) {
    const mus = lc(q.muscle);
    out = out.filter((e) =>
      (e.primaryMuscles || []).some(
        (m) => lc(m) === mus || lc(m).includes(mus),
      ),
    );
  }

  if (q.equipment) {
    const eq = lc(q.equipment);
    out = out.filter((e) =>
      (e.equipment || []).some((m) => lc(m) === eq || lc(m).includes(eq)),
    );
  }

  if (q.difficulty && q.difficulty !== "") {
    out = out.filter((e) => e.difficulty === q.difficulty);
  }

  // סינון לפי providers אם רוצים (sources)
  if (q.providers?.length) {
    const pset = new Set(q.providers.map((p) => lc(p)));
    out = out.filter((e) => {
      const srcs = (e.sources || []).map(lc);
      const ph = lc(e.providerHint || "");
      if (ph && pset.has(ph)) return true;
      if (!srcs.length) return !pset.size;
      return srcs.some((s) => pset.has(s));
    });
  }

  return out;
}

function diffWeight(d?: Difficulty): number {
  if (d === "beginner") return 1;
  if (d === "intermediate") return 2;
  if (d === "advanced") return 3;
  return 0;
}

function localSort(
  items: Exercise[],
  sort?: FitQuery["sort"],
  q?: FitQuery,
): Exercise[] {
  const arr = [...items];

  if (!sort || sort === "relevance") {
    if (!q?.q) return arr;
    const needle = lc(q.q || "");

    return arr.sort((a, b) => {
      const an = lc(a.name);
      const bn = lc(b.name);
      const aInName = an.includes(needle) ? 1 : 0;
      const bInName = bn.includes(needle) ? 1 : 0;
      if (aInName !== bInName) return bInName - aInName;

      const adesc = lc(a.description || "");
      const bdesc = lc(b.description || "");
      const aInDesc = adesc.includes(needle) ? 1 : 0;
      const bInDesc = bdesc.includes(needle) ? 1 : 0;
      if (aInDesc !== bInDesc) return bInDesc - aInDesc;

      return an.localeCompare(bn, "en");
    });
  }

  if (sort === "name_asc") {
    return arr.sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  if (sort === "name_desc") {
    return arr.sort((a, b) => b.name.localeCompare(a.name, "en"));
  }
  if (sort === "difficulty") {
    return arr.sort(
      (a, b) => diffWeight(a.difficulty) - diffWeight(b.difficulty),
    );
  }
  if (sort === "media_rich") {
    return arr.sort((a, b) => (b.media?.length || 0) - (a.media?.length || 0));
  }

  return arr;
}

const paginate = <T>(arr: T[], page: number, limit: number) =>
  arr.slice((page - 1) * limit, (page - 1) * limit + limit);

/* ========================== DEMO ========================== */

const DEMO: Exercise[] = [
  {
    _id: "demo:pushup",
    name: "Push-Up קלאסי",
    description:
      "תרגיל גוף מלא לחזה, יד קדמית וכתפיים. גוף בקו ישר, ירידה מבוקרת, עלייה דינמית.",
    category: "chest",
    primaryMuscles: ["Chest", "Triceps", "Shoulders"],
    equipment: ["Bodyweight"],
    difficulty: "beginner",
    media: [
      {
        type: "image",
        url: "https://source.unsplash.com/800x600/?pushup,fitness",
        source: "demo",
      },
    ],
    sources: ["demo"],
    providerHint: "demo",
  },
  {
    _id: "demo:squat",
    name: "Squat חופשי",
    description:
      "עומדים ברוחב הכתפיים, ירידה עד כיפוף ברך ~90°, גב ישר, ברכיים לא עוברות את קו האצבעות.",
    category: "legs",
    primaryMuscles: ["Quads", "Glutes"],
    equipment: ["Bodyweight"],
    difficulty: "beginner",
    media: [
      {
        type: "image",
        url: "https://source.unsplash.com/800x600/?squat,gym",
        source: "demo",
      },
    ],
    sources: ["demo"],
    providerHint: "demo",
  },
  {
    _id: "demo:plank",
    name: "Plank סטטי",
    description:
      "מנח שכיבת סמיכה על האמות, גוף בקו ישר מהראש לעקבים, בטן אסופה, לא לשקוע במותן.",
    category: "abs",
    primaryMuscles: ["Abs", "Core"],
    equipment: ["Bodyweight"],
    difficulty: "intermediate",
    media: [
      {
        type: "image",
        url: "https://source.unsplash.com/800x600/?plank,core",
        source: "demo",
      },
    ],
    sources: ["demo"],
    providerHint: "demo",
  },
];

/* ========================== Facets ========================== */

function makeFacets(items: Exercise[]) {
  const f = {
    category: {} as Record<string, number>,
    difficulty: {} as Record<string, number>,
    muscle: {} as Record<string, number>,
    provider: {} as Record<string, number>,
  };
  for (const it of items) {
    const cat = it.category || "other";
    const diff = it.difficulty || "";
    f.category[cat] = (f.category[cat] || 0) + 1;
    f.difficulty[diff] = (f.difficulty[diff] || 0) + 1;
    (it.primaryMuscles || []).forEach((m) => {
      const k = m || "";
      f.muscle[k] = (f.muscle[k] || 0) + 1;
    });
    (it.sources || []).forEach((p) => {
      const k = p || "";
      f.provider[k] = (f.provider[k] || 0) + 1;
    });
  }
  return f;
}

/* ========================== Legacy mapping ========================== */

function toHeLevel(d?: Difficulty) {
  return d === "beginner"
    ? "קל"
    : d === "intermediate"
      ? "בינוני"
      : d === "advanced"
        ? "מתקדם"
        : "";
}

function extractYoutubeId(url?: string) {
  if (!url) return undefined;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return m?.[1];
}

function toLegacyItem(e: Exercise) {
  const firstImage =
    e.media?.find((m) => m.type === "image")?.url ||
    e.media?.find((m) => m.type === "gif")?.url;

  const firstVideo = e.media?.find((m) => m.type === "video")?.url;

  const youtubeId = extractYoutubeId(firstVideo);

  return {
    id: e._id,
    name: e.name,
    description: e.description || "",
    muscle: e.primaryMuscles?.[0] || "",
    level: toHeLevel(e.difficulty),
    provider: e.providerHint || e.sources?.[0] || "agg",
    images: firstImage ? [firstImage] : [],
    youtubeId,
    videoUrl: firstVideo,
  };
}

/* ========================== Mongo Layer ========================== */

let _db: Db | null = null;
async function getDb() {
  if (_db) return _db;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  _db = client.db(MONGODB_DB);
  return _db;
}

function makeFacetsFromDocs(docs: any[]) {
  const f = {
    category: {} as Record<string, number>,
    difficulty: {} as Record<string, number>,
    muscle: {} as Record<string, number>,
    provider: {} as Record<string, number>,
  };
  for (const it of docs) {
    const cat = it.category || "other";
    const diff = it.difficulty || "";
    f.category[cat] = (f.category[cat] || 0) + 1;
    f.difficulty[diff] = (f.difficulty[diff] || 0) + 1;
    (it.primaryMuscles || []).forEach((m: string) => {
      f.muscle[m] = (f.muscle[m] || 0) + 1;
    });
    const providers = Array.isArray(it.sources)
      ? it.sources
      : it.providerHint
        ? [it.providerHint]
        : ["mongo"];
    providers.forEach((p: string) => {
      f.provider[p] = (f.provider[p] || 0) + 1;
    });
  }
  return f;
}

function mapDocToLegacy(doc: any) {
  const firstImage =
    (doc.media || []).find((m: any) => m?.type === "image")?.url ||
    (doc.media || []).find((m: any) => m?.type === "gif")?.url;
  let youtubeId: string | undefined;
  const yt = (doc.media || []).find(
    (m: any) =>
      m?.type === "video" &&
      typeof m.url === "string" &&
      (m.url.includes("youtube.com/watch?v=") || m.url.includes("youtu.be/")),
  );
  if (yt?.url) {
    youtubeId = extractYoutubeId(yt.url);
  }
  return {
    id: String(doc._id || doc.id || doc.uid),
    name: doc.name,
    description: doc.description || "",
    muscle: Array.isArray(doc.primaryMuscles)
      ? doc.primaryMuscles[0]
      : doc.muscle || "",
    level: toHeLevel(doc.difficulty),
    provider: (doc.providerHint || doc.sources?.[0]) ?? "mongo",
    images: firstImage ? [firstImage] : [],
    youtubeId,
    videoUrl: (doc.media || []).find((m: any) => m?.type === "video")?.url,
  };
}

async function queryMongo(qp: FitQuery): Promise<Paged<any>> {
  const db = await getDb();
  const col = db.collection(FIT_COLLECTION);

  const filter: any = {};
  const and: any[] = [];

  const qText = norm(qp.q);
  const muscle = norm(qp.muscle);
  const diffHe = norm((qp as any).level as string);

  if (qText) {
    and.push({
      $or: [
        { name: { $regex: qText, $options: "i" } },
        {
          description: {
            $regex: qText,
            $options: "i",
          },
        },
        {
          primaryMuscles: {
            $elemMatch: {
              $regex: qText,
              $options: "i",
            },
          },
        },
        {
          equipment: {
            $elemMatch: {
              $regex: qText,
              $options: "i",
            },
          },
        },
        {
          category: {
            $regex: qText,
            $options: "i",
          },
        },
      ],
    });
  }

  if (muscle) {
    and.push({
      primaryMuscles: {
        $elemMatch: {
          $regex: `^${muscle}$`,
          $options: "i",
        },
      },
    });
  }

  if (diffHe) {
    const map: Record<string, Difficulty> = {
      קל: "beginner",
      בינוני: "intermediate",
      מתקדם: "advanced",
    };
    const diff = map[diffHe] || "";
    if (diff) and.push({ difficulty: diff });
  }

  if (and.length) filter.$and = and;

  const sortObj: any = {};
  if (qp.sort === "name_asc") sortObj.name = 1;
  else if (qp.sort === "name_desc") sortObj.name = -1;
  else if (qp.sort === "difficulty") sortObj.difficulty = 1;
  else if (qp.sort === "media_rich") sortObj.mediaCount = -1;
  else sortObj._id = -1;

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        mediaCount: {
          $size: { $ifNull: ["$media", []] },
        },
      },
    },
    { $sort: sortObj },
    { $skip: (qp.page - 1) * qp.limit },
    { $limit: qp.limit },
    {
      $project: {
        name: 1,
        description: 1,
        category: 1,
        primaryMuscles: 1,
        equipment: 1,
        difficulty: 1,
        media: 1,
        sources: 1,
        providerHint: 1,
      },
    },
  ] as any[];

  const [docs, total] = await Promise.all([
    col.aggregate(pipeline).toArray(),
    col.countDocuments(filter),
  ]);

  const pages = Math.max(1, Math.ceil(total / qp.limit));
  return {
    ok: true,
    items: docs.map(mapDocToLegacy),
    total,
    page: qp.page,
    pages,
    facets: makeFacetsFromDocs(docs),
    note: "mongo",
  };
}

/* ========================== GET ========================== */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // paging
    const page = clamp(toInt(url.searchParams.get("page"), 1), 1, 9999);
    const limitRaw =
      toInt(url.searchParams.get("limit"), 0) ||
      toInt(url.searchParams.get("pageSize"), 0) ||
      DEFAULT_LIMIT;
    const limit = clamp(limitRaw, MIN_LIMIT, MAX_LIMIT);

    // providers
    const providersParam = url.searchParams.getAll("provider");
    const single = url.searchParams.get("provider") || "all";
    const requested = providersParam.length
      ? providersParam
      : single === "all"
        ? ["wger", "exercisedb", "apininjas", "demo"]
        : single
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

    const providers = requested.map((p) => {
      const x = p.toLowerCase();
      if (x === "ninjas") return "apininjas";
      if (x === "api-ninjas") return "apininjas";
      return x;
    });

    const q: FitQuery = {
      q: url.searchParams.get("q") || undefined,
      category: url.searchParams.get("category") || undefined,
      muscle: url.searchParams.get("muscle") || undefined,
      equipment: url.searchParams.get("equipment") || undefined,
      difficulty: (url.searchParams.get("difficulty") as Difficulty) || "",
      page,
      limit,
      sort: (url.searchParams.get("sort") as FitQuery["sort"]) || "relevance",
      providers,
      enrich: url.searchParams.get("enrich") === "true",
      includeRaw: url.searchParams.get("include") === "raw",
    };

    const source = (url.searchParams.get("source") || FIT_SOURCE_DEFAULT) as
      | "mongo"
      | "live"
      | "hybrid";

    // 1) Mongo בלבד
    if (source === "mongo") {
      const payload = await queryMongo(q);
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // 2) DEMO בלבד (בלי פילטרים, בלי enrich) – נותן "טעימה"
    const hasAnyFilter =
      q.q || q.muscle || q.category || q.equipment || q.difficulty;
    if (!hasAnyFilter && !q.enrich && source !== "hybrid") {
      const base = DEMO;
      const total = base.length;
      const items = paginate(base.map(toLegacyItem), q.page, q.limit);
      const payload: Paged<any> = {
        ok: true,
        items,
        total,
        page: q.page,
        pages: Math.max(1, Math.ceil(total / q.limit)),
        facets: makeFacets(base),
        note: "demo",
      };
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // 3) Live / Hybrid
    const tasks: Array<Promise<Exercise[]>> = [];
    if (providers.includes("wger")) tasks.push(wger_list(q));
    if (providers.includes("exercisedb")) tasks.push(exercisedb_list(q));
    if (providers.includes("apininjas")) tasks.push(ninjas_list(q));
    if (providers.includes("demo")) tasks.push(Promise.resolve(DEMO));

    const results = await Promise.allSettled(tasks);
    const pools: Exercise[][] = results.map((r) =>
      r.status === "fulfilled" ? r.value : [],
    );

    let merged = mergePools(pools);

    // העשרה חכמה (מדיה)
    if (q.enrich) {
      const need = merged
        .filter((e) => !e.media || e.media.length === 0)
        .slice(0, 12);

      const enriched = await Promise.all(
        need.map(async (e) => {
          const [yt, gifs, photos] = await Promise.all([
            enrich_youtube(e.name),
            enrich_giphy(e.name),
            enrich_photos(e.name),
          ]);
          const add = [...yt, ...gifs, ...photos];
          if (add.length) {
            e.media = mergeMedia(e.media, add);
            e.sources = Array.from(
              new Set([
                ...(e.sources || []),
                ...add.map((m) => m.source || "").filter(Boolean),
              ]),
            );
          }
          return e;
        }),
      );

      const set = new Set(enriched.map((x) => x._id));
      merged = merged.map((x) =>
        set.has(x._id) ? enriched.find((e) => e._id === x._id)! : x,
      );
    }

    const filtered = localFilter(merged, q);
    const sorted = localSort(filtered, q.sort, q);
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / q.limit));
    const safePage = clamp(q.page, 1, pages);
    const pageItems = paginate(sorted, safePage, q.limit);

    const facets = makeFacets(filtered);
    const legacyItems = pageItems.map(toLegacyItem);

    const payload: Paged<any> = {
      ok: true,
      items: legacyItems,
      total,
      page: safePage,
      pages,
      facets,
      note: "live",
    };

    if (q.includeRaw) (payload as any).raw = pageItems;

    // hybrid: אפשר בהמשך למזג לפה גם תוצאות Mongo
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    console.error("fit/exercises ERR", err);
    const payload: Paged<any> = {
      ok: false,
      items: [],
      total: 0,
      page: 1,
      pages: 1,
      error: String(err?.message || err),
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
