export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

type Params = { userId: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<Params> } | { params: Params }
) {
  try {
    const { userId } =
      "then" in (ctx as any).params
        ? await (ctx as { params: Promise<Params> }).params
        : (ctx as { params: Params }).params;

    const uid = decodeURIComponent(userId || "");
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "missing_userId" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "").toString().trim();
    const phone = (body?.phone || "").toString().trim();
    const about = (body?.about || "").toString().trim();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }

    const db = await getDb(process.env.MONGODB_DB || "maty-music");
    const leads = db.collection("date_leads");
    const doc = {
      profileUserId: uid,
      name,
      phone,
      about,
      createdAt: new Date().toISOString(),
      status: "new",
      source: "profile_page",
    };
    await leads.insertOne(doc as any);
    console.log("[shadchanit] lead saved:", doc);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[profile/lead POST] error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
