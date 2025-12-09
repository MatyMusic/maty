/**
 * WGER Provider — Advanced (Full)
 * - Full pagination (listAll), search with language fallback (he->en), enrichment with images
 * - Lookups cache (muscles/equipment), in-memory TTL
 * - Concurrency limiter for image fetches
 * - Soft retry and graceful failures
 */

import { cacheGet, cacheSet } from "@/lib/fit/cache";
import { slugify } from "@/lib/fit/util";

// ---------- ENV & CONSTANTS ----------
const BASE = process.env.FIT_API_BASE || "https://wger.de/api/v2";
const LANG_PREF = (process.env.FIT_API_LANG || "he").toLowerCase(); // he/en/...
const TTL_SEC = Number(process.env.FIT_API_CACHE_TTL_SEC || 60 * 60 * 24); // 1d
const IMG_CONCURRENCY = Number(process.env.FIT_WGER_IMG_CONCURRENCY || 6);
const PAGE_LIMIT = Math.min(
  Math.max(Number(process.env.FIT_WGER_PAGE_LIMIT || 200), 20),
  400,
);

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// WGER language ids (subset; he=10 קיים במערכת אך לא תמיד מאוכלס)
const LANG_ID_MAP: Record<string, number> = {
  de: 1,
  en: 2,
  es: 3,
  fr: 4,
  pl: 5,
  it: 6,
  pt: 7,
  zh: 8,
  ru: 9,
  he: 10,
};
const PREF_LANG_ID = LANG_ID_MAP[LANG_PREF] || 2; // default en

// ---------- Helpers (fetch + retry + json) ----------
async function fetchJSON<T = any>(
  url: string,
  init?: RequestInit,
  retries = 1,
): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctl.signal,
      ...init,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return (await res.json()) as T;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 400));
      return fetchJSON<T>(url, init, retries - 1);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
const api = (pathOrUrl: string) =>
  pathOrUrl.startsWith("http") ? pathOrUrl : `${BASE}${pathOrUrl}`;

function stripHtml(html?: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Lookups (muscles/equipment) with caching ----------
type Lookups = { muscles: Map<number, string>; equipment: Map<number, string> };

async function loadLookups(): Promise<Lookups> {
  const CK = `wger:lookups:v1`;
  const cached = cacheGet<Lookups>(CK);
  if (cached) return cached;

  // Note: /muscle/ and /equipment/ do not accept language param; names are in English.
  const [muscles, equipment] = await Promise.all([
    fetchJSON<Paginated<{ id: number; name: string }>>(
      api(`/muscle/?limit=200`),
    ),
    fetchJSON<Paginated<{ id: number; name: string }>>(
      api(`/equipment/?limit=200`),
    ),
  ]);

  const m = new Map<number, string>();
  for (const r of muscles.results || []) m.set(r.id, r.name);

  const e = new Map<number, string>();
  for (const r of equipment.results || []) e.set(r.id, r.name);

  const lookups = { muscles: m, equipment: e };
  cacheSet(CK, lookups, TTL_SEC * 1000);
  return lookups;
}

// ---------- Images per exercise with concurrency ----------
async function loadImagesForExercise(exId: number): Promise<string[]> {
  const CK = `wger:images:${exId}`;
  const cached = cacheGet<string[]>(CK);
  if (cached) return cached;

  const data = await fetchJSON<Paginated<{ id: number; image: string }>>(
    api(`/exerciseimage/?exercise=${exId}&limit=50`),
  );
  const urls = (data?.results || []).map((x) => x.image).filter(Boolean);
  cacheSet(CK, urls, TTL_SEC * 1000);
  return urls;
}

// simple pool
async function withPool<T>(
  tasks: (() => Promise<T>)[],
  size = IMG_CONCURRENCY,
): Promise<T[]> {
  const out: T[] = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const fn = tasks[i++];
      try {
        out.push(await fn());
      } catch {
        // ignore single image failure
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, () => worker()),
  );
  return out;
}

// ---------- Normalization ----------
export type WgerNormalized = {
  provider: "wger";
  providerId: string; // numeric as string
  name: string;
  slug: string;
  description: string;
  muscles: string[]; // english names from lookups (map later to he if צריך)
  equipment: string[]; // english names
  images: string[];
  language: string; // requested language code (he/en/..)
  source: { url: string; license?: string };
};

// ---------- Core list/search ----------
export async function wgerSearch(opts: {
  q?: string;
  muscle?: string | number; // "biceps" or 8
  equipment?: string | number; // "barbell" or 1
  page?: number;
  limit?: number;
}): Promise<{
  items: WgerNormalized[];
  total: number;
  page: number;
  pages: number;
  ttlSec: number;
}> {
  const { muscles: musclesMap, equipment: equipmentMap } = await loadLookups();
  const q = (opts.q || "").trim();
  const limit = Math.min(Math.max(Number(opts.limit || 24), 1), 50);
  const page = Math.max(1, Number(opts.page || 1));

  // Build query in preferred language
  const params = new URLSearchParams();
  if (q) params.set("name", q);
  params.set("page", String(page));
  params.set("limit", String(PAGE_LIMIT)); // we over-fetch then slice client side
  params.set("language", String(PREF_LANG_ID));
  params.set("status", "2");

  let data = await fetchJSON<Paginated<any>>(
    api(`/exercise/?${params.toString()}`),
  );

  // fallback to English if few results and language != en
  if (
    (!data?.results?.length || data.results.length < 5) &&
    PREF_LANG_ID !== 2
  ) {
    const p2 = new URLSearchParams(params);
    p2.set("language", "2");
    data = await fetchJSON<Paginated<any>>(api(`/exercise/?${p2.toString()}`));
  }

  let items = (data?.results || []) as any[];

  // Filter by muscle/equipment (string or id)
  const musFilter = opts.muscle ? String(opts.muscle).toLowerCase() : "";
  const eqFilter = opts.equipment ? String(opts.equipment).toLowerCase() : "";

  if (musFilter) {
    items = items.filter((r) => {
      const ids: number[] = [
        ...(r.muscles || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
        ...(r.muscles_secondary || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
      ];
      if (/^\d+$/.test(musFilter)) return ids.includes(Number(musFilter));
      const names = ids.map((id: number) =>
        (musclesMap.get(id) || "").toLowerCase(),
      );
      return names.some((nm) => nm.includes(musFilter));
    });
  }
  if (eqFilter) {
    items = items.filter((r) => {
      const ids: number[] = (r.equipment || [])
        .map((x: any) => Number(x?.id || x))
        .filter(Number.isFinite);
      if (/^\d+$/.test(eqFilter)) return ids.includes(Number(eqFilter));
      const names = ids.map((id: number) =>
        (equipmentMap.get(id) || "").toLowerCase(),
      );
      return names.some((nm) => nm.includes(eqFilter));
    });
  }

  const total = Number(data?.count || items.length);

  // Enrich + normalize (images with pool)
  const tasks = items.slice(0, limit).map((r) => async () => {
    const id: number = r.id;
    const muscleIds: number[] = Array.from(
      new Set([
        ...(r.muscles || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
        ...(r.muscles_secondary || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
      ]),
    );
    const equipIds: number[] = Array.from(
      new Set([
        ...(r.equipment || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
      ]),
    );

    const images = await loadImagesForExercise(id);

    const norm: WgerNormalized = {
      provider: "wger",
      providerId: String(id),
      name: r.name || "Exercise",
      slug: slugify(r.name || String(id)),
      description: stripHtml(r.description || r.instructions || r.notes || ""),
      muscles: muscleIds
        .map((mid) => musclesMap.get(mid))
        .filter(Boolean) as string[],
      equipment: equipIds
        .map((eid) => equipmentMap.get(eid))
        .filter(Boolean) as string[],
      images,
      language: LANG_PREF,
      source: {
        url: `https://wger.de/en/exercise/${id}`,
        license: "CC BY-SA (wger)",
      },
    };
    return norm;
  });

  const enriched = await withPool(tasks, IMG_CONCURRENCY);
  const pages = Math.max(1, Math.ceil(total / limit));
  return { items: enriched, total, page, pages, ttlSec: TTL_SEC };
}

// ---------- listAll: fetch every page (with safety cap) ----------
export async function wgerListAll(max = 2000): Promise<WgerNormalized[]> {
  const CK = `wger:listAll:${PREF_LANG_ID}:${PAGE_LIMIT}`;
  const cached = cacheGet<WgerNormalized[]>(CK);
  if (cached) return cached;

  const { muscles: musclesMap, equipment: equipmentMap } = await loadLookups();

  const baseParams = new URLSearchParams();
  baseParams.set("language", String(PREF_LANG_ID));
  baseParams.set("status", "2");
  baseParams.set("limit", String(PAGE_LIMIT));

  let url = api(`/exercise/?${baseParams.toString()}`);
  let all: any[] = [];
  let guard = 0;

  // pull all pages, fallback to en if none at all
  while (url && guard++ < 100) {
    const data = await fetchJSON<Paginated<any>>(url);
    all = all.concat(data.results || []);
    url = data.next ? api(data.next) : "";
    if (all.length >= max) break;
  }
  if (!all.length && PREF_LANG_ID !== 2) {
    const p2 = new URLSearchParams(baseParams);
    p2.set("language", "2");
    url = api(`/exercise/?${p2.toString()}`);
    guard = 0;
    while (url && guard++ < 100) {
      const data = await fetchJSON<Paginated<any>>(url);
      all = all.concat(data.results || []);
      url = data.next ? api(data.next) : "";
      if (all.length >= max) break;
    }
  }

  // Enrich images in a pool
  const tasks = all.slice(0, max).map((r) => async () => {
    const id: number = r.id;
    const muscleIds: number[] = Array.from(
      new Set([
        ...(r.muscles || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
        ...(r.muscles_secondary || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
      ]),
    );
    const equipIds: number[] = Array.from(
      new Set([
        ...(r.equipment || [])
          .map((x: any) => Number(x?.id || x))
          .filter(Number.isFinite),
      ]),
    );
    const images = await loadImagesForExercise(id);
    const norm: WgerNormalized = {
      provider: "wger",
      providerId: String(id),
      name: r.name || "Exercise",
      slug: slugify(r.name || String(id)),
      description: stripHtml(r.description || ""),
      muscles: muscleIds
        .map((mid) => musclesMap.get(mid))
        .filter(Boolean) as string[],
      equipment: equipIds
        .map((eid) => equipmentMap.get(eid))
        .filter(Boolean) as string[],
      images,
      language: LANG_PREF,
      source: {
        url: `https://wger.de/en/exercise/${id}`,
        license: "CC BY-SA (wger)",
      },
    };
    return norm;
  });

  const list = await withPool(tasks, IMG_CONCURRENCY);
  cacheSet(CK, list, TTL_SEC * 1000);
  return list;
}

// ---------- getById ----------
export async function wgerGetById(
  idOrGlobal: string,
): Promise<WgerNormalized | null> {
  const id = Number(String(idOrGlobal).split(":").pop());
  if (!Number.isFinite(id)) return null;

  const CK = `wger:get:${id}:${PREF_LANG_ID}`;
  const cached = cacheGet<WgerNormalized>(CK);
  if (cached) return cached;

  const { muscles: musclesMap, equipment: equipmentMap } = await loadLookups();

  // try preferred, fallback en
  const params = new URLSearchParams();
  params.set("language", String(PREF_LANG_ID));
  const r = await fetchJSON<any>(
    api(`/exercise/${id}/?${params.toString()}`),
  ).catch(() => null);

  let data = r;
  if (!data && PREF_LANG_ID !== 2) {
    data = await fetchJSON<any>(api(`/exercise/${id}/?language=2`)).catch(
      () => null,
    );
  }
  if (!data) return null;

  const images = await loadImagesForExercise(id);
  const muscleIds: number[] = Array.from(
    new Set([
      ...(data.muscles || [])
        .map((x: any) => Number(x?.id || x))
        .filter(Number.isFinite),
      ...(data.muscles_secondary || [])
        .map((x: any) => Number(x?.id || x))
        .filter(Number.isFinite),
    ]),
  );
  const equipIds: number[] = Array.from(
    new Set([
      ...(data.equipment || [])
        .map((x: any) => Number(x?.id || x))
        .filter(Number.isFinite),
    ]),
  );

  const norm: WgerNormalized = {
    provider: "wger",
    providerId: String(id),
    name: data.name || "Exercise",
    slug: slugify(data.name || String(id)),
    description: stripHtml(data.description || data.instructions || ""),
    muscles: muscleIds
      .map((mid) => musclesMap.get(mid))
      .filter(Boolean) as string[],
    equipment: equipIds
      .map((eid) => equipmentMap.get(eid))
      .filter(Boolean) as string[],
    images,
    language: LANG_PREF,
    source: {
      url: `https://wger.de/en/exercise/${id}`,
      license: "CC BY-SA (wger)",
    },
  };

  cacheSet(CK, norm, TTL_SEC * 1000);
  return norm;
}

// ---------- Small helper to map to your global ExerciseItem (optional) ----------
export function toExerciseItem(x: WgerNormalized) {
  return {
    id: `wger:${x.providerId}`,
    provider: "wger" as const,
    name: x.name,
    slug: x.slug,
    muscle: (x.muscles[0] || "כללי") as any, // ניתן לבצע מיפוי he כאן
    secondary: x.muscles.slice(1) as any,
    equipment: x.equipment as any,
    level: "כללי" as const,
    instructions: x.description,
    images: x.images,
    videoUrl: undefined,
  };
}

export async function wgerList() {
  // TODO: למשוך מה-API האמיתי של wger בעתיד
  return [];
}

export async function wgerGet(id: string | number) {
  // TODO: החזרה אמיתית של תרגיל / אימון
  return null;
}
