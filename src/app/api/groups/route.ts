// src/app/api/groups/route.ts
import { NextResponse } from "next/server";
import {
  createGroupRequest,
  listGroupsPublic,
  type SportHeb,
} from "@/lib/db/groups-repo";
import { getSessionSafe } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: רשימת קבוצות מאושרות לציבור */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const sport = (searchParams.get("sport") || undefined) as
    | SportHeb
    | undefined;
  const city = searchParams.get("city") || undefined;
  const limit = Number(searchParams.get("limit") || "20");
  const page = Number(searchParams.get("page") || "1");

  const { items, total, pages } = await listGroupsPublic({
    q,
    sport,
    city: city || null,
    limit,
    page,
  });
  return NextResponse.json({ ok: true, items, total, pages });
}

/** POST: בקשה לפתיחת קבוצה (נכנס כ־pending וממתין לאישור אדמין) */
export async function POST(req: Request) {
  try {
    const session = await getSessionSafe();
    const userId =
      (session?.user as any)?.id || (session?.user as any)?.userId || null;
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );

    const body = await req.json();
    const title = (body?.title || "").trim();
    const description = (body?.description || "").trim();
    const sports = Array.isArray(body?.sports) ? body.sports : [];
    const visibility = body?.visibility === "private" ? "private" : "public";
    const city = (body?.city || "").trim() || null;

    if (!title || !sports.length) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    const group = await createGroupRequest(userId, {
      title,
      description,
      sports,
      visibility,
      city,
    });
    return NextResponse.json({ ok: true, group });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
