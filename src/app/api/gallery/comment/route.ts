// src/app/api/gallery/comment/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

type CommentDoc = {
  _id?: any;
  mediaId: string;
  parentId?: string | null;
  userId?: string | null;
  userName?: string | null;
  text: string;
  createdAt: Date;
};

type MediaDoc = {
  _id?: any;
  likes?: number;
  comments?: number;
};

export async function GET(req: NextRequest) {
  try {
    const mediaId = String(
      req.nextUrl.searchParams.get("mediaId") || "",
    ).trim();

    if (!mediaId) {
      return NextResponse.json(
        { ok: false, error: "missing_media_id" },
        { status: 400 },
      );
    }

    const col = await getCollection<CommentDoc>("GalleryComments");

    const rows = await col
      .find({ mediaId })
      .sort({ createdAt: 1 })
      .limit(300)
      .toArray();

    const comments = rows.map((c) => ({
      id: String((c as any)._id),
      mediaId: c.mediaId,
      userName: c.userName || null,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      parentId: c.parentId || null,
    }));

    return NextResponse.json(
      { ok: true, comments },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    console.error("[/api/gallery/comment][GET] error", e);
    return NextResponse.json(
      { ok: false, error: e.message || "internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mediaId = String(body.mediaId || "").trim();
    const text = String(body.text || "").trim();
    const parentIdRaw = body.parentId ? String(body.parentId).trim() : "";
    const parentId = parentIdRaw || null;

    if (!mediaId || !text) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }

    let user: any = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    const userId = (user && (user.id || user._id || user.userId)) || null;
    const userName = (user && (user.name || user.fullName)) || null;

    const commentsCol = await getCollection<CommentDoc>("GalleryComments");
    const mediaCol = await getCollection<MediaDoc>("Media");

    const doc: CommentDoc = {
      mediaId,
      parentId,
      userId: userId ? String(userId) : null,
      userName: userName ? String(userName) : null,
      text,
      createdAt: new Date(),
    };

    const insertRes = await commentsCol.insertOne(doc);

    const mediaQuery: any = {};
    if (ObjectId.isValid(mediaId)) {
      mediaQuery._id = new ObjectId(mediaId);
    } else {
      mediaQuery.$or = [{ publicId: mediaId }, { url: mediaId }];
    }

    await mediaCol.updateOne(mediaQuery, { $inc: { comments: 1 } });

    return NextResponse.json(
      {
        ok: true,
        comment: {
          id: String(insertRes.insertedId),
          mediaId,
          text,
          userName,
          parentId,
          createdAt: doc.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.error("[/api/gallery/comment][POST] error", e);
    return NextResponse.json(
      { ok: false, error: e.message || "internal_error" },
      { status: 500 },
    );
  }
}
