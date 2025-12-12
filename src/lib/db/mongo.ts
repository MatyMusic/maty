// src/lib/db/mongo.ts
// שורה זו מוחקים / משביתים בסקריפטים:
// import "server-only";

import type { Collection, Db } from "mongodb";
// חשוב: נתיב יחסי, בלי "@/..."
import clientPromise from "../mongodb";

const DEFAULT_DB = process.env.MONGODB_DB || "maty-music";
const _dbCache: Record<string, Db> = Object.create(null);

export async function getDb(dbName = DEFAULT_DB): Promise<Db> {
  const client = await clientPromise;
  if (!_dbCache[dbName]) _dbCache[dbName] = client.db(dbName);
  return _dbCache[dbName];
}

export async function getCollection<T = any>(
  name: string,
  dbName = DEFAULT_DB,
): Promise<Collection<T>> {
  const db = await getDb(dbName);
  return db.collection<T>(name);
}

export default getDb;
