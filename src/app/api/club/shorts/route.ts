import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/db/mongoose";
import Post from "@/models/club/Post";

export const dynamic = "force-dynamic";

// GET /api/club/shorts?cursor=<ObjectId>&limit=6&genre=...&tag=shorts&authorId=...
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = clampInt(searchParams.get("limit"), 1, 24, 6);
  const cursor = searchParams.get("cursor");
  const genre = norm(searchParams.get("genre"));
  const tag = norm(searchParams.get("tag"));
  const authorId = norm(searchParams.get("authorId"));

  const where: any = { videoUrl: { $exists: true, $ne: "" } };
  if (genre) where.genre = genre;
  if (authorId) where.authorId = authorId;
  if (tag) where.tags = { $in: [tag] };

  if (cursor) {
    if (!Types.ObjectId.isValid(cursor)) {
      return NextResponse.json(
        { ok: false, error: "bad cursor" },
        { status: 400 },
      );
    }
    where._id = { $lt: new Types.ObjectId(cursor) };
  }

  const items = await Post.find(where, {
    _id: 1,
    text: 1,
    genre: 1,
    videoUrl: 1,
    coverUrl: 1,
    authorId: 1,
    createdAt: 1,
    tags: 1,
  })
    .sort({ _id: -1 })
    .limit(limit)
    .lean();

  const nextCursor =
    items.length === limit ? String(items[items.length - 1]._id) : null;
  return NextResponse.json({ ok: true, items, nextCursor });
}

function clampInt(
  valStr: string | null,
  min: number,
  max: number,
  fallback: number,
) {
  const n = Number(valStr ?? "");
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
function norm(s: string | null) {
  const t = (s ?? "").trim();
  return t ? t : undefined;
}
