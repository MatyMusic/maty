// src/app/api/user/messages/unread/route.ts
import { getMongoClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth";

const DB_NAME = process.env.MONGODB_DB || "maty-music";
const COLLECTION = "user-messages";

type UnreadResponse = {
  ok: boolean;
  count: number;
  error?: string;
};

export async function GET(
  _req: NextRequest,
): Promise<NextResponse<UnreadResponse>> {
  try {
    // const session = await auth();
    // const userId = session?.user?.id ? String(session.user.id) : null;

    // לעכשיו – אם אין userId פשוט נחזיר 0
    // אם תרצה להקשיח: החזר 401 במקום
    const userId = null as string | null;

    if (!userId) {
      return NextResponse.json({ ok: true, count: 0 }, { status: 200 });
    }

    const client = await getMongoClient("main");
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const count = await col.countDocuments({
      userId,
      read: { $ne: true },
    });

    return NextResponse.json({ ok: true, count }, { status: 200 });
  } catch (err) {
    console.error("GET /api/user/messages/unread error:", err);
    return NextResponse.json(
      { ok: false, count: 0, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
