// src/app/api/metrics/home/route.ts
import { NextResponse } from "next/server";
// אפשר מאוחר יותר להוסיף DB אמיתי, Counters, Aggregations וכו'
// לדוגמה: import User from "@/models/User"; import Post from "@/models/Post";

export async function GET() {
  try {
    // שלב ראשון: דמו. בהמשך נחבר לנתונים אמיתיים.
    const now = new Date();

    const metrics = {
      ok: true,
      generatedAt: now.toISOString(),
      // מדדים בסיסיים לדף הבית / HEADER
      totals: {
        users: 1, // אתה 😄 – בהמשך נמשוך אמיתי מה־DB
        clubPosts: 0,
        musicTracks: 0,
        liveNow: 0,
      },
      // אפשרות להתפתחות – גרף, מגמה יומית וכו'
      today: {
        newUsers: 0,
        newClubPosts: 0,
        newTracks: 0,
      },
      message: "מדדי בית (דמו) נטענו בהצלחה",
    };

    return NextResponse.json(metrics, { status: 200 });
  } catch (e: any) {
    console.error("[METRICS/HOME] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "שגיאה בטעינת מדדי דף הבית",
      },
      { status: 500 },
    );
  }
}
