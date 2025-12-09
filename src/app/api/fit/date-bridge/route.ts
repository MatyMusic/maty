// src/app/api/fit/date-bridge/route.ts
import { NextResponse } from "next/server";

/**
 * גשר דמו בין MATY-FIT ל-MATY-DATE
 *
 * רעיון:
 * - בעתיד: כאן תשתמש במודל DateProfile מ-MATY-DATE ותבצע חישוב התאמה
 *   לפי: אוהבים ספורט, ימים פנויים, יעד (חיטוב/מסה), אזור מגורים וכו'.
 * - כרגע: מחזיר דאטה קשיח כדי שה-UI שלך יעבוד יפה.
 */

export async function GET() {
  const items = [
    {
      id: "d1",
      name: "נועה",
      city: "מודיעין",
      trainingStyle: "ריצה + חדר כושר",
      matchScore: 92,
      note: "מחפשת שותף לריצות ערב ואימוני כוח פעם-פעמיים בשבוע.",
    },
    {
      id: "d2",
      name: "יוסי",
      city: "באר יעקב",
      trainingStyle: "משקולות + קרוספיט",
      matchScore: 87,
      note: "אוהב אימונים אינטנסיביים, מחפש בת זוג שאוהבת לזוז ולא לפחד מברזל.",
    },
    {
      id: "d3",
      name: "רבקי",
      city: "ירושלים",
      trainingStyle: "הליכות + יוגה",
      matchScore: 79,
      note: "בקטע של אורח חיים בריא ורגוע, פתוחה להכיר גם דרך אימון משותף.",
    },
  ];

  return NextResponse.json({ ok: true, items });
}
