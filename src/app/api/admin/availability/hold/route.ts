// src/app/api/availability/hold/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";

function ymd(s: string) {
  const v = String(s || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** POST { date, note?, ttlHours?=3, token? } */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const date = ymd(body?.date);
  const ttlHours = Number(body?.ttlHours ?? 3);
  const note = (body?.note || "Hold for booking flow").toString().slice(0, 200);
  const token = (body?.token || crypto.randomUUID()).toString();

  if (!date)
    return NextResponse.json(
      { ok: false, error: "invalid_date" },
      { status: 400 }
    );

  const col = await getCollection("availability");

  // יש Busy? חוסם.
  const busy = await col.findOne({ date, status: "busy" });
  if (busy) {
    return NextResponse.json(
      { ok: false, error: "date_busy" },
      { status: 409 }
    );
  }

  const until = new Date(Date.now() + Math.max(1, ttlHours) * 3600 * 1000);

  // נחזיק רק HOLD אחד פעיל לתאריך
  await col.updateOne(
    { date, status: "hold" },
    {
      $set: {
        date,
        status: "hold",
        note,
        expiresAt: until,
        token,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, token, holdUntil: until.toISOString() });
}
