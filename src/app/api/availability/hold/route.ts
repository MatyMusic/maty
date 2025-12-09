// src/app/api/availability/hold/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";
import { randomUUID } from "crypto";

/** עזר: YYYY-MM-DD תקין */
function ymd(s: string | null | undefined) {
  const v = String(s || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** מבטיח אינדקס יוניק + TTL על expiresAt (ניקוי HOLD כשפג תוקף) */
async function ensureIndexes() {
  const col = await getCollection("availability");
  try {
    await col.createIndex({ date: 1, status: 1 }, { unique: true, name: "uniq_date_status" });
  } catch {}
  try {
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expiresAt" });
  } catch {}
}

/** POST { date, note?, ttlHours?=3, token? }
 *  יוצר/מעדכן HOLD לתאריך אם אין BUSY.
 *  מחזיר token ו־holdUntil ISO.
 */
export async function POST(req: Request) {
  await ensureIndexes();

  const body = await req.json().catch(() => ({} as any));
  const date = ymd(body?.date);
  const ttlHours = Number(body?.ttlHours ?? 3);
  const note = (body?.note || "Hold for booking flow").toString().slice(0, 200);
  const token = (body?.token || randomUUID()).toString();

  if (!date) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }

  const availability = await getCollection("availability");

  // אם היום תפוס — לא יוצרים HOLD
  const busy = await availability.findOne({ date, status: "busy" });
  if (busy) {
    return NextResponse.json({ ok: false, error: "date_busy" }, { status: 409 });
  }

  const until = new Date(Date.now() + Math.max(1, ttlHours) * 3600 * 1000);

  // HOLD יחיד פעיל ליום; upsert עם expiresAt
  await availability.updateOne(
    { date, status: "hold" },
    {
      $set: {
        date,
        status: "hold",
        note,
        token,
        expiresAt: until,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.json({
    ok: true,
    token,
    holdUntil: until.toISOString(),
  });
}
