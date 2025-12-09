// src/lib/db/fit-repo.ts
import { ObjectId, type Collection, type IndexDescription } from "mongodb";
import { getDb } from "@/lib/mongodb";

/** ================== Types ================== */
export type GeoPoint = { type: "Point"; coordinates: [number, number] };

export type FitSport =
  | "running"
  | "walking"
  | "gym"
  | "yoga"
  | "pilates"
  | "hiit"
  | "cycling"
  | "crossfit"
  | "swimming"
  | "football"
  | "basketball";

/** -------- תרגילים -------- */
export type FitExercise = {
  _id?: ObjectId;
  provider: "wger" | "custom";
  providerId: string;
  name: string;
  description?: string;
  muscles?: string[];
  equipment?: string[];
  images?: string[];
  language?: string; // he/en...
  createdAt?: string;
  updatedAt?: string;
};

/** -------- אימונים -------- */
export type FitWorkout = {
  _id?: ObjectId;
  userId: string;
  title: string;
  note?: string;
  items: Array<{
    exerciseId: string; // מ-fit_exercises._id (toString)
    sets?: number;
    reps?: number;
    durationSec?: number;
    restSec?: number;
  }>;
  visibility?: "private" | "club" | "public";
  createdAt?: string;
  updatedAt?: string;
};

/** -------- פרופילי FIT (“מי סביבי”) -------- */
export type FitProfile = {
  _id?: ObjectId;
  userId: string;
  displayName?: string | null;
  sports?: FitSport[];
  level?: "beginner" | "intermediate" | "advanced";
  gym?: string | null;
  available?: boolean;
  loc?: GeoPoint | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** -------- קבוצות ספורט -------- */
export type FitGroup = {
  _id?: ObjectId;
  slug: string; // ייחודי, לטיני
  title: string;
  description?: string;
  city?: string | null;
  sports: FitSport[];
  level?: "beginner" | "intermediate" | "advanced" | null;
  ownerId: string;
  members: string[]; // userId-ים
  visibility: "public" | "private";
  status: "pending" | "approved" | "rejected" | "blocked";
  createdAt?: string;
  updatedAt?: string;
};

function todayISO() {
  return new Date().toISOString();
}
function sanitizeSlug(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** ================== Collections ================== */
async function colExercises(): Promise<Collection<FitExercise>> {
  const db = await getDb();
  const c = db.collection<FitExercise>("fit_exercises");
  try {
    const wanted: Array<IndexDescription & { name: string; unique?: boolean }> =
      [
        {
          key: { provider: 1, providerId: 1 },
          name: "provider_pid",
          unique: true,
        },
        { key: { name: "text" }, name: "name_text" },
        { key: { updatedAt: -1, _id: -1 }, name: "updated_desc" },
      ];
    const exists = await c
      .listIndexes()
      .toArray()
      .catch(() => []);
    const have = new Set(exists.map((i: any) => i.name));
    for (const idx of wanted) {
      if (!have.has(idx.name))
        await c.createIndex(idx.key as any, {
          name: idx.name,
          unique: idx.unique,
        });
    }
  } catch {}
  return c;
}

async function colWorkouts(): Promise<Collection<FitWorkout>> {
  const db = await getDb();
  const c = db.collection<FitWorkout>("fit_workouts");
  try {
    await c.createIndex({ userId: 1, updatedAt: -1 }, { name: "user_updated" });
  } catch {}
  return c;
}

async function colProfiles(): Promise<Collection<FitProfile>> {
  const db = await getDb();
  const c = db.collection<FitProfile>("fit_profiles");
  try {
    const wanted: Array<IndexDescription & { name: string; unique?: boolean }> =
      [
        { key: { userId: 1 }, name: "user_unique", unique: true },
        { key: { available: 1 }, name: "available" },
        { key: { "sports.0": 1 }, name: "sports0" },
        { key: { loc: "2dsphere" } as any, name: "loc_2dsphere" },
        { key: { updatedAt: -1, _id: -1 }, name: "updated_desc" },
      ];
    const exists = await c
      .listIndexes()
      .toArray()
      .catch(() => []);
    const have = new Set(exists.map((i: any) => i.name));
    for (const idx of wanted) {
      if (!have.has(idx.name))
        await c.createIndex(idx.key as any, {
          name: idx.name,
          unique: idx.unique,
        });
    }
  } catch {}
  return c;
}

async function colFitGroups(): Promise<Collection<FitGroup>> {
  const db = await getDb();
  const c = db.collection<FitGroup>("fit_groups");
  try {
    const wanted: Array<IndexDescription & { name: string; unique?: boolean }> =
      [
        { key: { slug: 1 }, name: "slug_unique", unique: true },
        {
          key: { status: 1, visibility: 1, createdAt: -1 },
          name: "status_vis_created",
        },
        { key: { "sports.0": 1 }, name: "sports0" },
        { key: { ownerId: 1 }, name: "owner" },
        { key: { members: 1 }, name: "members" },
        { key: { city: 1 }, name: "city" },
        { key: { updatedAt: -1, _id: -1 }, name: "updated_desc" },
      ];
    const exists = await c
      .listIndexes()
      .toArray()
      .catch(() => []);
    const have = new Set(exists.map((i: any) => i.name));
    for (const idx of wanted) {
      if (!have.has(idx.name))
        await c.createIndex(idx.key as any, {
          name: idx.name,
          unique: idx.unique,
        });
    }
  } catch {}
  return c;
}

/** ================== Exercises: cache/upsert ================== */
export async function upsertExercise(
  e: Omit<FitExercise, "_id" | "createdAt" | "updatedAt">,
) {
  const C = await colExercises();
  const now = todayISO();
  const res = await C.findOneAndUpdate(
    { provider: e.provider, providerId: e.providerId },
    { $setOnInsert: { createdAt: now }, $set: { ...e, updatedAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  return res.value!;
}

export async function searchExercises(opts: {
  q?: string;
  muscle?: string;
  equipment?: string;
  limit?: number;
  page?: number;
}) {
  const C = await colExercises();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const q: any = {};
  if (opts.q) q.$text = { $search: opts.q };
  if (opts.muscle) q.muscles = opts.muscle;
  if (opts.equipment) q.equipment = opts.equipment;

  const items = await C.find(q)
    .sort({ updatedAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  const total = await C.countDocuments(q);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

/** ================== Workouts ================== */
export async function saveWorkout(
  w: Omit<FitWorkout, "_id" | "createdAt" | "updatedAt"> & { _id?: string },
) {
  const C = await colWorkouts();
  const now = todayISO();
  if (w._id) {
    const _id = new ObjectId(w._id);
    await C.updateOne(
      { _id, userId: w.userId },
      { $set: { ...w, updatedAt: now } },
    );
    return (await C.findOne({ _id }))!;
  }
  const doc: FitWorkout = { ...w, createdAt: now, updatedAt: now };
  const res = await C.insertOne(doc as any);
  return { ...(doc as any), _id: res.insertedId };
}

export async function listWorkouts(userId: string) {
  const C = await colWorkouts();
  return C.find({ userId }).sort({ updatedAt: -1, _id: -1 }).toArray();
}

/** ================== Profiles (“מי סביבי”) ================== */
function toPoint(input: any): GeoPoint | null {
  if (!input) return null;
  if (
    input.type === "Point" &&
    Array.isArray(input.coordinates) &&
    input.coordinates.length === 2
  ) {
    const [lng, lat] = input.coordinates.map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat))
      return { type: "Point", coordinates: [lng, lat] };
  }
  const lat = Number(input.lat ?? input.latitude ?? input?.coords?.lat);
  const lng = Number(
    input.lng ?? input.lon ?? input.long ?? input?.coords?.lng,
  );
  if (Number.isFinite(lat) && Number.isFinite(lng))
    return { type: "Point", coordinates: [lng, lat] };
  return null;
}

export async function upsertFitProfile(
  userId: string,
  patch: Partial<FitProfile>,
) {
  const C = await colProfiles();
  const now = todayISO();
  const loc = toPoint((patch as any).loc ?? patch);
  const cleaned: Partial<FitProfile> = {
    displayName:
      typeof patch.displayName === "string"
        ? patch.displayName.slice(0, 80)
        : undefined,
    sports: Array.isArray(patch.sports)
      ? [...new Set(patch.sports)]
      : undefined,
    level:
      patch.level &&
      ["beginner", "intermediate", "advanced"].includes(patch.level)
        ? patch.level
        : undefined,
    gym: typeof patch.gym === "string" ? patch.gym.slice(0, 100) : undefined,
    available:
      typeof patch.available === "boolean" ? patch.available : undefined,
    loc: loc ?? undefined,
    bio: typeof patch.bio === "string" ? patch.bio.slice(0, 500) : undefined,
    avatarUrl:
      typeof patch.avatarUrl === "string" ? patch.avatarUrl : undefined,
    updatedAt: now,
  };
  const res = await C.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, createdAt: now }, $set: cleaned },
    { upsert: true, returnDocument: "after" },
  );
  return res.value!;
}

/** ---- חיפוש שותפים קרובים (תומך גם בריבוי סוגי ספורט) ---- */
export async function nearbyPartners(opts: {
  centerLng: number;
  centerLat: number;
  distanceKm: number;
  sport?: FitSport;
  /** אם יש מערך — נדרוש חיתוך כלשהו (at least one) */
  sportsAny?: FitSport[];
  level?: "beginner" | "intermediate" | "advanced";
  availableOnly?: boolean;
  qGym?: string;
  limit?: number;
}) {
  const C = await colProfiles();
  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 80);

  const query: any = {};
  if (opts.sport) query.sports = opts.sport;
  if (opts.sportsAny?.length) query.sports = { $in: opts.sportsAny };
  if (opts.level) query.level = opts.level;
  if (opts.availableOnly) query.available = true;
  if (opts.qGym)
    query.gym = { $regex: String(opts.qGym).trim(), $options: "i" };

  const rows = await C.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [opts.centerLng, opts.centerLat] },
        key: "loc",
        spherical: true,
        maxDistance: opts.distanceKm * 1000,
        distanceField: "dist",
        query,
      },
    },
    { $sort: { dist: 1, updatedAt: -1, _id: -1 } },
    { $limit: limit },
  ]).toArray();

  return rows.map((d: any) => ({
    _id: d._id.toString(),
    userId: d.userId,
    displayName: d.displayName ?? null,
    sports: d.sports ?? [],
    level: d.level ?? null,
    gym: d.gym ?? null,
    available: !!d.available,
    avatarUrl: d.avatarUrl ?? null,
    distKm: typeof d.dist === "number" ? d.dist / 1000 : null,
  }));
}

/** ================== Groups ================== */
/** ---- יצירת קבוצה (נכנסת ל-pending עד אישור אדמין) ---- */
export async function createFitGroup(g: {
  slug: string;
  title: string;
  description?: string;
  city?: string | null;
  sports: FitSport[];
  level?: "beginner" | "intermediate" | "advanced" | null;
  ownerId: string;
  visibility: "public" | "private";
}) {
  const C = await colFitGroups();
  const now = todayISO();
  const doc: FitGroup = {
    ...g,
    slug: sanitizeSlug(g.slug),
    title: String(g.title).slice(0, 80),
    description: g.description
      ? String(g.description).slice(0, 400)
      : undefined,
    city: g.city ? String(g.city) : null,
    sports: Array.isArray(g.sports) ? [...new Set(g.sports)] : [],
    level: g.level ?? null,
    ownerId: g.ownerId,
    members: [g.ownerId],
    visibility: g.visibility === "private" ? "private" : "public",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await C.insertOne(doc as any);
  return doc;
}

/** ---- רשימת קבוצות ציבוריות מאושרות ---- */
export async function listPublicGroups(opts: {
  q?: string;
  sportAny?: FitSport[];
  city?: string;
  limit?: number;
  page?: number;
}) {
  const C = await colFitGroups();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const q: any = { status: "approved", visibility: "public" };
  if (opts.city) q.city = { $regex: String(opts.city).trim(), $options: "i" };
  if (opts.sportAny?.length) q.sports = { $in: opts.sportAny };
  if (opts.q) {
    q.$or = [
      { title: { $regex: opts.q, $options: "i" } },
      { description: { $regex: opts.q, $options: "i" } },
      { slug: { $regex: opts.q, $options: "i" } },
      { city: { $regex: opts.q, $options: "i" } },
    ];
  }

  const items = await C.find(q)
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  const total = await C.countDocuments(q);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

/** ---- הצטרפות/עזיבה (נגיש רק לקבוצות מאושרות) ---- */
export async function joinGroup(slug: string, userId: string) {
  const C = await colFitGroups();
  const now = todayISO();
  const res = await C.findOneAndUpdate(
    { slug: sanitizeSlug(slug), status: "approved" },
    { $addToSet: { members: userId }, $set: { updatedAt: now } },
    { returnDocument: "after" },
  );
  return res.value;
}

export async function leaveGroup(slug: string, userId: string) {
  const C = await colFitGroups();
  const now = todayISO();
  const res = await C.findOneAndUpdate(
    { slug: sanitizeSlug(slug), status: "approved" },
    { $pull: { members: userId }, $set: { updatedAt: now } },
    { returnDocument: "after" },
  );
  return res.value;
}

/** ---- אדמין: רשימות ותיעדוף ---- */
export async function adminListGroups(opts: {
  status?: Array<FitGroup["status"]>;
  q?: string;
  limit?: number;
  page?: number;
}) {
  const C = await colFitGroups();
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 200);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const q: any = {};
  if (opts.status?.length) q.status = { $in: opts.status };
  if (opts.q) {
    q.$or = [
      { slug: { $regex: opts.q, $options: "i" } },
      { title: { $regex: opts.q, $options: "i" } },
      { description: { $regex: opts.q, $options: "i" } },
      { city: { $regex: opts.q, $options: "i" } },
    ];
  }

  const items = await C.find(q)
    .sort({ updatedAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  const total = await C.countDocuments(q);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

export async function adminSetGroupStatus(
  slug: string,
  status: FitGroup["status"],
) {
  const C = await colFitGroups();
  const now = todayISO();
  const res = await C.findOneAndUpdate(
    { slug: sanitizeSlug(slug) },
    { $set: { status, updatedAt: now } },
    { returnDocument: "after" },
  );
  return res.value;
}
