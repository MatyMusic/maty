// src/app/api/club/comments/route.ts
import connectDB from "@/lib/db/mongoose";
import ClubComment from "@/models/club/Comment";
import ClubPost from "@/models/club/Post";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ───── קריאת סשן ───── */
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

/* ───── GET – שליפת תגובות לפוסט ───── */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const limit = Math.max(
      1,
      Math.min(200, Number(searchParams.get("limit") || 50)),
    );

    if (!postId) {
      return NextResponse.json(
        { ok: false, error: "missing_postId" },
        { status: 400 },
      );
    }

    const items = await ClubComment.find({ postId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("[COMMENTS.GET] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 },
    );
  }
}

/* ───── POST – יצירת תגובה / תגובת־תגובה ───── */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = await uid();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    let body: any = null;
    const ct = (req.headers.get("content-type") || "").toLowerCase();

    // ✅ תמיכה ב־JSON, x-www-form-urlencoded ו־multipart/form-data (FormData מהקליינט)
    if (ct.includes("application/json")) {
      body = await req.json().catch(() => null);
    } else if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const f = await req.formData();
      body = Object.fromEntries(f.entries());
    } else {
      // ניסיון אחרון – JSON
      body = await req.json().catch(() => null);
    }

    if (!body) {
      console.error("[COMMENTS.POST] empty body (content-type:", ct, ")");
      return NextResponse.json(
        { ok: false, error: "empty_body" },
        { status: 400 },
      );
    }

    console.log("[COMMENTS.POST] raw body:", body);

    // postId: גם מה־body וגם מה־query string אם צריך
    const postIdFromBody =
      body.postId || body.post_id || body.postID || body.post || "";
    const postIdFromQuery = searchParams.get("postId") || "";
    const postId = String(postIdFromBody || postIdFromQuery || "").trim();

    // parentId – בשביל שרשור תגובות
    const parentRaw =
      body.parentId || body.parent_id || body.replyTo || body.parent || "";
    const parentId = String(parentRaw || "").trim() || null;

    // טקסט התגובה – כמה שמות שונים
    const rawText =
      body.body ?? body.text ?? body.comment ?? body.content ?? "";

    const text = String(rawText || "").trim();

    if (!postId || !text) {
      console.error("[COMMENTS.POST] bad_request", {
        postIdFromBody,
        postIdFromQuery,
        rawText,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "bad_request",
          detail: "חובה postId ו-text/body לא ריקים",
        },
        { status: 400 },
      );
    }

    // ⚠️ כרגע אנחנו מתעלמים מקבצים ב־FormData (files) – אפשר להוסיף Cloudinary בהמשך

    const doc: any = {
      postId,
      userId,
      body: text,
    };
    if (parentId) doc.parentId = parentId;

    const item = await ClubComment.create(doc);

    // עדכון מונה תגובות בפוסט
    await ClubPost.updateOne(
      { _id: postId },
      { $inc: { commentsCount: 1 } },
    ).exec();

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("[COMMENTS.POST] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 },
    );
  }
}
