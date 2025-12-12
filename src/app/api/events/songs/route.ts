// src/app/api/events/songs/route.ts
import { getCollection } from "@/lib/db/mongo";
import { NextResponse } from "next/server";

// חשוב: ריצה על Node (לא Edge) כי אנחנו משתמשים ב-mongodb driver
export const runtime = "nodejs";

/* ==================== Types ל-UI ==================== */

export type EventSongCategory =
  | "chassidic" // חסידי / חב״ד / דתי
  | "mizrahi" // מזרחי / ים תיכוני
  | "israeli" // ישראלי כללי
  | "other"; // כל מה שלא נכנס יפה

export type EventSongItem = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  category: EventSongCategory;
  slug?: string;
};

export type EventSongsResponse = {
  songs: EventSongItem[];
  categories: {
    key: EventSongCategory;
    label: string;
    count: number;
  }[];
  artists: {
    name: string;
    count: number;
  }[];
  total: number;
};

/* ==================== טיפוס למסמכים ב-Mongo ==================== */

type SongDoc = {
  _id: any;
  title: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
  source?: string;
  extId?: string;
  isReligious?: boolean;
  isActive?: boolean;
  genres?: string[];
  slug?: string | null;
};

/* ==================== עזר: מיפוי קטגוריה ==================== */

function detectCategory(doc: SongDoc): EventSongCategory {
  const artist = (doc.artist || "").toLowerCase();
  const album = (doc.album || "").toLowerCase();

  // חסידי / דתי מוכר
  if (
    artist.includes("avraham fried") ||
    artist.includes("אברהם פריד") ||
    artist.includes("yaakov shwekey") ||
    artist.includes("יעקב שוואקי") ||
    artist.includes("freilach") ||
    album.includes("chabad") ||
    album.includes("לכבוד שבת") ||
    album.includes("nigun") ||
    album.includes("ניגון")
  ) {
    return "chassidic";
  }

  // מזרחי
  if (
    artist.includes("ישי ריבו") ||
    artist.includes("ishay ribo") ||
    artist.includes("חיים ישראל") ||
    artist.includes("חנן בן ארי") ||
    album.includes("מזרחי") ||
    album.includes("sefaradi") ||
    album.includes("מזרח")
  ) {
    return "mizrahi";
  }

  // ישראלי כללי – אוספים / greatest hits
  if (
    album.includes("greatest") ||
    album.includes("hits") ||
    album.includes("best of")
  ) {
    return "israeli";
  }

  return "other";
}

/* ==================== GET /api/events/songs ==================== */

export async function GET() {
  try {
    const col = await getCollection<SongDoc>("songs");

    // מושכים את כל השירים הדתיים/פעילים (כמו ששמרת בסקריפט)
    const docs = await col
      .find(
        {
          ...(true && { isReligious: { $ne: false } }),
          ...(true && { isActive: { $ne: false } }),
        },
        {
          projection: {
            title: 1,
            artist: 1,
            album: 1,
            coverUrl: 1,
            slug: 1,
          },
        },
      )
      .sort({ artist: 1, title: 1 })
      .limit(4000)
      .toArray();

    const songs: EventSongItem[] = [];
    const artistCount = new Map<string, number>();
    const categoryCount: Record<EventSongCategory, number> = {
      chassidic: 0,
      mizrahi: 0,
      israeli: 0,
      other: 0,
    };

    for (const doc of docs) {
      const artist = doc.artist?.trim() || "Unknown";
      const category = detectCategory(doc);

      const item: EventSongItem = {
        id: String(doc._id),
        title: doc.title,
        artist,
        album: doc.album,
        coverUrl: doc.coverUrl,
        category,
        slug: doc.slug ?? undefined,
      };

      songs.push(item);

      // ספירת זמרים
      artistCount.set(artist, (artistCount.get(artist) || 0) + 1);

      // ספירת קטגוריות
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }

    // רשימת זמרים ממוינת לפי כמות שירים (יורד)
    const artists = Array.from(artistCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const categories: EventSongsResponse["categories"] = [
      {
        key: "chassidic",
        label: "חסידי / חב״ד / דתי",
        count: categoryCount.chassidic,
      },
      {
        key: "mizrahi",
        label: "מזרחי / ים תיכוני",
        count: categoryCount.mizrahi,
      },
      {
        key: "israeli",
        label: "ישראלי כללי",
        count: categoryCount.israeli,
      },
      {
        key: "other",
        label: "אחר / מגוון",
        count: categoryCount.other,
      },
    ];

    const payload: EventSongsResponse = {
      songs,
      categories,
      artists,
      total: songs.length,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error("[/api/events/songs] ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load songs" },
      { status: 500 },
    );
  }
}
