// src/app/api/club/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import ClubPost from "@/models/club/Post";
import ClubPostLike from "@/models/club/PostLike";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ——— utils ———
const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );

async function readSession(): Promise<{
  user?: { id?: string; _id?: string };
} | null> {
  try {
    const m: any = await import("@/lib/auth");
    if (m?.auth) {
      const s = await m.auth().catch(() => null);
      if (s?.user?.id || s?.user?._id) return s;
    }
  } catch {}
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions }: any = await import(
      "@/app/api/auth/[...nextauth]/auth-options"
    );
    const s = await getServerSession(authOptions).catch(() => null);
    if (s?.user?.id || s?.user?._id) return s;
  } catch {}
  return null;
}
const uid = async () => {
  const s = await readSession();
  return s?.user?.id || (s?.user as any)?._id || null;
};

// Next 15: params עשוי להיות Promise
async function readParams(ctx: any) {
  // @ts-ignore
  const p =
    ctx?.params && typeof ctx.params.then === "function"
      ? await ctx.params
      : ctx?.params;
  return p || {};
}

async function readLikeCount(postId: string) {
  const p = await ClubPost.findOne(
    { _id: postId },
    { likesCount: 1, likeCount: 1 },
  )
    .lean()
    .exec();
  const v = (p as any)?.likesCount ?? (p as any)?.likeCount ?? 0;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

// ——— GET ———
export async function GET(_req: NextRequest, ctx: any) {
  try {
    await connectDB();
    const { id: postId } = await readParams(ctx);
    if (!postId || typeof postId !== "string" || !isUUID(postId)) {
      return NextResponse.json(
        { ok: false, error: "bad_post_id" },
        { status: 400 },
      );
    }

    const userId = await uid(); // לא חובה להתחבר כדי לשאול סטטוס
    const liked = userId
      ? !!(await ClubPostLike.findOne({ postId, userId }).lean().exec())
      : false;

    const likeCount = await readLikeCount(postId);
    return NextResponse.json({ ok: true, liked, likeCount });
  } catch (e: any) {
    console.error("[LIKE.GET] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}

// ——— POST ———
export async function POST(req: NextRequest, ctx: any) {
  try {
    await connectDB();
    const userId = await uid();
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );

    const { id: postId } = await readParams(ctx);
    if (!postId || typeof postId !== "string" || !isUUID(postId)) {
      return NextResponse.json(
        { ok: false, error: "bad_post_id" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}) as any);
    const hasOn = Object.prototype.hasOwnProperty.call(body, "on");
    const desiredOn = hasOn ? !!body.on : undefined;

    const exists = await ClubPostLike.findOne({ postId, userId }).lean().exec();

    if (desiredOn === true || (desiredOn === undefined && !exists)) {
      await ClubPostLike.updateOne(
        { postId, userId },
        { $setOnInsert: { postId, userId, createdAt: new Date() } },
        { upsert: true },
      ).exec();
      if (!exists) {
        await ClubPost.updateOne(
          { _id: postId },
          { $inc: { likesCount: 1, likeCount: 1 } },
        ).exec();
      }
    } else {
      const del = await ClubPostLike.deleteOne({ postId, userId }).exec();
      if (del.deletedCount) {
        await ClubPost.updateOne(
          { _id: postId },
          { $inc: { likesCount: -1, likeCount: -1 } },
        ).exec();
      }
    }

    const likeCount = await readLikeCount(postId);
    const liked = !!(await ClubPostLike.findOne({ postId, userId })
      .lean()
      .exec());
    return NextResponse.json({ ok: true, liked, likeCount });
  } catch (e: any) {
    console.error("[LIKE.POST] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}
