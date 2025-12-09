// src/app/api/date/wink/route.ts
import { authOptions } from "@/lib/auth";
import { toggleLike } from "@/lib/db/date-like";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 🔐 1. בדיקת התחברות
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const meId = String(session.user.id);

    // 📦 2. JSON
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "bad_json" }, { status: 400 });
    }

    const toUserId = String(body.toUserId || "").trim();
    if (!toUserId || toUserId === meId) {
      return NextResponse.json({ error: "invalid_target" }, { status: 400 });
    }

    // ❤️ 3. פעולה: קריצה / לייק
    const result = await toggleLike(meId, toUserId);

    return NextResponse.json({
      ok: true,
      liked: result.liked,
      match: result.match,
      matchId: result.matchId || null,
    });
  } catch (err: any) {
    console.error("WINK_API_ERROR:", err);
    return NextResponse.json(
      { error: "server_error", details: err?.message },
      { status: 500 },
    );
  }
}
