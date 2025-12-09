// src/app/api/music/route.ts
import { getCollection } from "@/lib/mongo";
import type { TrackCategory } from "@/types/music";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type Track = {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
  tags?: string[];
  cat?: TrackCategory;
};

// ברירות מחדל לפי קטגוריה – אפשר להתאים למסלולים שיש לך בפאבליק
const CAT_DEFAULT_COVER: Record<TrackCategory, string> = {
  chabad: "/assets/images/avatar-chabad.png",
  mizrahi: "/assets/images/avatar-mizrahi.png",
  soft: "/assets/images/avatar-soft.png",
  fun: "/assets/images/avatar-fun.png",
};

// דמואים – פולבק אם אין עדיין כלום ב־DB
const DEMOS_BY_CAT: Record<string, Track[]> = {
  chabad: [
    {
      id: "demo-chabad-1",
      title: "ניגון התעוררות (demo)",
      artist: "Maty Music · חסידי",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      cover: CAT_DEFAULT_COVER.chabad,
      tags: ["chabad", "nigun"],
      cat: "chabad",
    },
  ],
  mizrahi: [
    {
      id: "demo-mizrahi-1",
      title: "חפלה 1 (demo)",
      artist: "Maty Music · מזרחי",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      cover: CAT_DEFAULT_COVER.mizrahi,
      tags: ["mizrahi"],
      cat: "mizrahi",
    },
  ],
  soft: [
    {
      id: "demo-soft-1",
      title: "בלדה שקטה (demo)",
      artist: "Maty Music · שקט",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      cover: CAT_DEFAULT_COVER.soft,
      tags: ["soft"],
      cat: "soft",
    },
  ],
  fun: [
    {
      id: "demo-fun-1",
      title: "מסיבה 1 (demo)",
      artist: "Maty Music · מקפיץ",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      cover: CAT_DEFAULT_COVER.fun,
      tags: ["fun"],
      cat: "fun",
    },
  ],
};

function fallbackCover(
  cat: TrackCategory | undefined,
  docCover?: string | null,
) {
  if (docCover && docCover.trim()) return docCover;
  if (cat && CAT_DEFAULT_COVER[cat]) return CAT_DEFAULT_COVER[cat];
  return "/assets/logo/maty-music-wordmark.svg";
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const catParam = (url.searchParams.get("cat") || "") as TrackCategory | "";
    const tag = url.searchParams.get("tag") || "";
    const limitParam = url.searchParams.get("limit") || "20";
    const limit = Math.max(1, Math.min(100, Number(limitParam) || 20));

    const col = await getCollection("tracks");

    const filter: any = { published: true };
    if (catParam) filter.category = catParam;
    if (tag === "hero") filter.featured = true; // שירים מובלטים

    const docs = await col
      .find(filter)
      .sort({ order: 1, createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    let tracks: Track[] = docs.map((d: any) => ({
      id: String(d._id || d.mediaPublicId || d.title),
      title: String(d.title || "Untitled"),
      artist: String(d.artist || "Maty Music"),
      src: String(d.audioUrl),
      cover: fallbackCover(d.category as TrackCategory | undefined, d.coverUrl),
      tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
      cat: d.category as TrackCategory | undefined,
    }));

    // אם אין בכלל ב־DB – נשתמש בדמואים הישנים
    if (!tracks.length) {
      if (catParam && DEMOS_BY_CAT[catParam]) {
        tracks = DEMOS_BY_CAT[catParam].slice(0, limit);
      } else {
        tracks = Object.values(DEMOS_BY_CAT).flat().slice(0, limit);
      }
    }

    // hero – נחזיר 1–3 בלבד
    if (tag === "hero") {
      tracks = tracks.slice(0, 3);
    }

    return NextResponse.json({ ok: true, tracks });
  } catch (e: any) {
    console.error("[/api/music] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 },
    );
  }
}
