import { MongoClient, Db, Collection } from "mongodb";

let _client: MongoClient | null = null;
let _db: Db | null = null;

export async function getNigunimDb(): Promise<Db> {
  if (_db) return _db;

  const uri = process.env.MONGODB_URI_NIGUNIM || process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI_NIGUNIM (or MONGODB_URI)");

  const dbName =
    process.env.MONGODB_DB_NIGUNIM || process.env.MONGODB_DB || "maty-nigunim";

  _client = new MongoClient(uri);
  await _client.connect();
  _db = _client.db(dbName);

  console.log("[mongodb] connected (nigunim):", dbName);
  return _db;
}

export async function getNigunimCollection<T = any>(
  name: string
): Promise<Collection<T>> {
  const db = await getNigunimDb();
  return db.collection<T>(name);
}
