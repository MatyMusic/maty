// src/lib/db/date-chat-repo.ts
// ----------------------------------------------------------
// צ'אט להודעות בין צדדים שהתאימו (match)
// קולקשן: date_messages
// ----------------------------------------------------------

import clientPromise from "@/lib/mongodb";
import {
  ObjectId,
  ObjectId as OID,
  type Collection,
  type Db,
  type IndexDescription,
} from "mongodb";

/* ================== Types ================== */

export type ChatMessageDoc = {
  _id?: ObjectId;
  matchId: string; // מזהה מאץ' (למשל ה-_id של date_matches כ-string)
  fromUserId: string; // מי שלח
  text: string; // תוכן ההודעה
  createdAt: string; // תאריך יצירה (ISO)
  // בהמשך אפשר להרחיב: deliveredAt/readAt/isSystem וכו'
};

/* ================== DB helpers ================== */

const DB_NAME = process.env.MONGODB_DB || "maty-music";

function dbName() {
  return DB_NAME;
}

async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

/* ================== Indexes ================== */

async function ensureIndexes(c: Collection<ChatMessageDoc>): Promise<void> {
  const wanted: Array<IndexDescription & { name: string }> = [
    // כל ההודעות של מאץ' לפי זמן
    { key: { matchId: 1, createdAt: 1, _id: 1 }, name: "match_created_id_asc" },
    // לשליפה מהירה לפי matchId ו־_id (ל-paging)
    { key: { matchId: 1, _id: 1 }, name: "match__id_asc" },
    // מי אני (useful לאנליטיקה/אדמין)
    { key: { fromUserId: 1, createdAt: -1 }, name: "fromUser_created_desc" },
  ];

  const existing = await c
    .listIndexes()
    .toArray()
    .catch(() => []);
  const have = new Set(existing.map((i: any) => String(i.name)));

  for (const idx of wanted) {
    if (have.has(idx.name)) continue;
    try {
      await c.createIndex(idx.key as any, { name: idx.name });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (!/already exists/i.test(msg)) {
        console.error("[date-chat-repo] createIndex error:", e);
      }
    }
  }
}

/* ================== Collection accessor ================== */

async function messagesCol(): Promise<Collection<ChatMessageDoc>> {
  const db = await getDb();
  const c = db.collection<ChatMessageDoc>("date_messages");
  await ensureIndexes(c);
  return c;
}

/* ================== Utils ================== */

function clampLimit(n: number | undefined, def = 40): number {
  const v = Number.isFinite(n as any) ? Number(n) : def;
  return Math.min(Math.max(v, 1), 200);
}

export function isValidObjectIdLike(v: string | null | undefined): boolean {
  return !!v && /^[0-9a-f]{24}$/i.test(String(v));
}

function nowISO(): string {
  return new Date().toISOString();
}

/* ================== Public API ================== */

/**
 * שליפת הודעות עבור matchId מסוים.
 * אפשר להשתמש ב-since כ־cursor:
 *  - אם נראה כמו ObjectId → מחזיר הודעות חדשות יותר ממנו
 *  - אחרת נתייחס אליו כ־createdAt ISO ונמשוך הודעות עם createdAt > since
 */
export async function listMessages(opts: {
  matchId: string;
  limit?: number;
  since?: string | null;
}) {
  const matchId = String(opts.matchId || "").trim();
  if (!matchId) {
    return { rows: [] as ChatMessageDoc[], nextCursor: null as string | null };
  }

  const limit = clampLimit(opts.limit);
  const since = opts.since || null;

  const C = await messagesCol();
  const q: any = { matchId };

  // cursor לפי _id או createdAt
  if (since && isValidObjectIdLike(since)) {
    // הודעות חדשות יותר מאותו _id
    q._id = { $gt: new OID(since) };
  } else if (since) {
    // cursor לפי תאריך
    q.createdAt = { $gt: since };
  }

  const rows = await C.find(q)
    .sort({ createdAt: 1, _id: 1 })
    .limit(limit)
    .toArray();

  const nextCursor = rows.length ? String(rows[rows.length - 1]._id) : null;

  return { rows, nextCursor };
}

/**
 * הוספת הודעה חדשה לצ'אט של matchId.
 * זורק שגיאה אם הטקסט ריק אחרי trim.
 */
export async function appendMessage(input: {
  matchId: string;
  fromUserId: string;
  text: string;
}) {
  const matchId = String(input.matchId || "").trim();
  const fromUserId = String(input.fromUserId || "").trim();
  const textRaw = String(input.text || "");
  const text = textRaw.trim();

  if (!matchId) {
    throw new Error("matchId is required");
  }
  if (!fromUserId) {
    throw new Error("fromUserId is required");
  }
  if (!text) {
    throw new Error("text is empty");
  }

  const C = await messagesCol();

  const doc: ChatMessageDoc = {
    matchId,
    fromUserId,
    text: text.slice(0, 4000), // תקרת אורך
    createdAt: nowISO(),
  };

  const res = await C.insertOne(doc);
  doc._id = res.insertedId;

  return doc;
}

/**
 * עזר לאדמין: שליפת הודעות אחרונות בלי פילטר של matchId.
 * שימושי לדשבורד / מוניטורינג.
 */
export async function listRecentMessagesForAdmin(opts?: { limit?: number }) {
  const limit = clampLimit(opts?.limit, 100);
  const C = await messagesCol();

  const rows = await C.find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();

  return rows;
}
