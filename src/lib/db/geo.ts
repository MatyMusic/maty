import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";

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

export async function upsertUserLocation(
  userId: string,
  lat: number,
  lng: number,
) {
  const db = await getDb();
  const C = db.collection<UserLoc>("user_locations");
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
  const db = await getDb();
  const C = db.collection<UserLoc>("user_locations");
  const meters = km * 1000;
  const rows = await C.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "dist",
        spherical: true,
        maxDistance: meters,
        key: "loc",
      },
    },
    { $limit: 50 },
    { $project: { _id: 0, userId: 1, dist: 1 } },
  ]).toArray();
  return rows; // [{userId, dist}]
}
