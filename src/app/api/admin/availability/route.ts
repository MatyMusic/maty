// src/app/api/admin/availability/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";
import { requireAdmin } from "@/lib/require-admin";

// מבטיח אינדקסים: יוניק על (date,status) + TTL על expiresAt
async function ensureIndexes() {
  const col = await getCollection("availability");
  try {
    await col.createIndex(
      { date: 1, status: 1 },
      { unique: true, name: "uniq_date_status" }
    );
  } catch {}
  try {
    // TTL: כשexpiresAt חולף – המסמך יימחק אוטומטית
    await col.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "ttl_expiresAt" }
    );
  } catch {}
}

function ymd(d: any) {
  const s = String(d || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

// GET /api/admin/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  await ensureIndexes();
  const url = new URL(req.url);
  const from = ymd(url.searchParams.get("from") || new Date().toISOString());
  const to =
    ymd(url.searchParams.get("to")) ||
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().slice(0, 10);

  if (!from || !to) {
    return NextResponse.json(
      { ok: false, error: "invalid_range" },
      { status: 400 }
    );
  }

  const col = await getCollection("availability");
  const rows = await col
    .find({
      date: { $gte: from, $lte: to },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    })
    .sort({ date: 1, status: 1 })
    .toArray();

  return NextResponse.json({
    ok: true,
    rows: rows.map((r: any) => ({
      _id: String(r._id),
      date: r.date,
      status: r.status, // "busy" | "hold"
      note: r.note || null,
      expiresAt: r.expiresAt || null,
    })),
  });
}

// POST { date, status: "busy"|"hold", note?, ttlHours? }
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  await ensureIndexes();
  const body = await req.json().catch(() => ({}));
  const date = ymd(body?.date);
  const status = String(body?.status || "");
  const note = (body?.note || "").toString().slice(0, 500);
  const ttlHours = Number(body?.ttlHours ?? 0);

  if (!date || (status !== "busy" && status !== "hold")) {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 }
    );
  }

  const col = await getCollection("availability");
  const doc: any = { date, status, note: note || undefined };
  if (status === "hold") {
    const hours = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 72; // ברירת מחדל 72 שעות
    doc.expiresAt = new Date(Date.now() + hours * 3600 * 1000);
  } else {
    doc.expiresAt = undefined;
  }

  await col.updateOne(
    { date, status },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

// DELETE ?date=YYYY-MM-DD[&status=busy|hold]
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const date = ymd(url.searchParams.get("date"));
  const status = url.searchParams.get("status");
  if (!date)
    return NextResponse.json(
      { ok: false, error: "missing_date" },
      { status: 400 }
    );

  const col = await getCollection("availability");
  let res;
  if (status === "busy" || status === "hold") {
    res = await col.deleteOne({ date, status });
  } else {
    res = await col.deleteMany({ date });
  }
  return NextResponse.json({ ok: true, deleted: res?.deletedCount || 0 });
}
