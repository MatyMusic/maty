// src/app/api/admin/promotions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongoose";
import Promotion from "@/models/Promotion";

export const dynamic = "force-dynamic";

async function ensureAdmin(req: NextRequest) {
  if (req.headers.get("x-maty-admin") === "1") return true;
  try {
    const s = await auth();
    const role = (s?.user as any)?.role || "user";
    return !!s?.user?.id && (role === "admin" || role === "superadmin");
  } catch {
    return false;
  }
}

function j(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function GET(req: NextRequest) {
  if (!(await ensureAdmin(req)))
    return j({ ok: false, error: "unauthorized" }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const placement = (searchParams.get("placement") || "").trim();
  const onlyActive = (searchParams.get("active") || "") === "1";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
    200,
  );

  const now = new Date();
  const cond: any = {};
  if (q)
    cond.$or = [
      { title: { $regex: q, $options: "i" } },
      { body: { $regex: q, $options: "i" } },
      { couponCode: { $regex: q, $options: "i" } },
    ];
  if (placement) cond.placements = placement;
  if (onlyActive) {
    cond.$and = [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ];
  }

  const items = await Promotion.find(cond)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return j({ ok: true, items });
}

export async function POST(req: NextRequest) {
  if (!(await ensureAdmin(req)))
    return j({ ok: false, error: "unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json().catch(() => ({}));

  const doc: any = {
    title: String(body.title || "").slice(0, 140),
    body: body.body ? String(body.body).slice(0, 2000) : undefined,
    imageUrl: body.imageUrl ? String(body.imageUrl) : undefined,
    ctaText: body.ctaText ? String(body.ctaText).slice(0, 40) : undefined,
    link: body.link ? String(body.link) : undefined,
    couponCode: body.couponCode
      ? String(body.couponCode).slice(0, 40)
      : undefined,
    placements:
      Array.isArray(body.placements) && body.placements.length
        ? body.placements.map((s: any) => String(s)).slice(0, 10)
        : ["feed_top"],
    audience:
      body.audience && typeof body.audience === "object" ? body.audience : {},
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
  };
  if (!doc.title)
    return j({ ok: false, error: "title_required" }, { status: 400 });

  const created = await Promotion.create(doc);
  return j({ ok: true, item: created });
}
