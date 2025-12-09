// src/app/api/admin/club/stats/route.ts
import connectDB from "@/lib/db/mongoose";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // אם תרצה – אפשר גם להוריד את השורה הזאת, השארתי כדי לשמור על חיבור DB
    await connectDB().catch(() => null);

    // כרגע ערכי דמה – נעדכן כשתהיה מערכת CLUB אמיתית
    const postsTotal = 0;
    const postsPending = 0;
    const promotions = 0;
    const reportsOpen = 0;
    const users = 0;

    // גרף דמה (14 ימים אחורה) כדי שהדשבורד לא יהיה ריק
    const postsByDay = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: d.toISOString(),
        count: Math.max(0, Math.round(20 + 10 * Math.sin(i / 2))),
      };
    });

    const newUsersByDay = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: d.toISOString(),
        count: Math.max(0, Math.round(4 + 3 * Math.cos(i / 1.5))),
      };
    });

    const activeHours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: Math.round(5 + 4 * Math.sin((h - 9) / 3)),
    }));

    return NextResponse.json({
      ok: true,
      postsTotal,
      postsPending,
      promotions,
      reportsOpen,
      users,
      postsByDay,
      newUsersByDay,
      topTags: [{ tag: "כללי", count: postsTotal }],
      activeHours,
    });
  } catch (e: any) {
    console.error("[/api/admin/club/stats] error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
