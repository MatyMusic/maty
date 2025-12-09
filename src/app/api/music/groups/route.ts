/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/music/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** ==================== Types ==================== */
type Status = "public" | "pending" | "archived";
type GroupDoc = {
  _id?: ObjectId;
  title: string;
  desc?: string;
  slug?: string;
  city?: string;
  daws?: string[];
  purposes?: string[];
  skills?: string[];
  radiusKm?: number;
  loc?: { type: "Point"; coordinates: [number, number] };
  ownerId?: string;
  ownerName?: string;
  members?: string[];
  status: Status;
  createdAt: Date;
  updatedAt: Date;
};

type GetAuthResult = {
  ok: boolean;
  userId?: string | null;
  userName?: string | null;
  role?: string | null;
  isAdmin: boolean;
  isBypass: boolean;
};

const toInt = (v: string | null, d = 0) => {
  if (!v) return d;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const toNum = (v: string | null, d = 0) => {
  if (!v) return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/** ==================== Auth helpers (Next 15-safe) ==================== */
async function getAuth(): Promise<GetAuthResult> {
  // Next 15: חייבים await
  const ck = await cookies();
  const hd = await headers();

  const bypass =
    ck.get("maty_admin_bypass")?.value === "1" ||
    ck.get("mm-admin")?.value === "1" ||
    hd.get("x-maty-admin") === "1" ||
    process.env.DEMO_UNLOCK === "1" ||
    process.env.ALLOW_UNSAFE_ADMIN === "1";

  let userId: string | null = null;
  let userName: string | null = null;
  let role: string | null = null;

  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    userId = (session as any)?.user?.id || null;
    userName = (session as any)?.user?.name || null;
    role = (session as any)?.user?.role || null;
  } catch {
    // אין next-auth — נתעלם
  }

  const isAdmin =
    bypass || role === "admin" || role === "superadmin" ? true : false;

  return { ok: true, userId, userName, role, isAdmin, isBypass: bypass };
}

/** ==================== DB helpers ==================== */
async function groupsCol() {
  const col = await getCollection<GroupDoc>("music_groups");
  // אינדקסים (idempotent)
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col
    .createIndex({ status: 1, ownerId: 1, createdAt: -1 })
    .catch(() => {});
  await col.createIndex({ slug: 1 }, { unique: false }).catch(() => {});
  await col.createIndex({ loc: "2dsphere" as any }).catch(() => {});
  await col
    .createIndex(
      {
        title: "text",
        desc: "text",
        city: "text",
        purposes: 1,
        skills: 1,
        daws: 1,
      } as any,
      { name: "groups_text" },
    )
    .catch(() => {});
  return col;
}

function slugify(s: string) {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** ==================== GET: list with filters + cursor ==================== */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);

    const q = (url.searchParams.get("q") || "").trim();
    const city = (url.searchParams.get("city") || "").trim();
    const daws = url.searchParams.getAll("daw").filter(Boolean);
    const purposes = url.searchParams.getAll("purpose").filter(Boolean);
    const skills = url.searchParams.getAll("skill").filter(Boolean);

    const radiusKm = toInt(url.searchParams.get("radiusKm"), 0);
    const lng = toNum(url.searchParams.get("lng"), NaN);
    const lat = toNum(url.searchParams.get("lat"), NaN);

    const mine = url.searchParams.get("mine") === "1";
    const limit = clamp(toInt(url.searchParams.get("limit"), 24), 6, 60);

    const cursor = url.searchParams.get("cursor");
    const cursorId =
      cursor && ObjectId.isValid(cursor) ? new ObjectId(cursor) : null;

    const col = await groupsCol();

    // בסיס פילטר
    const $and: any[] = [];

    // הרשאות תצוגה:
    if (auth.isAdmin) {
      // אדמין רואה הכל, אפשר להרחיב פילטר סטטוסים אם תרצה
    } else if (mine && auth.userId) {
      // שלי: גם pending
      $and.push({
        $or: [
          { ownerId: auth.userId },
          { members: auth.userId },
          { status: "public" },
        ],
      });
    } else {
      // ציבורי בלבד
      $and.push({ status: "public" as Status });
    }

    if (q) {
      // טקסט מלא + regex רך
      $and.push({
        $or: [
          { $text: { $search: q } as any },
          {
            title: {
              $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          },
          {
            desc: {
              $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          },
        ],
      });
    }
    if (city) $and.push({ city: new RegExp(`^${city}$`, "i") });
    if (daws.length) $and.push({ daws: { $all: daws } });
    if (purposes.length) $and.push({ purposes: { $all: purposes } });
    if (skills.length) $and.push({ skills: { $all: skills } });

    if (radiusKm > 0 && Number.isFinite(lng) && Number.isFinite(lat)) {
      // משתמשים ב-geoWithin כדי שנוכל עדיין למיין לפי createdAt + cursor
      const rad = radiusKm / 6378.1; // לק"מ → רדיוסים של כדור הארץ
      $and.push({
        loc: {
          $geoWithin: {
            $centerSphere: [[lng, lat], rad],
          },
        },
      });
    }

    if (cursorId) {
      $and.push({ _id: { $lt: cursorId } }); // פאג'ינציה אחורה לפי זמן יצירה
    }

    const filter = $and.length ? { $and } : {};

    const items = await col
      .find(filter, { projection: {} })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const nextCursor =
      items.length === limit ? String(items[items.length - 1]._id) : null;

    return NextResponse.json(
      { ok: true, items, nextCursor },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}

/** ==================== POST: create group ==================== */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();

    // דרישת התחברות או BYPASS/DEMO
    if (!auth.userId && !auth.isBypass && !auth.isAdmin) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_json" },
        { status: 400 },
      );
    }

    // מאפשרים גם body.action === "create", אך לא חובה
    const title = String(body?.title || "").trim();
    const desc = String(body?.desc || "").trim();
    const city = (body?.city ? String(body.city) : "").trim() || undefined;

    const daws = Array.isArray(body?.daws)
      ? body.daws.filter(Boolean).map(String)
      : [];
    const purposes = Array.isArray(body?.purposes)
      ? body.purposes.filter(Boolean).map(String)
      : [];
    const skills = Array.isArray(body?.skills)
      ? body.skills.filter(Boolean).map(String)
      : [];

    const radiusKm = Number(body?.radiusKm) || 0;
    const lng = Number(body?.lng);
    const lat = Number(body?.lat);

    if (!title || title.length < 2) {
      return NextResponse.json(
        { ok: false, error: "missing_title" },
        { status: 400 },
      );
    }

    const now = new Date();
    const col = await groupsCol();

    const slugBase = slugify(title);
    const slug = slugBase || `group-${now.getTime()}`;

    const doc: GroupDoc = {
      title,
      desc,
      slug,
      city,
      daws,
      purposes,
      skills,
      radiusKm: radiusKm > 0 ? radiusKm : undefined,
      loc:
        Number.isFinite(lng) && Number.isFinite(lat)
          ? { type: "Point", coordinates: [lng, lat] }
          : undefined,
      ownerId: auth.userId || "bypass",
      ownerName: auth.userName || undefined,
      members: auth.userId ? [auth.userId] : [],
      status: auth.isAdmin ? "public" : "pending",
      createdAt: now,
      updatedAt: now,
    };

    const res = await col.insertOne(doc as any);
    const item = await col.findOne({ _id: res.insertedId });

    return NextResponse.json(
      { ok: true, item },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
