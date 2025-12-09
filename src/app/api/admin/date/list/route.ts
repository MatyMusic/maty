// src/app/api/admin/date/list/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth/requireAdmin";

function escRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function parseBool(v?: string | null) {
  return v === "1" || v === "true";
}
const ALLOWED_GENDERS = new Set(["male", "female", "other"]);
const ALLOWED_DIRECTIONS = new Set([
  "orthodox",
  "haredi",
  "chasidic",
  "modern",
  "conservative",
  "reform",
  "reconstructionist",
  "secular",
]);

export async function GET(req: NextRequest) {
  // הרשאה – עם החזרת קוד מדויק (401/403) ולא קריסה
  try {
    await requireAdmin("admin");
  } catch (e: any) {
    const st = e?.status ?? 500;
    const msg =
      st === 401 ? "unauthorized" : st === 403 ? "forbidden" : "server_error";
    return NextResponse.json({ ok: false, error: msg }, { status: st });
  }

  try {
    const { searchParams } = new URL(req.url);

    // דיפולט 20 – מסונכרן עם הדשבורד
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "20"), 1),
      100
    );

    const qText = (searchParams.get("q") || "").trim();
    const genderParam = (searchParams.get("gender") || "").trim().toLowerCase();
    const gender = ALLOWED_GENDERS.has(genderParam)
      ? (genderParam as "male" | "female" | "other")
      : null;

    const directionParam = (searchParams.get("direction") || "")
      .trim()
      .toLowerCase();
    const direction = ALLOWED_DIRECTIONS.has(directionParam)
      ? directionParam
      : null;

    const country = (searchParams.get("country") || "").trim() || null;
    const withAvatar = parseBool(searchParams.get("withAvatar"));

    // cursor בפורמט: "ISODate__<ObjectId>" או פשוט <ObjectId>
    const cursor = searchParams.get("cursor");
    let cursorTime: Date | null = null;
    let cursorId: ObjectId | null = null;

    if (cursor) {
      if (cursor.includes("__")) {
        const [ts, id] = cursor.split("__");
        const d = new Date(ts);
        cursorTime = isNaN(d.getTime()) ? null : d;
        cursorId = ObjectId.isValid(id) ? new ObjectId(id) : null;
      } else if (ObjectId.isValid(cursor)) {
        cursorId = new ObjectId(cursor);
      }
    }

    const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
    const C = db.collection("date_profiles");

    const match: any = {};
    if (gender) match.gender = gender;
    if (direction) match.judaism_direction = direction;
    if (country) match.country = country;

    if (withAvatar) {
      // לא משתמשים בשני $ne על אותו מפתח – במקום זה $nin
      match.avatarUrl = { $nin: [null, ""] };
    }

    if (qText) {
      const rx = new RegExp(escRx(qText), "i");
      match.$or = [
        { displayName: rx },
        { email: rx },
        { city: rx },
        { country: rx },
        { userId: rx },
      ];
    }

    const pipeline: any[] = [
      { $match: match },
      // נירמול updatedAt לשדה תאריך עזר _u (ל־keyset pagination)
      {
        $addFields: {
          _u: {
            $cond: [
              { $eq: [{ $type: "$updatedAt" }, "date"] },
              "$updatedAt",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $ifNull: ["$updatedAt", ""] },
                      regex: /^\d{4}-\d{2}-\d{2}T/,
                    },
                  },
                  { $toDate: "$updatedAt" },
                  { $toDate: "$_id" }, // fallback אם אין updatedAt תקין
                ],
              },
            ],
          },
        },
      },
    ];

    // keyset: (updatedAt, _id)
    if (cursorTime && cursorId) {
      pipeline.push({
        $match: {
          $or: [
            { _u: { $lt: cursorTime } },
            { _u: cursorTime, _id: { $lt: cursorId } },
          ],
        },
      });
    } else if (cursorId && !cursorTime) {
      pipeline.push({ $match: { _id: { $lt: cursorId } } });
    }

    pipeline.push(
      { $sort: { _u: -1, _id: -1 } },
      {
        $project: {
          // לא מחזירים _u ללקוח – שדה פנימי לחישוב cursor
          _id: 1,
          userId: 1,
          displayName: 1,
          email: 1,
          gender: 1,
          judaism_direction: 1,
          country: 1,
          city: 1,
          updatedAt: 1,
          avatarUrl: 1,
          _u: 1,
        },
      },
      { $limit: limit }
    );

    const rows = await C.aggregate(pipeline).toArray();

    // גוזרים nextCursor ע"פ הרשומה האחרונה
    let nextCursor: string | null = null;
    if (rows.length === limit) {
      const last = rows[rows.length - 1];
      const lastU: Date =
        last._u instanceof Date ? last._u : new Date(last._u as any);
      nextCursor = `${lastU.toISOString()}__${String(last._id)}`;
    }

    // מסירים _u מהאובייקטים לפני החזרה ללקוח
    const items = rows.map((r: any) => {
      const { _u, ...rest } = r;
      return { ...rest, _id: String(r._id) };
    });

    return NextResponse.json(
      { ok: true, items, nextCursor },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[GET /api/admin/date/list] error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
