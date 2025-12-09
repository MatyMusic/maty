// src/app/api/fit/groups/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromReq } from "@/lib/authz";
import {
  createFitGroup,
  listPublicGroups,
  joinGroup,
  leaveGroup,
  type FitSport,
} from "@/lib/db/fit-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET ?q&sport_any=a,b&city&page&limit
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const city = searchParams.get("city") || undefined;
  const sa = searchParams.get("sport_any");
  const sportAny = sa
    ? (sa.split(",").map((s) => s.trim()) as FitSport[])
    : undefined;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");

  const data = await listPublicGroups({ q, sportAny, city, page, limit });
  return NextResponse.json({ ok: true, ...data });
}

// POST – יצירת קבוצה -> pending
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromReq();
    const body = await req.json();
    if (
      !body?.slug ||
      !body?.title ||
      !Array.isArray(body?.sports) ||
      !body?.visibility
    ) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload" },
        { status: 400 },
      );
    }
    const doc = await createFitGroup({
      slug: String(body.slug)
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-"),
      title: String(body.title).slice(0, 80),
      description: body.description
        ? String(body.description).slice(0, 400)
        : undefined,
      city: body.city ? String(body.city) : null,
      sports: body.sports as FitSport[],
      level: body.level ?? null,
      ownerId: userId,
      visibility: body.visibility === "private" ? "private" : "public",
    });
    return NextResponse.json({ ok: true, item: doc });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}

// PATCH – פעולות: join/leave
export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromReq();
    const body = await req.json();
    const action = body?.action;
    const slug = body?.slug;
    if (!slug || (action !== "join" && action !== "leave")) {
      return NextResponse.json(
        { ok: false, error: "invalid_action" },
        { status: 400 },
      );
    }
    const item =
      action === "join"
        ? await joinGroup(slug, userId)
        : await leaveGroup(slug, userId);
    if (!item)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
