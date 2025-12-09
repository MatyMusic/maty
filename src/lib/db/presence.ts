import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";

type PresenceDoc = {
  userId: string;
  lastActive: Date;
  status?: "online" | "away";
  device?: "web" | "mobile" | "other";
  updatedAt: Date;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

export async function touchPresence(
  userId: string,
  device: PresenceDoc["device"] = "web",
) {
  const db = await getDb();
  const C = db.collection<PresenceDoc>("user_presence");
  const now = new Date();
  await C.updateOne(
    { userId },
    {
      $set: { userId, device, updatedAt: now },
      $setOnInsert: { lastActive: now },
    },
    { upsert: true },
  );
  // עדכן lastActive כל ~60ש׳ (מניעת כתיבה מוגזמת)
  await C.updateOne(
    { userId, lastActive: { $lt: new Date(Date.now() - 55_000) } },
    { $set: { lastActive: now } },
  );
}

export async function listOnline(sinceMs = 2 * 60 * 1000) {
  const db = await getDb();
  const C = db.collection<PresenceDoc>("user_presence");
  const since = new Date(Date.now() - sinceMs);
  const rows = await C.find({ lastActive: { $gte: since } })
    .project({ _id: 0, userId: 1, lastActive: 1, device: 1 })
    .sort({ lastActive: -1 })
    .limit(100)
    .toArray();
  return rows;
}

export async function usersOnlineMap(
  userIds: string[],
  sinceMs = 2 * 60 * 1000,
) {
  const db = await getDb();
  const C = db.collection<PresenceDoc>("user_presence");
  const since = new Date(Date.now() - sinceMs);
  const rows = await C.find({
    userId: { $in: userIds },
    lastActive: { $gte: since },
  })
    .project({ _id: 0, userId: 1, lastActive: 1, device: 1 })
    .toArray();
  const map = new Map<string, { lastActive: Date; device?: string }>();
  rows.forEach((r) =>
    map.set(r.userId, { lastActive: r.lastActive, device: r.device }),
  );
  return map;
}
