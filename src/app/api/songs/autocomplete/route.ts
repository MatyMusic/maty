// src/app/api/songs/autocomplete/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

/** נירמול חיפוש בעברית (הסרת ניקוד/גרשיים/רווחים כפולים) */
function normalizeHebrew(s: string) {
  return (
    s
      .toLowerCase()
      // ניקוד
      .replace(/[\u0591-\u05C7]/g, "")
      // גרשיים/מירכאות/מקפים ורווחים עודפים
      .replace(/[״"׳'`´\-\u05F4]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** בונה ביטוי חיפוש Regex בטוח מהשאילתה (ממוסך תווים מסוכנים) */
function safeRegexFromQuery(q: string) {
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // חיפוש “מכיל” בכל מקום במחרוזת
  return new RegExp(esc, "i");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = (url.searchParams.get("q") || "").slice(0, 80);
    const q = normalizeHebrew(raw);
    if (!q) return NextResponse.json({ items: [] }, { status: 200 });

    const db = await getDb();
    const col = db.collection("songs");

    // שדות להחזרה (רזים ומהירים)
    const projection = {
      _id: 0,
      title_he: 1,
      slug: 1,
      artist_he: 1,
      genre: 1,
    } as const;

    // דפוסי חיפוש: גם title_he_norm וגם keywords
    const rx = safeRegexFromQuery(q);

    // נסה קודם חיפוש טקסטואלי אם יש score; אם לא תומך → regex
    const pipeline = [
      {
        $match: {
          $or: [
            { title_he_norm: rx },
            { keywords: rx }, // keywords: string[] (נניח קיימות במסמכים)
          ],
        },
      },
      // בוסט לז'אנרים פופולריים (אופציונלי)
      {
        $addFields: {
          _score: {
            $add: [
              {
                $cond: [
                  { $regexMatch: { input: "$title_he_norm", regex: rx } },
                  5,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $toString: "$keywords" },
                      regex: rx,
                    },
                  },
                  3,
                  0,
                ],
              },
              {
                $cond: [
                  { $in: ["$genre", ["mizrahi", "chabad", "fun", "soft"]] },
                  1,
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { _score: -1, plays_all_time: -1, title_he: 1 } }, // אם יש לך plays_all_time
      { $project: projection },
      { $limit: 12 },
    ];

    const items = await col
      .aggregate<typeof projection extends infer P ? any : never>(pipeline)
      .toArray();

    return NextResponse.json(
      { items },
      {
        status: 200,
        // מותר קאש קצר ל־autocomplete
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=30",
        },
      }
    );
  } catch (e) {
    console.error("autocomplete error", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
