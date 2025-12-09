// src/app/api/admin/club/promotions/reorder/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "@/lib/mongoose";
import ClubPromotion from "@/models/ClubPromotion";
import { requireAdmin } from "@/lib/admin-only";

export async function POST(req: Request) {
  await db;
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (!ids.length)
    return NextResponse.json(
      { ok: false, error: "missing_ids" },
      { status: 400 },
    );

  // קובע סדר לפי המיקום במערך
  const bulk = ids.map((id, idx) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: idx + 1 } } },
  }));
  await ClubPromotion.bulkWrite(bulk);
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
