// src/lib/db/features.ts
import clientPromise from "@/lib/mongodb";
import type { Db, Collection } from "mongodb";

export type FeaturesDoc = {
  _id?: any;
  key: "presence";
  presence: {
    enabled: boolean;
    // אופציונלי: רמת מנוי מינימלית להפעלה בעתיד
    requiredTier?: "free" | "plus" | "pro" | "vip";
    updatedAt: string; // ISO
    updatedBy?: string | null; // email/userId
  };
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}
async function col(): Promise<Collection<FeaturesDoc>> {
  const db = await getDb();
  const C = db.collection<FeaturesDoc>("features");
  try {
    await C.createIndex({ key: 1 }, { unique: true, name: "key_unique" });
  } catch {}
  return C;
}

export async function getPresenceFeature(): Promise<FeaturesDoc["presence"]> {
  const C = await col();
  const row = await C.findOne({ key: "presence" });
  return (
    row?.presence ?? { enabled: true, updatedAt: new Date().toISOString() }
  );
}

export async function setPresenceFeature(
  next: Partial<FeaturesDoc["presence"]>,
  who?: string | null,
) {
  const C = await col();
  const now = new Date().toISOString();
  const current = await getPresenceFeature();
  const merged: FeaturesDoc["presence"] = {
    enabled:
      typeof next.enabled === "boolean"
        ? next.enabled
        : (current.enabled ?? true),
    requiredTier: next.requiredTier ?? current.requiredTier,
    updatedAt: now,
    updatedBy: who ?? null,
  };
  await C.updateOne(
    { key: "presence" },
    { $set: { key: "presence", presence: merged } },
    { upsert: true },
  );
  return merged;
}
