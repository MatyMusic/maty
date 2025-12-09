// src/app/api/gallery/like/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCollection } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

type MediaDoc = {
  _id?: any;
  kind?: string;
  title?: string;
  url: string;
  publicId?: string;
  thumbUrl?: string;
  tags?: string[];
  createdAt?: Date | string;
  likes?: number;
  comments?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mediaId = String(body.mediaId || "").trim();

    if (!mediaId) {
      return NextResponse.json(
        { ok: false, error: "missing_media_id" },
        { status: 400 },
      );
    }

    // אותה קולקציה כמו /api/gallery ו-/api/admin/media
    const col = await getCollection<MediaDoc>("media");

    const query: any = {};
    if (ObjectId.isValid(mediaId)) {
      query._id = new ObjectId(mediaId);
    } else {
      query.$or = [{ publicId: mediaId }, { url: mediaId }];
    }

    const result = await col.findOneAndUpdate(
      query,
      { $inc: { likes: 1 } },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }

    const doc = result.value;
    const likes = Number((doc as any).likes || 0);

    return NextResponse.json(
      { ok: true, likes },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    console.error("[/api/gallery/like] error", e);
    return NextResponse.json(
      { ok: false, error: e.message || "internal_error" },
      { status: 500 },
    );
  }
}
