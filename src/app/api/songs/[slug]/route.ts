// src/app/api/songs/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNigunimCollection } from "@/lib/db/nigunim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;

    const col = await getNigunimCollection("songs");
    const song = await col.findOne({ slug }, { projection: { _id: 0 } });

    if (!song) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, song });
  } catch (e: any) {
    console.error("[/api/songs/[slug]] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
