
import { MongoClient, type Db, type Collection } from "mongodb";

/* ---------- Config ---------- */
export const DEFAULT_DB = process.env.MONGODB_DB || "maty-music";
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI (בדוק .env.local)");
}

/* ---------- Globals (HMR-safe) ---------- */
declare global {
  // eslint-disable-next-line no-var
  var __mongo_client__: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __mongo_connecting__: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __mongo_db_cache__: Record<string, Db> | undefined;
  // eslint-disable-next-line no-var
  var __mongo_init_done__: boolean | undefined;
}

/* ---------- Client ---------- */
export async function getClient(): Promise<MongoClient> {
  if (global.__mongo_client__) return global.__mongo_client__;

  if (!global.__mongo_connecting__) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 20, // טיפה יותר גמיש
      retryWrites: true,
      retryReads: true,
    });

    global.__mongo_connecting__ = client.connect().then((c) => {
      global.__mongo_client__ = c;
      return c;
    });
  }

  return global.__mongo_connecting__!;
}

/* ---------- DB ---------- */
export async function getDb(dbName = DEFAULT_DB): Promise<Db> {
  const client = await getClient();

  global.__mongo_db_cache__ ||= Object.create(null);
  const cache = global.__mongo_db_cache__!;
  if (cache[dbName]) return cache[dbName];

  const db = client.db(dbName);

  // יצירת אינדקסים אוטומטית בפעם הראשונה
  if (!global.__mongo_init_done__) {
    global.__mongo_init_done__ = true;
    try {
      const songs = db.collection("songs");
      await Promise.all([
        songs.createIndex(
          { title_he_norm: "text", keywords: "text" },
          { name: "text_he" }
        ),
        songs.createIndex({ slug: 1 }, { unique: true, name: "slug_unique" }),
        songs.createIndex({ genre: 1 }, { name: "genre" }),
      ]);
      console.log("[mongo] ✅ ensured indexes for songs");
    } catch (err) {
      console.warn("[mongo] ⚠️ index creation failed:", err);
    }
  }

  cache[dbName] = db;
  return db;
}

/* ---------- Collection Helper ---------- */
export async function getCollection<T = unknown>(
  name: string,
  dbName = DEFAULT_DB
): Promise<Collection<T>> {
  const db = await getDb(dbName);
  return db.collection<T>(name);
}

/* ---------- Compatibility (clientPromise) ---------- */
export const clientPromise: Promise<MongoClient> = getClient();
export default clientPromise;
