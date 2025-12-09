// src/lib/db/date-like.ts
// ------------------------------------------------------
// ניהול לייקים / קריצות + מאצ'ים ל-MATY-DATE
// ------------------------------------------------------

import { getCollection } from "@/lib/mongodb";
import { ObjectId, type Collection, type IndexDescription } from "mongodb";

/* ======================= Types ======================= */

/** מסמך לייק/קריצה חד־כיווני */
export type DateLikeDoc = {
  _id?: ObjectId;
  from: string; // actor userId
  to: string; // target userId
  createdAt: string; // ISO
};

/** מסמך מאץ' הדדי בין שני משתמשים */
export type DateMatchDoc = {
  _id?: ObjectId;
  a: string; // userId קטן לוגית (min)
  b: string; // userId גדול לוגית (max)
  createdAt: string; // ISO
  lastEventAt?: string; // ISO
};

/* ======================= Indexes ======================= */

async function ensureLikesIndexes(c: Collection<DateLikeDoc>) {
  const wanted: Array<IndexDescription & { name: string; unique?: boolean }> = [
    // לייק אחד חד־ערכי לכל זוג from/to
    { key: { from: 1, to: 1 }, name: "from_to_unique", unique: true },
    // מי אני עשיתי לו לייק, לפי זמן
    { key: { from: 1, createdAt: -1 }, name: "from_createdAt_desc" },
    // מי עשה לי לייק, לפי זמן
    { key: { to: 1, createdAt: -1 }, name: "to_createdAt_desc" },
  ];

  const existing = await c
    .listIndexes()
    .toArray()
    .catch(() => []);

  const have = new Set(existing.map((i: any) => String(i.name)));

  for (const idx of wanted) {
    if (have.has(idx.name)) continue;
    try {
      await c.createIndex(idx.key as any, {
        ...(idx.unique ? { unique: true } : {}),
        name: idx.name,
      });
    } catch {
      // אם האינדקס כבר קיים / שגיאה זמנית – לא מפיל את האפליקציה
    }
  }
}

async function ensureMatchesIndexes(c: Collection<DateMatchDoc>) {
  const wanted: Array<IndexDescription & { name: string; unique?: boolean }> = [
    // מאץ' אחד בלבד לכל זוג a/b
    { key: { a: 1, b: 1 }, name: "a_b_unique", unique: true },
    // מאצ'ים לפי משתתף וזמן
    { key: { a: 1, createdAt: -1 }, name: "a_createdAt_desc" },
    { key: { b: 1, createdAt: -1 }, name: "b_createdAt_desc" },
    // מיון לפי activity אחרונה (לצ'אט וכו')
    { key: { lastEventAt: -1 }, name: "lastEventAt_desc" },
  ];

  const existing = await c
    .listIndexes()
    .toArray()
    .catch(() => []);
  const have = new Set(existing.map((i: any) => String(i.name)));

  for (const idx of wanted) {
    if (have.has(idx.name)) continue;
    try {
      await c.createIndex(idx.key as any, {
        ...(idx.unique ? { unique: true } : {}),
        name: idx.name,
      });
    } catch {
      // לא מפיל שרת על אינדקס
    }
  }
}

/* ================= Collections Access ================= */

async function likesCol(): Promise<Collection<DateLikeDoc>> {
  const c = await getCollection<DateLikeDoc>("date_likes");
  await ensureLikesIndexes(c);
  return c;
}

async function matchesCol(): Promise<Collection<DateMatchDoc>> {
  const c = await getCollection<DateMatchDoc>("date_matches");
  await ensureMatchesIndexes(c);
  return c;
}

/* ================= Helpers ================= */

const pair = (a: string, b: string): { a: string; b: string } =>
  a <= b ? { a, b } : { a: b, b: a };

const nowISO = () => new Date().toISOString();

/* ================= Public API ================= */

/**
 * יצירת לייק חד־כיווני (Idempotent):
 * אם כבר קיים from→to – לא יוצר כפילויות.
 */
export async function setLike(from: string, to: string): Promise<void> {
  if (!from || !to || from === to) return;
  const col = await likesCol();
  const now = nowISO();

  await col.updateOne(
    { from, to },
    { $setOnInsert: { from, to, createdAt: now } },
    { upsert: true },
  );
}

/** ביטול לייק חד־כיווני */
export async function unsetLike(from: string, to: string): Promise<void> {
  if (!from || !to || from === to) return;
  const col = await likesCol();
  await col.deleteOne({ from, to });
}

/** האם קיים לייק חד־כיווני from→to */
export async function hasLike(from: string, to: string): Promise<boolean> {
  if (!from || !to || from === to) return false;
  const col = await likesCol();
  const cnt = await col.countDocuments({ from, to }, { limit: 1 });
  return cnt > 0;
}

/**
 * Toggle לייק:
 * - אם כבר יש לייק from→to  → מוחק (unlike) ומחזיר liked:false
 * - אם אין → יוצר לייק חדש, בודק האם קיים לייק הפוך
 *   ואם יש – יוצר/מעדכן match ומחזיר match:true
 */
export async function toggleLike(
  from: string,
  to: string,
): Promise<{ liked: boolean; match: boolean; matchId?: string }> {
  if (!from || !to || from === to) return { liked: false, match: false };

  const L = await likesCol();

  // האם כבר יש לייק ממני אליו?
  const found = await L.findOne({ from, to }, { projection: { _id: 1 } });

  // אם קיים – נבטל (unlike)
  if (found?._id) {
    await L.deleteOne({ _id: found._id });
    return { liked: false, match: false };
  }

  // אחרת – ניצור לייק חדש
  await setLike(from, to);

  // ונבדוק האם נהיה מאץ' הדדי
  const m = await isMatch(from, to);
  return { liked: true, match: m.match, matchId: m.matchId };
}

/**
 * האם יש מאץ' הדדי בין שני משתמשים.
 * אם יש לייקים לשני הכיוונים – יווצר / יעודכן match.
 */
export async function isMatch(
  u1: string,
  u2: string,
): Promise<{ match: boolean; matchId?: string }> {
  if (!u1 || !u2 || u1 === u2) return { match: false };

  const L = await likesCol();
  const { a, b } = pair(u1, u2);

  const [ab, ba] = await Promise.all([
    L.countDocuments({ from: a, to: b }, { limit: 1 }),
    L.countDocuments({ from: b, to: a }, { limit: 1 }),
  ]);

  // אם אין לייק הדדי – אין מאץ'
  if (!(ab > 0 && ba > 0)) return { match: false };

  const M = await matchesCol();
  const now = nowISO();

  const res = await M.findOneAndUpdate(
    { a, b },
    { $setOnInsert: { a, b, createdAt: now }, $set: { lastEventAt: now } },
    { upsert: true, returnDocument: "after" },
  );

  const id = (res.value?._id as ObjectId | undefined)?.toString();
  return { match: true, matchId: id };
}

/**
 * מאצ'ים למשתמש (דפדוף לפי _id, הכי חדשים קודם)
 */
export async function listMatchesForUser(
  userId: string,
  limit = 50,
  cursor?: string,
): Promise<{
  items: Array<{ matchId: string; otherUserId: string; createdAt: string }>;
  nextCursor: string | null;
}> {
  if (!userId) return { items: [], nextCursor: null };

  const M = await matchesCol();

  const q: any = { $or: [{ a: userId }, { b: userId }] };
  if (cursor && ObjectId.isValid(cursor)) {
    q._id = { $lt: new ObjectId(cursor) };
  }

  const rows = await M.find(q)
    .sort({ _id: -1 })
    .limit(Math.min(Math.max(limit, 1), 200))
    .toArray();

  const items = rows.map((m) => ({
    matchId: (m._id as ObjectId).toString(),
    otherUserId: m.a === userId ? m.b : m.a,
    createdAt: m.createdAt,
  }));

  const nextCursor = items.length ? items[items.length - 1].matchId : null;

  return { items, nextCursor };
}

/**
 * מי עשה לי לייק (שימושי לפיד "מי התעניין בי")
 */
export async function listLikersOf(userId: string, limit = 100) {
  const L = await likesCol();
  return L.find({ to: userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 500))
    .toArray();
}

/**
 * למי אני עשיתי לייק (שימושי למסכי ניהול / סטטיסטיקות)
 */
export async function listLikeesOf(userId: string, limit = 100) {
  const L = await likesCol();
  return L.find({ from: userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 500))
    .toArray();
}

export async function listMatches(..._args: any[]): Promise<any[]> {
  return [];
}
