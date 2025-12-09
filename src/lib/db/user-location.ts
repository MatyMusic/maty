// src/lib/db/user-location.ts
import clientPromise from "@/lib/mongodb";
import type { Db, Collection, IndexDescription } from "mongodb";

type UserLoc = {
  userId: string;
  loc?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  updatedAt: Date;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

async function col(): Promise<Collection<UserLoc>> {
  const db = await getDb();
  const C = db.collection<UserLoc>("user_locations");

  // אינדקסים: 2dsphere + TTL (ניקוי אחרי 3 דק')
  const wanted: Array<
    IndexDescription & { name: string; expireAfterSeconds?: number }
  > = [
    { key: { loc: "2dsphere" } as any, name: "loc_2dsphere" },
    {
      key: { updatedAt: 1 },
      name: "updatedAt_ttl_3m",
      expireAfterSeconds: 180,
    },
    { key: { userId: 1 }, name: "userId_1" },
  ];
  const existing = await C.listIndexes()
    .toArray()
    .catch(() => []);
  const have = new Set(existing.map((i: any) => String(i.name)));
  for (const idx of wanted) {
    if (have.has(idx.name)) continue;
    try {
      await C.createIndex(idx.key as any, {
        name: idx.name,
        ...(idx.expireAfterSeconds
          ? { expireAfterSeconds: idx.expireAfterSeconds }
          : {}),
      });
    } catch {}
  }

  return C;
}

export async function upsertUserLocation(
  userId: string,
  lat: number,
  lng: number,
) {
  if (!userId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const C = await col();
  const now = new Date();
  await C.updateOne(
    { userId },
    {
      $set: {
        userId,
        loc: { type: "Point", coordinates: [lng, lat] },
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

export async function nearbyUsers(lng: number, lat: number, km: number) {
  const C = await col();
  const rows = await C.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "dist",
        key: "loc",
        spherical: true,
        maxDistance: km * 1000,
      },
    },
    { $limit: 50 },
    { $project: { _id: 0, userId: 1, dist: 1 } },
  ]).toArray();
  return rows as Array<{ userId: string; dist: number }>;
}

export async function nearbyUsersByUser(userId: string, km: number) {
  const C = await col();
  const me = await C.findOne({ userId }, { projection: { loc: 1 } });
  if (!me?.loc) return [];
  const [lng, lat] = me.loc.coordinates;
  return nearbyUsers(lng, lat, km);
}

export async function onlineCount() {
  const C = await col();
  return C.countDocuments(); // בזכות TTL זה "חי"
}
