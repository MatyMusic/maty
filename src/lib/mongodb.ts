
// src/lib/mongodb.ts
import {
  MongoClient,
  ServerApiVersion,
  type Db,
  type Collection,
} from "mongodb";

export const DEFAULT_DB = process.env.MONGODB_DB || "maty-music";
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("Missing MONGODB_URI (בדוק .env.local)");

declare global {
  // eslint-disable-next-line no-var
  var __mongo_client__: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __mongo_connecting__: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __mongo_db_cache__: Record<string, Db> | undefined;
}

const OPTIONS = {
  maxPoolSize: 10,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
} as const;

export async function getClient(): Promise<MongoClient> {
  if (global.__mongo_client__) return global.__mongo_client__;
  if (!global.__mongo_connecting__) {
    const client = new MongoClient(MONGODB_URI, OPTIONS);
    global.__mongo_connecting__ = client
      .connect()
      .then((c) => {
        global.__mongo_client__ = c;
        return c;
      })
      .catch((err) => {
        // חשוב: לא להשאיר הבטחה כושלת בקאש בזמן dev/HMR
        global.__mongo_connecting__ = undefined;
        throw err;
      });
  }
  return global.__mongo_connecting__!;
}

export async function getDb(dbName = DEFAULT_DB): Promise<Db> {
  const client = await getClient();
  global.__mongo_db_cache__ ||= Object.create(null);
  const cache = global.__mongo_db_cache__!;
  if (cache[dbName]) return cache[dbName];
  const db = client.db(dbName);
  cache[dbName] = db;
  return db;
}

export async function getCollection<T = unknown>(
  name: string,
  dbName = DEFAULT_DB
): Promise<Collection<T>> {
  const db = await getDb(dbName);
  return db.collection<T>(name);
}

// תאימות: כמו clientPromise
export const clientPromise: Promise<MongoClient> = getClient();
export default clientPromise;
