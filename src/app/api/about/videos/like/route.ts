// src/app/api/about/videos/like/route.ts
import { changeVideoLikes } from "@/lib/db/videoDemos";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/about/videos/like
 * body: { id: string; like: boolean }
 * - like: true  → $inc likes +1
 * - like: false → $inc likes -1 (לא יורד מתחת 0)
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      id?: string;
      like?: boolean;
    } | null;

    if (!body?.id || typeof body.like !== "boolean") {
      return NextResponse.json(
        { error: "חובה לשלוח id ו-like (true/false)" },
        { status: 400 },
      );
    }

    const delta = body.like ? 1 : -1;
    const item = await changeVideoLikes(body.id, delta);

    if (!item) {
      return NextResponse.json({ error: "וידאו לא נמצא" }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/about/videos/like] error:", err);
    return NextResponse.json({ error: "שגיאה בעדכון לייקים" }, { status: 500 });
  }
}
