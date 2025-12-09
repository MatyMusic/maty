// src/lib/db/analytics.ts
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type TrackEvent = {
  kind: "pageview" | "search" | "like" | "comment" | "date_cta_click" | string;
  page?: string; // למשל: "/club"
  meta?: Record<string, any>;
};

export async function ensureAnalyticsIndexes() {
  const db = await getDb();
  const ev = db.collection("events");
  const pr = db.collection("presence");

  await ev.createIndex({ ts: -1 });
  await ev.createIndex({ kind: 1, ts: -1 });

  // TTL לנוכחות: 3 דקות
  try {
    await pr.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 180 });
  } catch {}
  await pr.createIndex({ path: 1, lastSeen: -1 });
  await pr.createIndex({ uid: 1 }, { unique: true });
}

// נוכחות: upsert לפי uid (או userId אם קיים)
export async function updatePresence(input: {
  uid: string; // מזהה אנונימי (מה-localStorage) או userId
  userId?: string | null; // אם יש session
  path?: string | null; // דף נוכחי
  tz?: string | null; // אזור זמן
}) {
  const db = await getDb();
  const pr = db.collection("presence");
  const now = new Date();

  const doc = {
    uid: input.uid,
    userId: input.userId ?? null,
    path: input.path || null,
    tz: input.tz || null,
    lastSeen: now,
  };

  await pr.updateOne({ uid: input.uid }, { $set: doc }, { upsert: true });
}

export async function recordEvent(input: {
  anonId: string;
  sessionId: string;
  tz?: string | null;
  userId?: string | null;
  ev: TrackEvent;
}) {
  const db = await getDb();
  const evCol = db.collection("events");
  const doc = {
    _id: new ObjectId(),
    ts: new Date(),
    anonId: input.anonId,
    sessionId: input.sessionId,
    tz: input.tz || null,
    userId: input.userId || null,
    kind: input.ev.kind,
    page: input.ev.page || null,
    meta: input.ev.meta || {},
  };
  await evCol.insertOne(doc);
}

export async function getOnlineCount() {
  const db = await getDb();
  const pr = db.collection("presence");
  return pr.countDocuments();
}

export async function getOnlinePeers(opts?: { path?: string; limit?: number }) {
  const db = await getDb();
  const pr = db.collection("presence");
  const q: any = {};
  if (opts?.path) q.path = opts.path;
  const cur = pr
    .find(q)
    .sort({ lastSeen: -1 })
    .limit(Math.min(50, opts?.limit ?? 12));
  const items = await cur.toArray();
  return items.map((x) => ({
    uid: x.uid,
    path: x.path || null,
    tz: x.tz || null,
    userId: x.userId || null,
    lastSeen: x.lastSeen,
  }));
}
