import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import { auth } from "@/lib/auth";
import Post from "@/models/club/Post";
import PostLike from "@/models/PostLike";
import { Types } from "mongoose";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ liked: false });
  const liked = !!(await PostLike.findOne({
    postId: params.id,
    userId: session.user.id,
  }).lean());
  return NextResponse.json({ liked });
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = params.id;
  const userId = session.user.id;

  try {
    await PostLike.updateOne(
      { postId, userId },
      { $setOnInsert: { postId: new Types.ObjectId(postId), userId } },
      { upsert: true },
    );
    await Post.updateOne({ _id: postId }, { $inc: { likes: 1 } });
  } catch (e: any) {
    if (e.code !== 11000) throw e; // idempotent
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  await connectDB();
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = params.id;
  const userId = session.user.id;

  const del = await PostLike.deleteOne({ postId, userId });
  if (del.deletedCount) {
    await Post.updateOne({ _id: postId }, { $inc: { likes: -1 } });
  }
  return NextResponse.json({ ok: true });
}
