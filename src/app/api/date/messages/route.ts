// src/app/api/date/messages/route.ts
// ------------------------------------------------------
// API לצ'אט בין שני צדדים במערכת MATY-DATE
// GET – שליפת הודעות עבור מאץ' בין שני משתמשים
// POST – שליחת הודעה חדשה בתוך מאץ'
// ------------------------------------------------------

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { appendMessage, listMessages } from "@/lib/db/date-chat-repo";
import { isMatch } from "@/lib/db/date-like";

/* ================== Helpers ================== */

function getUserIdFromSession(s: any): string | null {
  if (!s?.user) return null;
  // אם הוספת session.user.id בקולבק – ניקח אותו
  const id = (s.user as any).id;
  if (id) return String(id);

  // נפילה חכמה ל-email אם אין id
  const email = (s.user as any).email;
  return email ? String(email) : null;
}

/* ================== GET – שליפת שיחה ==================
   /api/date/messages?other=<userId>&limit=40&since=<cursor>
   - other: userId של הצד השני
   - limit (אופציונלי): כמה הודעות (ברירת מחדל 40, מקסימום 200)
   - since (אופציונלי): cursor (ObjectId או createdAt ISO)
   מחזיר:
   {
     ok: true,
     matchId: "...",
     rows: [ { _id, matchId, fromUserId, text, createdAt }, ... ],
     nextCursor: string | null
   }
======================================================== */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const meId = getUserIdFromSession(session);

    if (!meId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const other = url.searchParams.get("other");
    const limitParam = url.searchParams.get("limit");
    const since = url.searchParams.get("since");

    if (!other) {
      // אין למי – נחזיר ריק
      return NextResponse.json(
        { ok: true, matchId: null, rows: [], nextCursor: null },
        { status: 200 },
      );
    }

    const otherId = String(other).trim();
    if (!otherId || otherId === meId) {
      return NextResponse.json({ error: "invalid_target" }, { status: 400 });
    }

    const limit = limitParam ? Number(limitParam) : undefined;

    // חייב להיות מאץ' הדדי בשביל צ'אט
    const m = await isMatch(meId, otherId);
    if (!m.match || !m.matchId) {
      return NextResponse.json(
        { error: "no_match", message: "אין מאץ' פעיל בין המשתמשים." },
        { status: 403 },
      );
    }

    const { rows, nextCursor } = await listMessages({
      matchId: m.matchId,
      limit,
      since,
    });

    return NextResponse.json(
      {
        ok: true,
        matchId: m.matchId,
        rows,
        nextCursor,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("[api/date/messages][GET] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/* ================== POST – שליחת הודעה ==================
   BODY:
   {
     "receiverId": "<userId של הצד השני>",
     "content": "טקסט ההודעה"
   }

   מחזיר:
   {
     ok: true,
     matchId: "...",
     message: { _id, matchId, fromUserId, text, createdAt }
   }
======================================================== */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const meId = getUserIdFromSession(session);

    if (!meId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "bad_json" }, { status: 400 });
    }

    const receiverId = String(body?.receiverId || "").trim();
    const contentRaw = String(body?.content || "");
    const content = contentRaw.trim();

    if (!receiverId || receiverId === meId) {
      return NextResponse.json({ error: "invalid_target" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "empty_message" }, { status: 400 });
    }

    // ווידוא שקיים מאץ' הדדי, וגם לקבל matchId
    const m = await isMatch(meId, receiverId);
    if (!m.match || !m.matchId) {
      return NextResponse.json(
        { error: "no_match", message: "אי אפשר לשלוח הודעה בלי מאץ' הדדי." },
        { status: 403 },
      );
    }

    const saved = await appendMessage({
      matchId: m.matchId,
      fromUserId: meId,
      text: content,
    });

    return NextResponse.json(
      {
        ok: true,
        matchId: m.matchId,
        message: saved,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("[api/date/messages][POST] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
