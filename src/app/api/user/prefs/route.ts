// app/api/user/prefs/route.ts
import { NextResponse } from "next/server";
// אם יש לך getServerSession/authOptions – אפשר לצרף, אבל לא חובה לפתור את ה-500
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

const defaultPrefs = {
  theme: "system",
  language: "he",
  autoplay: false,
};

export async function GET() {
  try {
    // דוגמה אם תרצה לטעון פרפ' מה-DB/סשן:
    // const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json(defaultPrefs, { status: 200 });
    // const prefs = await db.collection("prefs").findOne({ userId: session.user.id }) ?? defaultPrefs;
    // return NextResponse.json(prefs, { status: 200 });

    // בינתיים: החזר תמיד ברירת־מחדל כדי להפסיק את ה-500
    return NextResponse.json(defaultPrefs, { status: 200 });
  } catch (e) {
    console.error("prefs GET failed:", e);
    // גם בשגיאה – אל תתרסק; החזר ברירת־מחדל
    return NextResponse.json(defaultPrefs, { status: 200 });
  }
}
