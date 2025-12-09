// src/app/api/club/comments/route.ts

import connectDB from "@/lib/db/mongoose";
import ClubComment from "@/models/club/Comment";
import ClubPost from "@/models/club/Post";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ───────── עזרי session ───────── */

async function readSession() {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    return await getServerSession(authOptions);
  } catch (e) {
    console.error("[CLUB.COMMENTS] failed to read session:", e);
    return null;
  }
}

function uid(user: any): string | null {
  if (!user) return null;
  const id = (user as any).id || (user as any)._id || (user as any).sub;
  return id ? String(id) : null;
}

/* ───────── עזרי body ───────── */

async function readBody(req: NextRequest): Promise<any> {
  const ct = req.headers.get("content-type") || "";

  // multipart/form-data – מה שמגיע מה-FormData בצד לקוח
  if (ct.includes("multipart/form-data")) {
    const f = await req.formData();
    const obj: any = {};
    for (const [k, v] of f.entries()) {
      if (typeof v === "string") {
        obj[k] = v;
      }
      // קבצים (File) כרגע מתעלמים – אין העלאת מדיה לתגובה
    }
    return obj;
  }

  // JSON רגיל
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}) as any);
    return j || {};
  }

  // x-www-form-urlencoded
  if (ct.includes("application/x-www-form-urlencoded")) {
    const txt = await req.text();
    const params = new URLSearchParams(txt);
    const obj: any = {};
    params.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  // fallback – נסה JSON ואז formData
  try {
    const j = await req.json().catch(() => ({}) as any);
    if (j && Object.keys(j).length > 0) return j;
  } catch {
    // ignore
  }

  try {
    const f = await req.formData();
    const obj: any = {};
    for (const [k, v] of f.entries()) {
      if (typeof v === "string") obj[k] = v;
    }
    if (Object.keys(obj).length > 0) return obj;
  } catch {
    // ignore
  }

  return {};
}

/* ───────── עזרי תגובה ───────── */

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

/* ───────── GET – רשימת תגובות לפוסט ───────── */
/**
 * GET /api/club/comments?postId=...&limit=50&before=ISO_DATE
 *  - postId חובה
 *  - limit ברירת מחדל 100, מקסימום 200
 *  - before אופציונלי (לפג'ינציה לפי תאריך יצירה)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const postId = (searchParams.get("postId") || "").trim();
    const limitRaw = searchParams.get("limit") || "100";
    const beforeRaw = searchParams.get("before") || "";

    if (!postId) {
      return j({ ok: false, error: "missing_post_id" }, { status: 400 });
    }

    const limit = Math.max(
      1,
      Math.min(200, Number.isFinite(+limitRaw) ? Number(limitRaw) : 100),
    );

    const query: any = { postId };
    if (beforeRaw) {
      const d = new Date(beforeRaw);
      if (!Number.isNaN(d.getTime())) {
        query.createdAt = { $lt: d };
      }
    }

    const items = await ClubComment.find(query)
      .sort({ createdAt: -1 }) // חדשות קודם
      .limit(limit)
      .lean()
      .exec();

    return j({
      ok: true,
      items,
      nextCursor:
        items.length === limit
          ? items[items.length - 1]?.createdAt || null
          : null,
    });
  } catch (e: any) {
    console.error("[CLUB.COMMENTS.GET] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}

/* ───────── POST – יצירת תגובה / תגובת־בן ───────── */
/**
 * POST /api/club/comments
 * body:
 *  - postId (חובה)
 *  - text / body / comment (חובה)
 *  - parentId (אופציונלי – לצורך Thread)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await readSession();
    const userId = uid(session?.user);
    if (!userId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await readBody(req);

    const postIdRaw =
      body?.postId ?? body?.post_id ?? body?.post ?? body?.postID;
    const postId =
      typeof postIdRaw === "string"
        ? postIdRaw.trim()
        : String(postIdRaw || "").trim();

    const textRaw = body?.text ?? body?.body ?? body?.comment ?? "";
    const text =
      typeof textRaw === "string"
        ? textRaw.trim()
        : String(textRaw || "").trim();

    const parentIdRaw = body?.parentId ?? body?.parent_id ?? null;
    const parentId =
      typeof parentIdRaw === "string" && parentIdRaw.trim()
        ? parentIdRaw.trim()
        : null;

    if (!postId) {
      return j({ ok: false, error: "missing_post_id" }, { status: 400 });
    }

    if (!text) {
      return j({ ok: false, error: "empty_body" }, { status: 400 });
    }

    // ודא שהפוסט קיים
    const post = await ClubPost.findOne({ _id: postId }).lean().exec();
    if (!post) {
      return j({ ok: false, error: "post_not_found" }, { status: 404 });
    }

    // משוך קצת מידע על המשתמש לשימוש בתצוגה (שם/תמונה בפרונט)
    let userName = "";
    let userImage = "";

    try {
      const userDoc = await User.findOne(
        { _id: userId },
        { name: 1, image: 1, avatarUrl: 1 },
      )
        .lean()
        .exec();

      userName = (userDoc as any)?.name || "";
      userImage = (userDoc as any)?.avatarUrl || (userDoc as any)?.image || "";
    } catch (e) {
      console.warn("[CLUB.COMMENTS.POST] failed to fetch userDoc:", e);
    }

    const payload = {
      postId,
      userId,
      userName,
      userImage,
      body: text.slice(0, 1000),
      parentId: parentId || null,
    };

    const doc = await ClubComment.create(payload);

    // עדכון מונה תגובות בפוסט (לא חובה, אבל יפה)
    try {
      await ClubPost.updateOne(
        { _id: postId },
        { $inc: { commentsCount: 1 } },
      ).exec();
    } catch (e) {
      console.warn("[CLUB.COMMENTS.POST] failed to bump commentsCount:", e);
    }

    return j({ ok: true, item: doc.toObject() });
  } catch (e: any) {
    console.error("[CLUB.COMMENTS.POST] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}
