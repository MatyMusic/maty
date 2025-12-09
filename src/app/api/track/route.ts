// src/app/api/track/route.ts
import { MongoClient, Db } from "mongodb";

export const runtime = "nodejs"; // יציב ל-Mongo
export const dynamic = "force-dynamic";

let _client: MongoClient | null = null;
let _db: Db | null = null;
let _indexesReady = false;

async function getDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (_db) return _db;
  _client = new MongoClient(uri);
  await _client.connect();
  _db = _client.db(process.env.MONGODB_DB || undefined);
  return _db;
}

async function ensureIndexes(db: Db) {
  if (_indexesReady) return;
  _indexesReady = true;

  const events = db.collection("events");
  const presence = db.collection("presence");

  await events.createIndex({ ts: -1 });
  await events.createIndex({ kind: 1, ts: -1 });

  // TTL לנוכחות: 180 שניות
  try {
    await presence.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 180 });
  } catch {}
  await presence.createIndex({ uid: 1 }, { unique: true });
  await presence.createIndex({ path: 1, lastSeen: -1 });
}

type IncomingEvent = {
  kind: string; // "pageview" | "search" | ...
  page?: string; // לדוגמה "/club"
  meta?: Record<string, any>; // כל מידע נוסף
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}) as any);
    const ev = (body?.ev || {}) as IncomingEvent;
    const anonId = String(body?.anonId || "");
    const sessionId = String(body?.sessionId || "");
    const tz = (body?.tz as string) || null;
    const userId = (body?.userId as string) || null; // אופציונלי אם תשלח מהלקוח

    if (!anonId || !sessionId) {
      return Response.json(
        { ok: false, error: "missing_ids" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // אין DB? לא חוסמים את הלקוח – רק לוג ו-204
    if (!db) {
      console.log("[track]", { anonId, sessionId, tz, ev, userId });
      return new Response(null, { status: 204 });
    }

    await ensureIndexes(db);

    const now = new Date();
    const presence = db.collection("presence");
    const events = db.collection("events");

    // Presence (uid = userId אם יש, אחרת anonId)
    const uid = userId || anonId;
    await presence.updateOne(
      { uid },
      {
        $set: {
          uid,
          userId: userId || null,
          path: ev?.page || null,
          tz: tz || null,
          lastSeen: now,
        },
      },
      { upsert: true },
    );

    // אירוע (אם סופק kind)
    if (ev?.kind) {
      await events.insertOne({
        ts: now,
        anonId,
        sessionId,
        tz: tz || null,
        userId: userId || null,
        kind: ev.kind,
        page: ev.page || null,
        meta: ev.meta || {},
      });
    }

    // מונה אונליין (כל מי שלא פג TTL)
    const online = await presence.countDocuments();

    return Response.json({ ok: true, online }, { status: 200 });
  } catch {
    // גם במקרה של שגיאה – לא מפילים את הלקוח
    return new Response(null, { status: 204 });
  }
}

export function GET() {
  return new Response("ok", { status: 200 });
}
