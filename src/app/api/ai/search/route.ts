// src/app/api/ai/search/route.ts
import { NextRequest, NextResponse } from "next/server";

// *** שים לב: זה מימוש DEMO כדי שלא יהיה 404 ***
// אפשר אחר כך להחליף לשאילתות אמיתיות מול MongoDB / Prisma וכו'.

type SearchHitSong = {
  id: string;
  title: string;
  artist?: string;
  cat?: string;
  tags?: string[];
  url?: string;
};

type SearchHitPost = {
  id: string;
  title: string;
  kind?: string;
  section?: string;
  slug?: string;
  excerpt?: string;
  url?: string;
};

type SearchHitProfile = {
  id: string;
  name: string;
  age?: number;
  city?: string;
  headline?: string;
  url?: string;
};

type SearchResponse = {
  ok: boolean;
  error?: string;
  q?: string;
  songs?: SearchHitSong[];
  posts?: SearchHitPost[];
  profiles?: SearchHitProfile[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    const res: SearchResponse = {
      ok: false,
      error: "חסר טקסט לחיפוש (פרמטר q ריק).",
    };
    return NextResponse.json(res, { status: 400 });
  }

  // --- כאן בעתיד אפשר לעשות שאילתות אמיתיות מול בסיס נתונים ---
  // לדוגמה (פסאודו):
  //   const db = await getMainDb();
  //   const songs = await db.collection("tracks").find({ title: { $regex: q, $i: true } }).limit(10).toArray();
  //   ...

  // כרגע: מחזיר תוצאות DEMO לפי הטקסט שחיפשת, כדי שתראה שהמסך עובד
  const demoSongs: SearchHitSong[] = [
    {
      id: "demo-song-1",
      title: `סט חתונה • ${q}`,
      artist: "MATY LIVE",
      cat: "סט חתונה",
      tags: ["חתונה", 'חב"ד', "שמחה"],
      url: "/songs/demo-song-1",
    },
    {
      id: "demo-song-2",
      title: `מיקס מזרחי • ${q}`,
      artist: "MATY DJ",
      cat: "מזרחי",
      tags: ["מזרחי", "קצבי"],
      url: "/songs/demo-song-2",
    },
  ];

  const demoPosts: SearchHitPost[] = [
    {
      id: "demo-post-1",
      title: `איך לבנות סט מושלם ל"${q}"`,
      section: "club",
      slug: "build-perfect-set-demo",
      excerpt:
        "מדריך קצר על בחירת שירים, מעבר בין סגנונות, ושמירה על אנרגיה ברצפה לאורך כל האירוע.",
      url: "/club/build-perfect-set-demo",
    },
  ];

  const demoProfiles: SearchHitProfile[] = [
    {
      id: "demo-profile-1",
      name: "פרופיל דמו • MATY-DATE",
      age: 28,
      city: "ירושלים",
      headline: `אוהב/ת ${q}, מוזיקה חב\"דית ומפגשים חברתיים.`,
      url: "/date/profile/demo-profile-1",
    },
  ];

  const res: SearchResponse = {
    ok: true,
    q,
    songs: demoSongs,
    posts: demoPosts,
    profiles: demoProfiles,
  };

  return NextResponse.json(res, { status: 200 });
}
