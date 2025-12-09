import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Post from "@/models/club/Post";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const limit = clampInt(searchParams.get("limit"), 6, 50, 12);
  const genre = norm(searchParams.get("genre"));
  const tag = norm(searchParams.get("tag"));
  const authorId = norm(searchParams.get("authorId"));
  const cursor = norm(searchParams.get("cursor"));

  const q: any = { visibility: { $ne: "private" } };
  if (genre) q.genre = genre;
  if (tag) q.tags = { $in: [tag] };
  if (authorId) q.authorId = authorId;

  const sort = { createdAt: -1, _id: -1 } as const;
  if (cursor) {
    const isoMatch = cursor.match(/^(\d{4}-\d{2}-\d{2}T[^_]+)_(.+)$/);
    if (isoMatch) {
      const createdAt = new Date(isoMatch[1]);
      const id = new Types.ObjectId(isoMatch[2]);
      q.$or = [
        { createdAt: { $lt: createdAt } },
        { createdAt, _id: { $lt: id } },
      ];
    } else if (/^[a-f\d]{24}$/i.test(cursor)) {
      q._id = { $lt: new Types.ObjectId(cursor) };
    }
  }

  const items = await Post.find(q).sort(sort).limit(limit).lean();
  const last = items[items.length - 1];
  const nextCursor = last
    ? `${new Date(last.createdAt).toISOString()}_${last._id}`
    : null;

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
