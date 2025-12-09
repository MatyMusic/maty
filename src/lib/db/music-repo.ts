// src/lib/db/music-repo.ts
import clientPromise from "@/lib/mongodb";
import type { Collection, Db, IndexDescription } from "mongodb";

export type MusicEvent = {
  _id?: any;
  userId: string;
  artist?: string | null;
  genre?: string | null; // "chabad" | "mizrahi" | ...
  playedAt: string; // ISO
  weight?: number; // אופציונלי (משך/דילוג)
};

export type MusicVectorDoc = {
  _id?: any;
  userId: string;
  genres: Record<string, number>;
  topArtists: string[];
  lastPlaysAt?: string[]; // אחרונות לדיוק טריות
  updatedAt: string;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

async function eventsCol(): Promise<Collection<MusicEvent>> {
  const c = (await getDb()).collection<MusicEvent>("music_events");
  try {
    await c.createIndex({ userId: 1, playedAt: -1 }, { name: "user_time" });
    await c.createIndex({ genre: 1 }, { name: "genre" });
    await c.createIndex({ artist: 1 }, { name: "artist" });
  } catch {}
  return c;
}

async function vectorsCol(): Promise<Collection<MusicVectorDoc>> {
  const c = (await getDb()).collection<MusicVectorDoc>("music_vectors");
  try {
    await c.createIndex({ userId: 1 }, { unique: true, name: "user_unique" });
    await c.createIndex({ updatedAt: -1 }, { name: "updatedAt" });
  } catch {}
  return c;
}

/** הכנסה של אירוע האזנה */
export async function logMusicEvent(
  ev: Omit<MusicEvent, "playedAt"> & { playedAt?: string }
) {
  const C = await eventsCol();
  const now = new Date().toISOString();
  const doc: MusicEvent = {
    userId: ev.userId,
    artist: ev.artist?.trim() || null,
    genre: ev.genre?.trim()?.toLowerCase() || null,
    playedAt: ev.playedAt || now,
    weight: typeof ev.weight === "number" ? Math.max(0, ev.weight) : 1,
  };
  await C.insertOne(doc);
}

/** בניית וקטור משתמש (אפשר להריץ בקרון, או on-demand עם throttle) */
export async function rebuildVector(userId: string): Promise<MusicVectorDoc> {
  const db = await getDb();
  const E = await eventsCol();
  const V = await vectorsCol();

  // קח 3,000 אירועים אחרונים לכל היותר לצמצום
  const events = await E.find({ userId })
    .sort({ playedAt: -1 })
    .limit(3000)
    .toArray();

  const genres: Record<string, number> = {};
  const artistsCount: Record<string, number> = {};
  const lastPlays: string[] = [];

  for (const ev of events) {
    const w = Math.max(0.5, Math.min(5, ev.weight || 1));
    if (ev.genre) genres[ev.genre] = (genres[ev.genre] || 0) + w;
    if (ev.artist) artistsCount[ev.artist] = (artistsCount[ev.artist] || 0) + w;
    if (lastPlays.length < 10) lastPlays.push(ev.playedAt);
  }

  // נרמול ז'אנרים ל־0..1
  const maxG = Math.max(1, ...Object.values(genres));
  const normGenres: Record<string, number> = {};
  for (const k of Object.keys(genres)) normGenres[k] = genres[k] / maxG;

  // אמנים מובילים
  const topArtists = Object.entries(artistsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name]) => name);

  const now = new Date().toISOString();
  const vec: MusicVectorDoc = {
    userId,
    genres: normGenres,
    topArtists,
    lastPlaysAt: lastPlays,
    updatedAt: now,
  };
  await V.updateOne({ userId }, { $set: vec }, { upsert: true });
  return vec;
}

/** שליפת וקטור; אם חסר – ניסיון לבנות אותו על בסיס אירועים */
export async function getVector(
  userId: string
): Promise<MusicVectorDoc | null> {
  const V = await vectorsCol();
  let vec = await V.findOne({ userId });
  if (vec) return vec;
  // אם אין – ננסה לבנות (ייתכן ועדיין אין אירועים)
  try {
    const built = await rebuildVector(userId);
    return built;
  } catch {
    return null;
  }
}
