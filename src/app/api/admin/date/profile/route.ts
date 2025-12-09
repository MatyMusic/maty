// src/app/api/admin/date/profile/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth/requireAdmin";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function GET(req: NextRequest) {
  // הרשאות: 401/403 במקום 500
  try {
    await requireAdmin("admin");
  } catch (e: any) {
    const st = e?.status ?? 500;
    const msg =
      st === 401 ? "unauthorized" : st === 403 ? "forbidden" : "server_error";
    return j({ ok: false, error: msg }, { status: st });
  }

  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return j({ ok: false, error: "missing_id" }, { status: 400 });
    if (!ObjectId.isValid(id))
      return j({ ok: false, error: "bad_id" }, { status: 400 });

    // ⚠️ שים לב: אין כאן ensureIndexes — קריאה בלבד!
    const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
    const C = db.collection("date_profiles");

    const doc = await C.findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          userId: 1,
          email: 1,
          displayName: 1,
          birthDate: 1,
          gender: 1,
          country: 1,
          city: 1,
          languages: 1,
          jewish_by_mother: 1,
          conversion: 1,
          judaism_direction: 1,
          kashrut_level: 1,
          shabbat_level: 1,
          tzniut_level: 1,
          goals: 1, // יכול להיות string או array היסטורי
          about_me: 1,
          photos: 1,
          avatarUrl: 1,
          verified: 1,
          online: 1,
          subscription: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    if (!doc) return j({ ok: false, error: "not_found" }, { status: 404 });

    // נרמול מטרות: אם נשמר בטעות כמערך – נבחר הראשון התקין
    const rawGoals = (doc as any).goals;
    const goals = Array.isArray(rawGoals)
      ? String(rawGoals[0] ?? "").trim() || null
      : rawGoals ?? null;

    const item = {
      ...doc,
      _id: String((doc as any)._id),
      goals,
    };

    return j({ ok: true, item });
  } catch (e) {
    console.error("[GET /api/admin/date/profile] error:", e);
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}
