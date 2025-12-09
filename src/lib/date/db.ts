
// src/lib/date/db.ts
import clientPromise from "@/lib/mongodb";
import type { Db, Collection, IndexDescription } from "mongodb";

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

/** ודא שקולקציה קיימת (אם לא — צור אותה). אידמפוטנטי. */
async function ensureCollection(db: Db, name: string) {
  try {
    const exists = await db.listCollections({ name }).toArray();
    if (!exists.length) {
      await db.createCollection(name);
    }
  } catch (e: any) {
    // NamespaceExists (כבר קיימת) — להתעלם
    if (e?.code !== 48 && e?.codeName !== "NamespaceExists") throw e;
  }
}

/** השוואת מפרט אינדקס לפי סדר השדות והערכים (1/-1) */
function sameIndexSpec(a: Record<string, any>, b: Record<string, any>) {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    const k = ak[i];
    if (bk[i] !== k) return false;
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/** יצירת אינדקס אידמפוטנטית: אם קיים אינדקס עם אותו key (גם בשם אחר) – דלג */
async function ensureIndex(
  col: Collection,
  keys: Record<string, 1 | -1>,
  options: Omit<IndexDescription, "key"> = {}
) {
  let current: any[] = [];
  try {
    current = await col.listIndexes().toArray();
  } catch (e: any) {
    // NamespaceNotFound — הקולקציה עדיין לא קיימת; יצירת אינדקס תיצור אותה אוטומטית
    if (e?.code !== 26 && e?.codeName !== "NamespaceNotFound") throw e;
  }

  const exists = current.find(
    (ix: any) =>
      ix?.key &&
      sameIndexSpec(ix.key, keys) &&
      !!ix.unique === !!(options as any).unique
  );
  if (exists) return exists.name;

  try {
    return await col.createIndex(keys, options);
  } catch (e: any) {
    const msg = e?.message || "";
    // כבר קיים או קונפליקט מאפיינים — מבחינתנו תקין
    if (
      msg.includes("already exists") ||
      e?.code === 85 || // IndexOptionsConflict
      e?.code === 86 // IndexKeySpecsConflict
    ) {
      return;
    }
    throw e;
  }
}

let _ixReady: Promise<void> | null = null;
/** נוודא אינדקסים פעם אחת (עם הגנה לריבוי קריאות) */
export async function ensureIndexes() {
  if (_ixReady) return _ixReady;

  _ixReady = (async () => {
    const db = await getDb();

    // ודא שהקולקציות קיימות לפני listIndexes()
    const NAMES = [
      "date_profiles",
      "date_preferences",
      "date_photos",
      "date_subscriptions",
    ] as const;
    await Promise.all(NAMES.map((n) => ensureCollection(db, n)));

    const profiles = db.collection("date_profiles");
    const preferences = db.collection("date_preferences");
    const photos = db.collection("date_photos");
    const subscriptions = db.collection("date_subscriptions");

    await Promise.all([
      // date_profiles
      ensureIndex(profiles, { userId: 1 }),
      ensureIndex(profiles, { email: 1 }),
      ensureIndex(profiles, { updatedAt: -1, _id: -1 }),
      ensureIndex(profiles, { gender: 1 }),
      ensureIndex(profiles, { judaism_direction: 1 }),
      ensureIndex(profiles, { country: 1 }),

      // date_preferences
      ensureIndex(preferences, { userId: 1 }),

      // date_photos
      ensureIndex(photos, { userId: 1, createdAt: -1 }),

      // date_subscriptions
      ensureIndex(subscriptions, { userId: 1 }),
      ensureIndex(subscriptions, { status: 1 }),
      ensureIndex(subscriptions, { tier: 1 }),
    ]);
  })().catch((e) => {
    _ixReady = null; // לאפשר ניסיון חוזר אם היה כשל
    throw e;
  });

  return _ixReady;
}

export async function dateCollections() {
  const db = await getDb();
  await ensureIndexes(); // בטוח לקריאה בכל עמוד/SSR
  return {
    db,
    profiles: db.collection("date_profiles"),
    preferences: db.collection("date_preferences"),
    photos: db.collection("date_photos"),
    subscriptions: db.collection("date_subscriptions"),
  };
}
