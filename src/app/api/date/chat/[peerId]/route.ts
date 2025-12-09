// src/app/api/date/chat/[peerId]/route.ts
// ------------------------------------------------------
// API לצ'אט בין שני משתמשים במערכת MATY-DATE
// - GET  : שליפת הודעות לפי peerId (userId של הצד השני)
// - POST : שליחת הודעה חדשה אל peerId
// האחסון בפועל הוא בקולקשן date_messages דרך date-chat-repo
// עם matchId שמגיע מ-date-like (מאץ' הדדי בלבד)
// ------------------------------------------------------

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { appendMessage, listMessages } from "@/lib/db/date-chat-repo";
import { isMatch } from "@/lib/db/date-like";

/* ================== Helpers ================== */

function getUserIdFromSession(s: any): string | null {
  if (!s?.user) return null;
  const u: any = s.user;

  if (u.id) return String(u.id);
  if (u._id) return String(u._id);
  if (u.email) return String(u.email);
  return null;
}

/* ================== GET – שליפת הודעות ==================
   נתיב: /api/date/chat/[peerId]?limit=40&since=<cursor>
   - peerId: userId של הצד השני
   - limit (אופציונלי): כמה הודעות להביא (ברירת מחדל 40, מקסימום 200)
   - since (אופציונלי): cursor (ObjectId או createdAt ISO)
   מחזיר:
   {
     ok: true,
     matchId: string,
     items: [
       { id, fromMe, text, at },
       ...
     ],
     nextCursor: string | null
   }
======================================================== */

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ peerId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const meId = getUserIdFromSession(session);

    if (!meId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { peerId } = await ctx.params;
    const otherId = decodeURIComponent(peerId || "").trim();

    if (!otherId) {
      return NextResponse.json(
        { ok: false, error: "missing_peerId" },
        { status: 400 },
      );
    }

    if (otherId === meId) {
      return NextResponse.json(
        { ok: false, error: "self_chat_not_allowed" },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const since = url.searchParams.get("since") || null;

    const limit = Math.min(Math.max(Number(limitRaw || 40), 1), 200);

    // ווידוא שיש מאץ' הדדי וקבלת matchId
    const m = await isMatch(meId, otherId);
    if (!m.match || !m.matchId) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_match",
          message: "אין מאץ' הדדי בין המשתמשים – אי אפשר לפתוח צ'אט.",
        },
        { status: 403 },
      );
    }

    const { rows, nextCursor } = await listMessages({
      matchId: m.matchId,
      limit,
      since,
    });

    const items = rows.map((msg) => ({
      id: String(msg._id),
      fromMe: msg.fromUserId === meId,
      text: msg.text,
      at: msg.createdAt,
    }));

    return NextResponse.json(
      {
        ok: true,
        matchId: m.matchId,
        items,
        nextCursor,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("[api/date/chat/[peerId]][GET] error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}

/* ================== POST – שליחת הודעה ==================
   נתיב: /api/date/chat/[peerId]
   BODY:
   {
     "text": "טקסט ההודעה",
     // אופציונלי: "replyToId": "<messageId קיים>"
   }

   מחזיר:
   {
     ok: true,
     matchId: string,
     item: { id, fromMe: true, text, at }
   }

   הערה: replyToId כרגע מוחזר ללקוח בלבד, לא נשמר בסכמת DB.
======================================================== */

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ peerId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const meId = getUserIdFromSession(session);

    if (!meId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const { peerId } = await ctx.params;
    const otherId = decodeURIComponent(peerId || "").trim();

    if (!otherId) {
      return NextResponse.json(
        { ok: false, error: "missing_peerId" },
        { status: 400 },
      );
    }

    if (otherId === meId) {
      return NextResponse.json(
        { ok: false, error: "self_chat_not_allowed" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const textRaw = String(body?.text || "");
    const text = textRaw.trim().slice(0, 4000); // הגבלה ריאלית

    const replyToId =
      body?.replyToId && typeof body.replyToId === "string"
        ? body.replyToId
        : null;

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "empty_text" },
        { status: 400 },
      );
    }

    // ווידוא שיש מאץ' הדדי + matchId
    const m = await isMatch(meId, otherId);
    if (!m.match || !m.matchId) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_match",
          message: "אי אפשר לשלוח הודעה בלי מאץ' הדדי.",
        },
        { status: 403 },
      );
    }

    const saved = await appendMessage({
      matchId: m.matchId,
      fromUserId: meId,
      text,
    });

    const item = {
      id: String(saved._id),
      fromMe: true,
      text: saved.text,
      at: saved.createdAt,
      replyToId,
    };

    return NextResponse.json(
      {
        ok: true,
        matchId: m.matchId,
        item,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("[api/date/chat/[peerId]][POST] error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
