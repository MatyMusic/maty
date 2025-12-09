export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";
import { requireAdmin } from "@/lib/require-admin";

function ymd(s: unknown) {
  const v = String(s || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** POST { date: 'YYYY-MM-DD' } → משחרר את היום (מוחק BUSY/HOLD) — אדמין בלבד */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const date = ymd(body?.date);
  if (!date) {
    return NextResponse.json(
      { ok: false, error: "invalid_date" },
      { status: 400 }
    );
  }

  const col = await getCollection("availability");
  const res = await col.deleteMany({ date }); // מוחק גם busy וגם hold
  return NextResponse.json({ ok: true, deleted: res?.deletedCount || 0 });
}
