export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";
import { requireAdmin } from "@/lib/require-admin";

function ymd(s: unknown) {
  const v = String(s || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** POST { date: 'YYYY-MM-DD', note? } → מסמן יום כ-BUSY (אדמין בלבד) */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const date = ymd(body?.date);
  const note = (body?.note || "").toString().slice(0, 500);
  if (!date) {
    return NextResponse.json(
      { ok: false, error: "invalid_date" },
      { status: 400 }
    );
  }

  const col = await getCollection("availability");

  // קובע BUSY (עם upsert)
  await col.updateOne(
    { date, status: "busy" },
    {
      $set: {
        date,
        status: "busy",
        note: note || undefined,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  // מנקה HOLD לאותו יום (אם קיים)
  await col.deleteMany({ date, status: "hold" });

  return NextResponse.json({ ok: true });
}
