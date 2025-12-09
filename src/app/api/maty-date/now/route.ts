// src/app/api/maty-date/now/route.ts
import db from "@/lib/mongoose";
import User from "@/models/User";
import { NextResponse } from "next/server";

// אופציונלי: אם תרצה למשוך את ה-count מה־API הקיים
async function getOnlineCountFromPresence() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/presence/count`, {
      cache: "no-store",
    });
    const ct = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!ct.includes("application/json")) {
      console.error("[DATE/NOW] presence non-JSON:", res.status, raw);
      return null;
    }

    const j = JSON.parse(raw) as { ok?: boolean; count?: number };
    if (!res.ok || !j.ok) return null;
    return j.count ?? null;
  } catch (e) {
    console.error("[DATE/NOW] presence fetch error:", e);
    return null;
  }
}

export async function GET() {
  try {
    await db(); // חיבור למונגו (לפי lib/mongoose שלך)

    // 1. אונליין – כרגע מדמו של presence API
    const onlineCount = (await getOnlineCountFromPresence()) ?? 0; // אם יש שגיאה – ניפול ל־0 במקום להתרסק

    // 2. משתמש להיילייט – ניקח משתמש ראשון/אקראי
    const highlightRaw = await User.findOne({}, { name: 1, city: 1 }).lean();

    const highlightUser = highlightRaw
      ? {
          name: highlightRaw.name || "משתמש/ת",
          age: 26, // TODO: להחליף כשיהיה שדה age בפרופיל היכרויות
          city: highlightRaw.city || "מיקום יתעדכן בהמשך",
          style: "chabad" as const, // גם זה – כרגע דמי
        }
      : {
          name: "דנה",
          age: 26,
          city: "ירושלים",
          style: "chabad" as const,
        };

    const data = {
      ok: true,
      snapshotAt: new Date().toISOString(),
      summary: {
        onlineCount,
        // כרגע placeholders – בהמשך נחבר לפרופילים / מיקום אמיתי
        nearbyCount: 5,
        similarTasteCount: 12,
      },
      highlightUser,
      message: "מצב MATY-DATE (חלקית אמיתי, חלקית דמו)",
    };

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("[DATE/NOW] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "שגיאה בטעינת מצב MATY-DATE",
      },
      { status: 500 },
    );
  }
}
