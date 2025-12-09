// src/app/api/club/promotions/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getPromotion,
  updatePromotion,
  deletePromotion,
} from "@/lib/db/club-promotions";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const doc = await getPromotion(params.id);
  if (!doc)
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 },
    );
  return NextResponse.json({ ok: true, item: doc });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const doc = await updatePromotion(params.id, body);
    return NextResponse.json({ ok: true, item: doc });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  const r = await deletePromotion(params.id);
  return NextResponse.json({ ok: r.ok });
}
