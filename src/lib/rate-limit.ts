import clientPromise from "@/lib/mongodb";
import type { WithId } from "mongodb";

type Hit = { _id?: any; key: string; ts: Date; cnt: number };
const COLL = "rate_hits";

export async function rateCheck(
  key: string,
  windowSec: number,
  maxReq: number
) {
  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const c = db.collection<Hit>(COLL);

  // TTL על השדה ts
  await c.createIndex(
    { ts: 1 },
    { expireAfterSeconds: windowSec, name: "ttl_ts" }
  );
  await c.createIndex({ key: 1 }, { unique: true, name: "key_unique" });

  const now = new Date();
  const res = await c.findOneAndUpdate(
    { key },
    { $setOnInsert: { ts: now }, $inc: { cnt: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  const cnt = res.value?.cnt ?? 1;
  return cnt <= maxReq;
}

export function rlKeyFromReq(opts: {
  path: string;
  userId?: string;
  ip?: string;
}) {
  const base = `${opts.path}|u:${opts.userId || "anon"}|ip:${opts.ip || "0"}`;
  return base;
}



