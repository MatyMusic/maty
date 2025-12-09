// src/app/api/tracks/route.ts
import { getMongoClient } from "@/lib/db/mongo-client";
import type { Filter } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackDoc = {
  _id: any;
  title?: string;
  artist?: string;
  artists?: string[];
  cover?: string;
  coverUrl?: string;
  thumbnails?: { [k: string]: { url: string } };
  audioUrl?: string;
  previewUrl?: string;
  embedUrl?: string;
  videoId?: string;
  externalUrl?: string;
  tags?: string[];
  genres?: string[];
  categories?: string[];
  category?: string; // זה מה ש- /api/admin/tracks שומר
  featured?: boolean;
  playable?: boolean;
  isDisabled?: boolean;
  published?: boolean;
  durationSec?: number;
  source?: string;
  likes?: number;
  updatedAt?: Date;
  createdAt?: Date;
};

function toInt(v: string | null, d: number): number {
  if (!v) return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function toArray(input?: string | null) {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const genreParam = (searchParams.get("genre") || "").trim();
    const featuredParam = searchParams.get("featured");
    const includeUnplayable = searchParams.get("includeUnplayable") === "1";

    const skip = toInt(searchParams.get("skip"), 0);
    const limit = Math.min(
      Math.max(toInt(searchParams.get("limit"), 24), 1),
      96,
    );

    const client = await getMongoClient("tracks");
    const dbName = process.env.MONGODB_DB || "maty-music";
    const colName = process.env.TRACKS_COLLECTION || "tracks";
    const db = client.db(dbName);
    const col = db.collection<TrackDoc>(colName);

    const filter: Filter<TrackDoc> = {
      isDisabled: { $ne: true },
      published: { $ne: false },
    };

    // playable / audioUrl – כברירת מחדל נביא רק כאלה שאפשר לנגן
    if (!includeUnplayable) {
      (filter as any).$or = [
        { playable: { $ne: false } },
        { audioUrl: { $exists: true, $ne: "" } },
        { previewUrl: { $exists: true, $ne: "" } },
        { embedUrl: { $exists: true, $ne: "" } },
      ];
    }

    // ז'אנר / קטגוריה – יכול להיות גם רשימה "chabad,mizrahi"
    const genres = toArray(genreParam);
    if (genres.length) {
      const existingOr = ((filter as any).$or || []) as any[];

      (filter as any).$or = [
        ...existingOr,
        { genres: { $in: genres } },
        { categories: { $in: genres } },
        { tags: { $in: genres } },
        { category: { $in: genres } }, // זה השדה שה- /api/admin/tracks כותב
      ];
    }

    // featured
    if (featuredParam === "1" || featuredParam === "true") {
      (filter as any).featured = true;
    }

    // חיפוש טקסטואלי בסיסי
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const existingOr = ((filter as any).$or || []) as any[];
      (filter as any).$or = [
        ...existingOr,
        { title: rx },
        { artist: rx },
        { artists: { $elemMatch: { $regex: rx } } },
        { tags: { $elemMatch: { $regex: rx } } },
      ];
    }

    const cursor = col
      .find(filter)
      .sort({
        featured: -1,
        updatedAt: -1,
        createdAt: -1,
        _id: -1,
      })
      .skip(skip)
      .limit(limit);

    const docs = await cursor.toArray();

    const rows = docs
      .map((r) => {
        const coverUrl =
          r.coverUrl ||
          r.cover ||
          r.thumbnails?.high?.url ||
          r.thumbnails?.medium?.url ||
          r.thumbnails?.default?.url ||
          "/assets/logo/maty-music-wordmark.svg";

        const audio = r.audioUrl || r.previewUrl || undefined; // אם רק וידאו – אפשר בהמשך להוסיף פרוקסי

        if (!audio) return null;

        return {
          id: String(r._id),
          title: r.title || "Track",
          artist:
            r.artist ||
            (Array.isArray(r.artists) && r.artists.length
              ? r.artists[0]
              : "Maty Music"),
          coverUrl,
          audioUrl: audio,
          externalUrl: r.externalUrl,
          tags: r.tags || [],
          genres: r.genres || r.categories || [],
          categories: r.categories || r.genres || r.tags || [],
          category: r.category,
          featured: !!r.featured,
          likes: r.likes ?? 0,
          durationSec: r.durationSec,
          source: r.source,
        };
      })
      .filter(Boolean) as {
      id: string;
      title: string;
      artist: string;
      coverUrl?: string;
      audioUrl?: string;
      externalUrl?: string;
      tags: string[];
      genres: string[];
      categories: string[];
      category?: string;
      featured: boolean;
      likes?: number;
      durationSec?: number;
      source?: string;
    }[];

    const next = rows.length === limit ? skip + limit : null;

    // תאימות מלאה:
    // - GenrePageClient משתמש ב-items (audioUrl + coverUrl + title + artist)
    // - חלקים אחרים באתר משתמשים ב-rows/next
    return NextResponse.json({
      ok: true,
      rows,
      items: rows,
      next,
    });
  } catch (err: any) {
    console.error("tracks route error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
