// src/lib/mongo-nigunim.ts
import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __MONGO_NIGUNIM__: Promise<MongoClient> | undefined;
}

const uri = (
  process.env.MONGODB_URI_NIGUNIM ||
  process.env.MONGODB_URI ||
  ""
).trim();
if (!uri) throw new Error("Missing MONGODB_URI_NIGUNIM (or MONGODB_URI)");

const clientPromise =
  global.__MONGO_NIGUNIM__ ||
  new MongoClient(uri).connect().then((c) => {
    console.log(`[mongodb] connected (nigunim) → ${c.db().databaseName}`);
    return c;
  });

global.__MONGO_NIGUNIM__ = clientPromise;
export default clientPromise;

const NIG_DB = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";
export async function getNigunimDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(NIG_DB);
}
