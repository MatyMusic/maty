// src/app/api/admin/club/promotions/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "@/lib/mongoose";
import ClubPromotion from "@/models/ClubPromotion";
import { requireAdmin } from "@/lib/admin-only";

function j(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await db;
  const item = await ClubPromotion.findById(params.id).lean();
  return item
    ? j({ ok: true, item })
    : j({ ok: false, error: "not_found" }, 404);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  await db;
  await requireAdmin();
  const patch = await req.json().catch(() => ({}));
  if (patch.startsAt) patch.startsAt = new Date(patch.startsAt);
  if (patch.endsAt) patch.endsAt = new Date(patch.endsAt);

  const item = await ClubPromotion.findByIdAndUpdate(params.id, patch, {
    new: true,
  });
  return item
    ? j({ ok: true, item })
    : j({ ok: false, error: "not_found" }, 404);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  await db;
  await requireAdmin();
  await ClubPromotion.findByIdAndDelete(params.id);
  return j({ ok: true });
}
