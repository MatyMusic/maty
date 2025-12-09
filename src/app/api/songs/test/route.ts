// src/app/api/songs/test/route.ts
import { NextResponse } from "next/server";
import { getNigunimCollection } from "@/lib/db/nigunim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const col = await getNigunimCollection("songs");
    const items = await col
      .find({})
      .project({
        _id: 0,
        slug: 1,
        title_he: 1,
        title_en: 1,
        genre: 1,
        bpm: 1,
        key: 1,
        coverUrl: 1,
        createdAt: 1,
        status: 1,
        tags: 1,
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (e: any) {
    console.error("[/api/songs/test] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
