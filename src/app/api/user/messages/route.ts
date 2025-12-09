// src/app/api/user/messages/route.ts
import { getMongoClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
// אם יש לך auth מוכן (next-auth App Router):
// import { auth } from "@/auth";

const DB_NAME = process.env.MONGODB_DB || "maty-music";
const COLLECTION = "user-messages"; // תוכל לשנות לשם שיש לך בפועל

type MessageKind = "system" | "music" | "date" | string;

type UserMessage = {
  _id: string;
  userId: string;
  kind: MessageKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO
  meta?: Record<string, any>;
};

type MessagesListResponse = {
  ok: boolean;
  items?: UserMessage[];
  nextCursor?: string | null;
  error?: string;
};

function mapDocToUserMessage(doc: any): UserMessage {
  const created =
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : typeof doc.createdAt === "string"
        ? doc.createdAt
        : new Date().toISOString();

  return {
    _id: doc._id?.toString() ?? "",
    userId: String(doc.userId ?? ""),
    kind: (doc.kind as MessageKind) || "system",
    title: String(doc.title ?? "ללא כותרת"),
    body: String(doc.body ?? ""),
    read: Boolean(doc.read),
    createdAt: created,
    meta: doc.meta && typeof doc.meta === "object" ? doc.meta : undefined,
  };
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<MessagesListResponse>> {
  try {
    // ====== שליפת userId ======
    // אופציה א': אם כבר יש לך auth() (next-auth בסגנון App Router) – תפעיל כאן:
    // const session = await auth();
    // const userId = session?.user?.id ? String(session.user.id) : null;

    // אופציה ב' (פשוטה): כרגע לא נאכוף התחברות – רק נדרוש userId מה-query או נחזיר ריק
    const { searchParams } = new URL(req.url);
    const qpUser = searchParams.get("userId");
    const userId = qpUser ? String(qpUser) : null;

    // אם אתה רוצה לחייב התחברות – תחליף בזה:
    // if (!userId) {
    //   return NextResponse.json(
    //     { ok: false, error: "UNAUTHORIZED" },
    //     { status: 401 },
    //   );
    // }

    if (!userId) {
      // לעכשיו נחזיר פשוט רשימה ריקה – בלי להפיל את העמוד
      return NextResponse.json(
        { ok: true, items: [], nextCursor: null },
        { status: 200 },
      );
    }

    // ====== limit + cursor ======
    const limitRaw = searchParams.get("limit") || "20";
    const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 50);

    const cursor = searchParams.get("cursor");
    const query: any = { userId };

    // נשתמש ב-createdAt כ-cursor – מיושן יותר (פחות) מהערך שנשלח
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const client = await getMongoClient("main");
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    // נביא limit+1 כדי לדעת אם יש עוד
    const docs = await col
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    let nextCursorOut: string | null = null;
    let slice = docs;

    if (docs.length > limit) {
      const last = docs[docs.length - 1];
      slice = docs.slice(0, limit);
      const lastCreated: Date =
        last.createdAt instanceof Date ? last.createdAt : new Date();
      nextCursorOut = lastCreated.toISOString();
    }

    const items = slice.map(mapDocToUserMessage);

    return NextResponse.json(
      {
        ok: true,
        items,
        nextCursor: nextCursorOut,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("GET /api/user/messages error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
