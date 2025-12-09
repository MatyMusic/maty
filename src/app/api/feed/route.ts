import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Post from "@/models/club/Post";
import { Types } from "mongoose";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);
  const cursor = searchParams.get("cursor");

  // אל תציג פוסטים מוסתרים/פרטיים בפיד ציבורי (תתאם להגיון שלך)
  const base: any = { visibility: { $ne: "hidden" } };

  // מיון יציב: ראשון חדש -> ישן
  const sort = { createdAt: -1, _id: -1 } as const;

  let query: any = { ...base };

  if (cursor) {
    const [iso, id] = cursor.split("_");
    const d = new Date(iso);
    const oid = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;

    if (!Number.isNaN(+d) && oid) {
      query = {
        ...base,
        $or: [{ createdAt: { $lt: d } }, { createdAt: d, _id: { $lt: oid } }],
      };
    }
  }

  const items = await Post.find(query).sort(sort).limit(limit).lean().select({
    _id: 1,
    authorId: 1,
    text: 1,
    images: 1,
    videoUrl: 1,
    audioUrl: 1,
    createdAt: 1,
    likeCount: 1,
    commentCount: 1,
    visibility: 1,
  });

  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last
      ? `${new Date(last.createdAt).toISOString()}_${last._id}`
      : null;

  return NextResponse.json({ items, nextCursor });
}
