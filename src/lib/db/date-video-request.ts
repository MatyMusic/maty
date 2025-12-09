import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import {
  ObjectId,
  type Collection,
  type Db,
  type IndexDescription,
} from "mongodb";

export type VideoReqState = "pending" | "accepted" | "rejected" | "cancelled";

export type DateVideoRequestDoc = {
  _id?: ObjectId;
  a: string; // userId קטן (lexicographically)
  b: string; // userId גדול
  from: string; // מי יזם את הבקשה (userId)
  state: VideoReqState;
  roomId: string;
  requestedAt: string; // ISO
  respondedAt?: string | null;
  reason?: string | null;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

/* ---------- עוזרים לאינדקסים ---------- */

async function ensureIndexes(c: Collection<DateVideoRequestDoc>) {
  const wanted: Array<IndexDescription & { name: string; unique?: boolean }> = [
    // לכל זוג (a,b) – כל הבקשות לפי זמן
    { key: { a: 1, b: 1, requestedAt: -1 }, name: "pair_by_time" },
    // בקשות שאני יזמתי
    { key: { from: 1, requestedAt: -1 }, name: "from_by_time" },
    // לא לאפשר יותר מבקשה pending אחת לזוג
    {
      key: { a: 1, b: 1, state: 1 },
      name: "pair_state_pending_unique",
      unique: true,
      partialFilterExpression: { state: "pending" },
    },
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
        partialFilterExpression: (idx as any).partialFilterExpression,
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (!/already exists|Index with name.*already exists/i.test(msg)) {
        console.error("[date-video-request] createIndex error:", e);
      }
    }
  }
}

async function videoCol(): Promise<Collection<DateVideoRequestDoc>> {
  const db = await getDb();
  const c = db.collection<DateVideoRequestDoc>("date_video_requests");
  await ensureIndexes(c);
  return c;
}

/* ---------- Helpers ---------- */

function pair(u1: string, u2: string): { a: string; b: string } {
  return u1 <= u2 ? { a: u1, b: u2 } : { a: u2, b: u1 };
}
function nowISO() {
  return new Date().toISOString();
}
function makeRoomId(a: string, b: string) {
  const base = [a, b].sort().join(":");
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 24);
}

/* ---------- Public API ---------- */

/** יצירת / קבלת בקשת וידאו יוצאת (ממני אל peer) */
export async function upsertOutgoingVideoRequest(
  fromUserId: string,
  toUserId: string,
): Promise<DateVideoRequestDoc> {
  const col = await videoCol();
  const { a, b } = pair(fromUserId, toUserId);

  // אם כבר יש pending לזוג – נחזיר אותו (לא יוצרים כפילויות)
  const existing = await col.findOne({
    a,
    b,
    state: "pending",
  });
  if (existing) return existing;

  const roomId = makeRoomId(a, b);
  const now = nowISO();

  const doc: DateVideoRequestDoc = {
    a,
    b,
    from: fromUserId,
    state: "pending",
    roomId,
    requestedAt: now,
  };

  const res = await col.insertOne(doc as any);
  doc._id = res.insertedId;
  return doc;
}

/** ביטול בקשה יוצאת שאני יזמתי */
export async function cancelOutgoingVideoRequest(
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  const col = await videoCol();
  const { a, b } = pair(fromUserId, toUserId);
  const now = nowISO();

  await col.updateMany(
    { a, b, from: fromUserId, state: "pending" },
    {
      $set: {
        state: "cancelled",
        respondedAt: now,
        reason: "cancelled_by_sender",
      },
    },
  );
}

/** אישור בקשה נכנסת (peer → me) */
export async function acceptIncomingVideoRequest(
  meUserId: string,
  peerUserId: string,
): Promise<DateVideoRequestDoc | null> {
  const col = await videoCol();
  const { a, b } = pair(meUserId, peerUserId);
  const now = nowISO();

  const vr = await col.findOne({
    a,
    b,
    from: peerUserId,
    state: "pending",
  });
  if (!vr?._id) return null;

  const roomId = vr.roomId || makeRoomId(a, b);

  await col.updateOne(
    { _id: vr._id },
    {
      $set: {
        state: "accepted",
        roomId,
        respondedAt: now,
        reason: null,
      },
    },
  );

  return {
    ...vr,
    state: "accepted",
    roomId,
    respondedAt: now,
    reason: null,
  };
}

/** דחיית בקשה נכנסת (peer → me) */
export async function rejectIncomingVideoRequest(
  meUserId: string,
  peerUserId: string,
  reason?: string | null,
): Promise<DateVideoRequestDoc | null> {
  const col = await videoCol();
  const { a, b } = pair(meUserId, peerUserId);
  const now = nowISO();

  const vr = await col.findOne({
    a,
    b,
    from: peerUserId,
    state: "pending",
  });
  if (!vr?._id) return null;

  const r =
    typeof reason === "string" && reason.trim()
      ? reason.trim()
      : "declined_by_target";

  await col.updateOne(
    { _id: vr._id },
    {
      $set: {
        state: "rejected",
        respondedAt: now,
        reason: r,
      },
    },
  );

  return {
    ...vr,
    state: "rejected",
    respondedAt: now,
    reason: r,
  };
}

/** הבקשה האחרונה (בכל כיוון) בין שני משתמשים */
export async function getLastVideoRequestBetween(
  u1: string,
  u2: string,
): Promise<DateVideoRequestDoc | null> {
  const col = await videoCol();
  const { a, b } = pair(u1, u2);
  const doc = await col
    .find({ a, b })
    .sort({ requestedAt: -1, _id: -1 })
    .limit(1)
    .next();
  return doc || null;
}
