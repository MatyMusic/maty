// src/app/api/date/messages/unread/route.ts
import { getCurrentUserId } from "@/lib/auth/currentUserId";
import { NextResponse } from "next/server";
// אם יש לך getDb, נשתמש בו בהמשך:
// import { getDb } from "@/lib/mongo";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    // אם המשתמש לא מחובר – פשוט מחזירים 0, לא שגיאה
    if (!userId) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // 🔒 כרגע לא נוגעים ב-DB כדי לא להרוס כלום
    // כאן בעתיד תוכל להחליף לטענת אמת מהמסד:
    //
    // const db = await getDb();
    // const messages = db.collection("date_messages");
    // const count = await messages.countDocuments({
    //   to: userId,
    //   readAt: { $exists: false },
    //   deletedForTo: { $ne: true },
    // });

    const count = 0;

    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, count: 0 }, { status: 500 });
  }
}
