// src/app/api/club/posts/[id]/comments/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Post from "@/models/Post";
import PostComment from "@/models/PostComment";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const postId = params.id;
    const items = await PostComment.find({ postId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const session = await auth();
    const userId = (session as any)?.user?.id;
    const userName = (session as any)?.user?.name || "משתמש";
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );

    const postId = params.id;
    const body = await req.json().catch(() => ({}));
    const text = String(body?.body || "").trim();
    if (!text)
      return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

    const doc = await PostComment.create({
      postId,
      userId,
      userName,
      body: text,
    });
    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

    return NextResponse.json({ ok: true, item: doc });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
