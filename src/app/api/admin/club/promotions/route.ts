// src/app/api/admin/club/promotions/route.ts
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

export async function GET() {
  await db;
  const items = await ClubPromotion.find()
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return j({ ok: true, items });
}

export async function POST(req: Request) {
  await db;
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const {
    title,
    imageUrl,
    linkUrl,
    active = true,
    startsAt,
    endsAt,
    tags = [],
  } = body || {};
  if (!title?.trim()) return j({ ok: false, error: "missing_title" }, 400);

  // מציאת order מקסימלי + 1
  const last = await ClubPromotion.findOne().sort({ order: -1 }).lean();
  const order = typeof last?.order === "number" ? last.order + 1 : 1;

  const doc = await ClubPromotion.create({
    title: String(title).trim(),
    imageUrl: imageUrl || "",
    linkUrl: linkUrl || "",
    active: !!active,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
    order,
    tags: Array.isArray(tags) ? tags : [],
  });

  return j({ ok: true, item: doc });
}
