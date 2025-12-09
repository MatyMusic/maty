// src/app/api/club/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongoose";
import ClubComment from "@/models/club/Comment";
import ClubCommentLike from "@/models/club/CommentLike";
import { deleteComment } from "@/lib/db/clubComments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ───── עוזר קטן ל־uid ───── */
function getUid(u?: { id?: string; _id?: string } | null) {
  if (!u) return null;
  return (u as any).id || (u as any)._id || null;
}

/* ───── DELETE – מחיקת תגובה ───── */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const s = await auth();
    const uid = getUid((s as any)?.user);
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await ctx.params;

    // עדיין משתמש בפונקציה הקיימת שלך שמטפלת בהרשאות וכו'
    const res = await deleteComment(id, uid, !!(s as any)?.user?.isAdmin);

    return NextResponse.json({ ok: true, ...res });
  } catch (err: any) {
    const code =
      err?.message === "forbidden"
        ? 403
        : err?.message === "not_found"
          ? 404
          : 500;

    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: code },
    );
  }
}

/* ───── POST – action=like ───── */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // כרגע תומך רק בלייק
    if (action !== "like") {
      return NextResponse.json(
        { ok: false, error: "unsupported_action" },
        { status: 400 },
      );
    }

    await connectDB();

    const s = await auth();
    const uid = getUid((s as any)?.user);
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await ctx.params;
    const commentId = (id || "").toString().trim();

    if (!commentId) {
      return NextResponse.json(
        { ok: false, error: "bad_request", detail: "missing comment id" },
        { status: 400 },
      );
    }

    // קורא body רק אם יש – כדי לא להפיל אם אין גוף
    let desiredOn: boolean | undefined = undefined;
    try {
      const data = (await req.json()) as { on?: boolean } | null;
      if (data && Object.prototype.hasOwnProperty.call(data, "on")) {
        desiredOn = !!data.on;
      }
    } catch {
      // אין גוף / לא JSON – נתייחס כ"טוגל"
    }

    // מצב קודם – האם יש like רשום למשתמש על התגובה
    const existingLike = await ClubCommentLike.findOne({
      commentId,
      userId: uid,
    })
      .lean()
      .exec();
    const existedBefore = !!existingLike;

    let likedAfter = existedBefore;

    if (desiredOn === true || (desiredOn === undefined && !existedBefore)) {
      // ===== מצב סופי: ON =====
      if (!existedBefore) {
        // אם לא היה – ליצור רשומה ולהעלות מונה
        await ClubCommentLike.updateOne(
          { commentId, userId: uid },
          { $setOnInsert: { commentId, userId: uid, createdAt: new Date() } },
          { upsert: true },
        ).exec();

        await ClubComment.updateOne(
          { _id: commentId },
          { $inc: { likeCount: 1 } },
        ).exec();

        likedAfter = true;
      } else {
        // כבר היה – לא משנים את הספירה
        likedAfter = true;
      }
    } else {
      // ===== מצב סופי: OFF =====
      if (existedBefore) {
        const del = await ClubCommentLike.deleteOne({
          commentId,
          userId: uid,
        }).exec();

        if (del.deletedCount) {
          await ClubComment.updateOne(
            { _id: commentId },
            { $inc: { likeCount: -1 } },
          ).exec();
        }
      }
      likedAfter = false;
    }

    // שליפת התגובה כדי להחזיר likeCount עדכני
    const comment = await ClubComment.findById(commentId).lean().exec();

    return NextResponse.json({
      ok: true,
      item: {
        _id: commentId,
        likeCount: comment?.likeCount ?? 0,
        liked: likedAfter,
      },
    });
  } catch (err: any) {
    console.error("[CLUB_COMMENT_LIKE] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}
