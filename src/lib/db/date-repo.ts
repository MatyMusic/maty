// src/lib/db/date-repo.ts
import clientPromise from "@/lib/mongodb";
import {
  ObjectId,
  type Collection,
  type Db,
  type IndexDescription,
} from "mongodb";

/* ========== Types ========== */
export type Level = "strict" | "partial" | "none";
export type JudaismDirection =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

export type Gender = "male" | "female" | "other";
export type Goal = "serious" | "marriage" | "friendship";

export type Tier = "free" | "plus" | "pro" | "vip";
export type SubStatus = "active" | "inactive";
export type Subscription = {
  status: SubStatus;
  tier: Tier;
  expiresAt?: string | null;
};

export type GeoPoint = { type: "Point"; coordinates: [number, number] };

export type DateProfileDoc = {
  _id?: ObjectId;
  userId: string;
  email?: string | null;
  displayName?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  gender?: Gender | null;
  country?: string | null;
  city?: string | null;
  languages?: string[];
  loc?: GeoPoint | null;
  jewish_by_mother?: boolean;
  conversion?: boolean;
  judaism_direction?: JudaismDirection | null;
  kashrut_level?: Level | null;
  shabbat_level?: Level | null;
  tzniut_level?: Level | null;
  goals?: Goal | null;
  about_me?: string | null;
  photos?: string[];
  avatarUrl?: string | null;
  verified?: boolean;
  online?: boolean;
  subscription?: Subscription | null;
  createdAt?: string;
  updatedAt?: string;
};
export type DateProfile = DateProfileDoc;

export type DatePreferencesDoc = {
  _id?: ObjectId;
  userId: string;
  genderWanted?: "male" | "female" | "other" | "any";
  ageMin?: number;
  ageMax?: number;
  distanceKm?: number | null;
  countries?: string[];
  directions?: JudaismDirection[];
  advanced?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type MatchFilters = {
  limit?: number;
  cursor?: string; // last _id
  city?: string;
  country?: string;
  direction?: JudaismDirection;
  gender?: Gender;
  looking_for?: Goal;
  minAge?: number;
  maxAge?: number;
  excludeUserId?: string;

  // advanced
  activeOnly?: boolean;
  onlineOnly?: boolean;
  tierIn?: Tier[];
  hasPhoto?: boolean;

  // geo
  centerLng?: number;
  centerLat?: number;
  distanceKm?: number; // מקסימום מרחק
};

export type MatchItem = {
  _id: string;
  userId: string;
  displayName: string | null;
  city: string | null;
  country: string | null;
  age: number | null;
  judaism_direction: JudaismDirection | null;
  shabbat_level: Level | null;
  kashrut_level: Level | null;
  languages: string[];
  gender: Gender | null;
  goals: Goal | null;
  updatedAt: string | null;
  photos: string[];
  avatarUrl: string | null;
  verified: boolean;
  online: boolean;
  subscription: Subscription | null;
  distKm?: number; // אם חושב מרחק
};

/* ========== Internals ========== */
function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

async function ensureIndexes(c: Collection<DateProfileDoc>) {
  const wanted: Array<IndexDescription & { name: string; unique?: boolean }> = [
    { key: { userId: 1 }, name: "userId_unique", unique: true },
    { key: { email: 1 }, name: "email_non_unique" },
    { key: { updatedAt: -1, _id: -1 }, name: "updated_desc_id_desc" },
    {
      key: {
        country: 1,
        city: 1,
        judaism_direction: 1,
        gender: 1,
        goals: 1,
        birthDate: 1,
        updatedAt: -1,
        _id: -1,
      },
      name: "match_filters_v1",
    },
    { key: { "subscription.status": 1 }, name: "sub_status" },
    { key: { "subscription.tier": 1 }, name: "sub_tier" },
    { key: { online: 1 }, name: "online" },
    { key: { avatarUrl: 1 }, name: "avatarUrl" },
    { key: { "photos.0": 1 }, name: "photos0" },
    { key: { loc: "2dsphere" } as any, name: "loc_2dsphere" },
  ];
  const existing = await c
    .listIndexes()
    .toArray()
    .catch(() => []);
  const have = new Set(existing.map((i: any) => String(i.name)));
  for (const idx of wanted) {
    if (have.has(idx.name)) continue;
    try {
      await c.createIndex(idx.key as any, {
        ...(idx.unique ? { unique: true } : {}),
        name: idx.name,
      });
    } catch (e) {
      const msg = String((e as any)?.message || "");
      if (!/already exists|Index with name.*already exists/i.test(msg))
        console.error("[date-repo] createIndex error:", e);
    }
  }
}

async function profilesCol(): Promise<Collection<DateProfileDoc>> {
  const c = (await getDb()).collection<DateProfileDoc>("date_profiles");
  await ensureIndexes(c);
  return c;
}
async function prefsCol(): Promise<Collection<DatePreferencesDoc>> {
  const c = (await getDb()).collection<DatePreferencesDoc>("date_preferences");
  try {
    await c.createIndex({ userId: 1 }, { unique: true, name: "userId_unique" });
  } catch {}
  return c;
}

/* ========== Helpers ========== */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function dateFromAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function normDirection(v?: string | null): JudaismDirection | null {
  if (!v) return null;
  const s = String(v).toLowerCase().trim().replace(/\s+/g, "_");
  if (
    s === "modern_orthodox" ||
    s === "modern-orthodox" ||
    s === "modernorthodox"
  )
    return "modern";
  if (
    s === "chassidic" ||
    s === "chasidic" ||
    s === "chassidut" ||
    s === "chasidut"
  )
    return "chasidic";
  const allowed: JudaismDirection[] = [
    "orthodox",
    "haredi",
    "chasidic",
    "modern",
    "conservative",
    "reform",
    "reconstructionist",
    "secular",
  ];
  return allowed.includes(s as any) ? (s as JudaismDirection) : null;
}
function normLevel(v?: any): Level | null {
  return v === "strict" || v === "partial" || v === "none" ? v : null;
}
function normGender(v?: any): Gender | null {
  return v === "male" || v === "female" || v === "other" ? v : null;
}
function normGoal(v?: any): Goal | null {
  return v === "serious" || v === "marriage" || v === "friendship" ? v : null;
}
function toAge(dob?: string | null): number | null {
  if (!dob) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const now = todayISO();
  let age = parseInt(now.slice(0, 4)) - parseInt(dob.slice(0, 4));
  if (dob.slice(5) > now.slice(5)) age -= 1;
  return age;
}
function clean<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
function normLoc(input: any): GeoPoint | null {
  if (!input) return null;
  if (
    typeof input === "object" &&
    input.type === "Point" &&
    Array.isArray(input.coordinates) &&
    input.coordinates.length === 2
  ) {
    const [lng, lat] = input.coordinates.map(Number);
    if (
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    )
      return { type: "Point", coordinates: [lng, lat] };
  }
  const lat = Number(
    input.lat ??
      input.latitude ??
      input?.coords?.lat ??
      input?.coords?.latitude,
  );
  const lng = Number(
    input.lng ??
      input.lon ??
      input.long ??
      input.longitude ??
      input?.coords?.lng ??
      input?.coords?.longitude,
  );
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  )
    return { type: "Point", coordinates: [lng, lat] };
  return null;
}

/* ========== Public API: Profiles ========== */
export async function getProfile(userId: string): Promise<DateProfile | null> {
  const C = await profilesCol();
  return (await C.findOne({ userId })) || null;
}

export async function upsertProfile(
  userId: string,
  patch: Partial<DateProfileDoc>,
): Promise<DateProfile> {
  const C = await profilesCol();
  const now = new Date().toISOString();

  const rawGoal = (patch as any).goals ?? (patch as any).looking_for;
  const goals: Goal | null = Array.isArray(rawGoal)
    ? normGoal(rawGoal.find((g) => normGoal(g)))
    : normGoal(rawGoal);

  const rawLoc =
    (patch as any).loc ??
    (patch as any).location ??
    (patch as any).coords ??
    (patch as any).geo;
  const loc = normLoc(rawLoc);

  const setDoc = clean<Partial<DateProfileDoc>>({
    email: patch.email ?? null,
    displayName:
      typeof patch.displayName === "string"
        ? patch.displayName.trim().slice(0, 80)
        : undefined,
    birthDate:
      typeof patch.birthDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(patch.birthDate)
        ? patch.birthDate
        : undefined,
    gender: normGender(patch.gender ?? (patch as any).sex),
    country:
      typeof patch.country === "string"
        ? patch.country.trim().slice(0, 60)
        : undefined,
    city:
      typeof patch.city === "string"
        ? patch.city.trim().slice(0, 80)
        : undefined,
    languages: Array.isArray(patch.languages)
      ? patch.languages
          .map((s) =>
            String(s || "")
              .toLowerCase()
              .trim(),
          )
          .filter(Boolean)
          .slice(0, 12)
      : undefined,
    loc: loc !== null ? loc : undefined,
    jewish_by_mother:
      typeof patch.jewish_by_mother === "boolean"
        ? patch.jewish_by_mother
        : undefined,
    conversion:
      typeof patch.conversion === "boolean" ? patch.conversion : undefined,
    judaism_direction: normDirection(
      patch.judaism_direction ?? (patch as any).direction,
    ),
    kashrut_level: normLevel(patch.kashrut_level),
    shabbat_level: normLevel(patch.shabbat_level),
    tzniut_level: normLevel(patch.tzniut_level),
    goals,
    about_me:
      typeof patch.about_me === "string"
        ? patch.about_me.toString().slice(0, 1400)
        : undefined,
    photos: Array.isArray(patch.photos)
      ? patch.photos
          .map((s) => String(s || "").trim())
          .filter(Boolean)
          .slice(0, 12)
      : undefined,
    avatarUrl:
      typeof patch.avatarUrl === "string" ? patch.avatarUrl.trim() : undefined,
    verified: typeof patch.verified === "boolean" ? patch.verified : undefined,
    online: typeof patch.online === "boolean" ? patch.online : undefined,
    subscription: patch.subscription
      ? {
          status:
            patch.subscription.status === "active" ? "active" : "inactive",
          tier: (["free", "plus", "pro", "vip"] as Tier[]).includes(
            (patch.subscription.tier || "free") as Tier,
          )
            ? (patch.subscription.tier as Tier)
            : "free",
          expiresAt:
            typeof patch.subscription.expiresAt === "string"
              ? patch.subscription.expiresAt
              : undefined,
        }
      : undefined,
    updatedAt: now,
  });

  const res = await C.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, createdAt: now }, $set: setDoc },
    { upsert: true, returnDocument: "after" },
  );
  return (res?.value as DateProfile) || (await C.findOne({ userId }))!;
}

/** חיפוש התאמות + אופציה לסינון מרחק (אם center נתון) */
export async function searchMatches(
  filters: MatchFilters,
): Promise<{ items: MatchItem[]; nextCursor: string | null }> {
  const C = await profilesCol();
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);

  const baseQ: any = {};
  if (filters.excludeUserId) baseQ.userId = { $ne: filters.excludeUserId };
  if (filters.city) baseQ.city = filters.city;
  if (filters.country) baseQ.country = filters.country;
  if (filters.direction) baseQ.judaism_direction = filters.direction;
  if (filters.gender) baseQ.gender = filters.gender;
  if (filters.looking_for) baseQ.goals = filters.looking_for;

  if (filters.minAge || filters.maxAge) {
    const minA = Math.max(18, filters.minAge ?? 18);
    const maxA = Math.max(minA, filters.maxAge ?? 99);
    const birthMax = dateFromAge(minA);
    const birthMin = dateFromAge(maxA);
    baseQ.birthDate = {
      $exists: true,
      $ne: null,
      $gte: birthMin,
      $lte: birthMax,
    };
  }

  if (filters.activeOnly) baseQ["subscription.status"] = "active";
  if (filters.onlineOnly) baseQ.online = true;
  if (filters.tierIn?.length)
    baseQ["subscription.tier"] = { $in: filters.tierIn };
  if (filters.hasPhoto)
    baseQ.$or = [
      { "photos.0": { $exists: true } },
      { avatarUrl: { $exists: true, $ne: null } },
    ];

  // Cursor לפי _id
  if (filters.cursor && ObjectId.isValid(filters.cursor))
    baseQ._id = { $lt: new ObjectId(filters.cursor) };

  const hasGeo =
    Number.isFinite(filters.centerLng) &&
    Number.isFinite(filters.centerLat) &&
    Number.isFinite(filters.distanceKm) &&
    filters!.distanceKm! > 0;

  if (hasGeo) {
    // שימוש ב-$geoNear דרך aggregation כדי לחשב מרחק ולמיין לפיו
    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [filters.centerLng!, filters.centerLat!],
          },
          spherical: true,
          key: "loc",
          distanceField: "dist",
          maxDistance: filters.distanceKm! * 1000,
          query: baseQ,
        },
      },
      { $sort: { dist: 1, updatedAt: -1, _id: -1 } },
      { $limit: limit },
      {
        $project: {
          userId: 1,
          displayName: 1,
          city: 1,
          country: 1,
          birthDate: 1,
          judaism_direction: 1,
          shabbat_level: 1,
          kashrut_level: 1,
          languages: 1,
          gender: 1,
          goals: 1,
          updatedAt: 1,
          photos: 1,
          avatarUrl: 1,
          verified: 1,
          online: 1,
          subscription: 1,
          dist: 1,
        },
      },
    ];
    const rows = await C.aggregate(pipeline).toArray();
    const items: MatchItem[] = rows.map((d: any) => ({
      _id: (d._id as ObjectId).toString(),
      userId: d.userId,
      displayName: d.displayName ?? null,
      city: d.city ?? null,
      country: d.country ?? null,
      age: toAge(d.birthDate ?? null),
      judaism_direction: d.judaism_direction ?? null,
      shabbat_level: d.shabbat_level ?? null,
      kashrut_level: d.kashrut_level ?? null,
      languages: Array.isArray(d.languages) ? d.languages : [],
      gender: d.gender ?? null,
      goals: Array.isArray((d as any).goals)
        ? (normGoal(
            (d as any).goals.find((g: any) => normGoal(g)),
          ) as Goal | null)
        : (d.goals ?? null),
      updatedAt: d.updatedAt ?? null,
      photos: Array.isArray(d.photos) ? d.photos : [],
      avatarUrl: d.avatarUrl ?? null,
      verified: !!d.verified,
      online: !!d.online,
      subscription: d.subscription ?? null,
      distKm: typeof d.dist === "number" ? d.dist / 1000 : undefined,
    }));
    const nextCursor = items.length ? items[items.length - 1]._id : null;
    return { items, nextCursor };
  }

  // ללא גיאו — שאילתה רגילה
  const rows = await C.find(baseQ, {
    projection: {
      userId: 1,
      displayName: 1,
      city: 1,
      country: 1,
      birthDate: 1,
      judaism_direction: 1,
      shabbat_level: 1,
      kashrut_level: 1,
      languages: 1,
      gender: 1,
      goals: 1,
      updatedAt: 1,
      photos: 1,
      avatarUrl: 1,
      verified: 1,
      online: 1,
      subscription: 1,
    },
  })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .toArray();

  const items: MatchItem[] = rows.map((d) => ({
    _id: (d._id as ObjectId).toString(),
    userId: d.userId,
    displayName: d.displayName ?? null,
    city: d.city ?? null,
    country: d.country ?? null,
    age: toAge(d.birthDate ?? null),
    judaism_direction: d.judaism_direction ?? null,
    shabbat_level: d.shabbat_level ?? null,
    kashrut_level: d.kashrut_level ?? null,
    languages: Array.isArray(d.languages) ? d.languages : [],
    gender: d.gender ?? null,
    goals: Array.isArray((d as any).goals)
      ? (normGoal(
          (d as any).goals.find((g: any) => normGoal(g)),
        ) as Goal | null)
      : (d.goals ?? null),
    updatedAt: d.updatedAt ?? null,
    photos: Array.isArray(d.photos) ? d.photos : [],
    avatarUrl: d.avatarUrl ?? null,
    verified: !!d.verified,
    online: !!d.online,
    subscription: d.subscription ?? null,
  }));
  const nextCursor = items.length ? items[items.length - 1]._id : null;
  return { items, nextCursor };
}

/* ========== Preferences ========== */
export async function getPreferences(
  userId: string,
): Promise<DatePreferencesDoc | null> {
  const C = await prefsCol();
  return (await C.findOne({ userId })) || null;
}
export async function upsertPreferences(input: Partial<DatePreferencesDoc>) {
  if (!input.userId) throw new Error("userId required");
  const C = await prefsCol();
  const now = new Date().toISOString();
  const directions = Array.isArray(input.directions)
    ? (input.directions
        .map((d) => normDirection(d))
        .filter(Boolean) as JudaismDirection[])
    : undefined;

  const setDoc = clean<Partial<DatePreferencesDoc>>({
    userId: input.userId,
    genderWanted:
      input.genderWanted === "male" ||
      input.genderWanted === "female" ||
      input.genderWanted === "other" ||
      input.genderWanted === "any"
        ? input.genderWanted
        : undefined,
    ageMin:
      typeof input.ageMin === "number"
        ? Math.max(18, Math.min(100, input.ageMin))
        : undefined,
    ageMax:
      typeof input.ageMax === "number"
        ? Math.max(18, Math.min(100, input.ageMax))
        : undefined,
    distanceKm: typeof input.distanceKm === "number" ? input.distanceKm : null,
    countries: Array.isArray(input.countries)
      ? input.countries.map((s) => String(s || "").trim()).filter(Boolean)
      : undefined,
    directions,
    advanced:
      input.advanced &&
      typeof input.advanced === "object" &&
      !Array.isArray(input.advanced)
        ? input.advanced
        : undefined,
    updatedAt: now,
  });

  await C.updateOne(
    { userId: input.userId },
    { $setOnInsert: { userId: input.userId, createdAt: now }, $set: setDoc },
    { upsert: true },
  );
  return C.findOne({ userId: input.userId });
}

export async function getIdentity(..._args: any[]): Promise<any | null> {
  return null;
}

export async function upsertIdentity(..._args: any[]): Promise<any> {
  return { ok: true };
}

export async function addSwipe(..._args: any[]): Promise<any> {
  return { ok: true };
}
