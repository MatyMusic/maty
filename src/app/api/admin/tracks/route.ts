// src/app/api/admin/tracks/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongo";
import type { TrackCategory } from "@/types/music";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

/** עטיפה ברירת מחדל לפי ז׳אנר – תואם לאווטארים באתר */
function defaultCoverForCategory(cat: TrackCategory): string {
  switch (cat) {
    case "chabad":
      return "/assets/images/avatar-chabad.png";
    case "mizrahi":
      return "/assets/images/avatar-mizrahi.png";
    case "soft":
      return "/assets/images/avatar-soft.png";
    case "fun":
    default:
      return "/assets/images/avatar-fun.png";
  }
}

/**
 * בדיקת אדמין:
 * 1. אם יש כותרת x-maty-admin=1 → מאשרים (bypass פנימי לפאנל)
 * 2. אחרת – בודקים session ו־role
 */
async function requireAdmin() {
  const hdrs = await nextHeaders();
  const adminHeader = hdrs.get("x-maty-admin");

  // bypass פנימי מה־Admin UI
  if (adminHeader === "1") return;

  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;

  if (!session || !["admin", "superadmin"].includes(role)) {
    throw new Error("forbidden");
  }
}

/** GET /api/admin/tracks?q=&category=&page=&pageSize= */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const category = (searchParams.get("category") || "").trim() as
      | ""
      | TrackCategory;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10)),
    );

    const col = await getCollection("tracks");
    const filter: any = {};
    if (category) filter.category = category;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { artist: rx }, { tags: rx }];
    }

    const total = await col.countDocuments(filter);
    const rows = await col
      .find(filter)
      .project({
        _id: 1,
        title: 1,
        artist: 1,
        category: 1,
        duration: 1,
        audioUrl: 1,
        coverUrl: 1,
        mediaPublicId: 1,
        published: 1,
        featured: 1,
        order: 1,
        tags: 1,
        externalUrl: 1,
        createdAt: 1,
      })
      .sort({ order: 1, createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return NextResponse.json({ ok: true, rows, total, page, pageSize });
  } catch (e: any) {
    if (e?.message === "forbidden") return bad("forbidden", 403);
    console.error("/api/admin/tracks GET error:", e?.message || e);
    return bad(e?.message || "server_error", 500);
  }
}

/** POST /api/admin/tracks – יצירה/עדכון לפי mediaPublicId */
export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const {
      title,
      artist = "Maty Music",
      category,
      audioUrl,
      coverUrl = "",
      mediaPublicId,
      duration = 0,
      published = true,
      featured = false,
      order = 0,
      tags = [],
      externalUrl = "",
    } = body as {
      title: string;
      artist?: string;
      category: TrackCategory;
      audioUrl: string;
      coverUrl?: string;
      mediaPublicId: string;
      duration?: number;
      published?: boolean;
      featured?: boolean;
      order?: number;
      tags?: string[];
      externalUrl?: string;
    };

    if (!title || !category || !audioUrl || !mediaPublicId) {
      return bad("missing fields (title/category/audioUrl/mediaPublicId)");
    }

    const finalCover =
      String(coverUrl || "").trim() || defaultCoverForCategory(category);

    const doc = {
      title: String(title).trim(),
      artist: String(artist).trim(),
      category,
      audioUrl: String(audioUrl),
      coverUrl: finalCover,
      mediaPublicId: String(mediaPublicId),
      duration: Number(duration || 0) || 0,
      published: !!published,
      featured: !!featured,
      order: Number(order || 0) || 0,
      tags: Array.isArray(tags) ? tags.map(String) : [],
      externalUrl: String(externalUrl || ""),
      updatedAt: new Date(),
    };

    const col = await getCollection("tracks");
    await col.updateOne(
      { mediaPublicId: doc.mediaPublicId },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "forbidden") return bad("forbidden", 403);
    console.error("/api/admin/tracks POST error:", e?.message || e);
    return bad(e?.message || "server_error", 500);
  }
}

/**
 * DELETE /api/admin/tracks
 * גוף הבקשה (JSON):
 * - ids: string[]   → מחיקת טראקים לפי _id
 * - category + all=true → מחיקת כל הטראקים בקטגוריה
 */
export async function DELETE(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    const all = body.all === true;
    const category = (body.category || "").trim() as "" | TrackCategory;

    const col = await getCollection("tracks");

    let result;
    if (ids.length) {
      const objectIds = ids
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ObjectId[];

      if (!objectIds.length) {
        return bad("no valid ids provided");
      }

      result = await col.deleteMany({ _id: { $in: objectIds } });
    } else if (all && category) {
      result = await col.deleteMany({ category });
    } else {
      return bad("missing ids or (all+category) for delete");
    }

    return NextResponse.json({
      ok: true,
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (e: any) {
    if (e?.message === "forbidden") return bad("forbidden", 403);
    console.error("/api/admin/tracks DELETE error:", e?.message || e);
    return bad(e?.message || "server_error", 500);
  }
}
