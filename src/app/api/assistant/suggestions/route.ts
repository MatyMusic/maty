// src/app/api/assistant/suggestions/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

type Hint = {
  text: string;
  action: { type: "link" | "command"; value: string };
};

function hintsForPath(path: string): Hint[] {
  const base: Hint[] = [
    { text: "צור קשר", action: { type: "link", value: "/contact" } },
    { text: "הזמן הופעה", action: { type: "link", value: "/book" } },
  ];

  if (path.startsWith("/nigunim"))
    return [
      {
        text: "חפש ניגון חתונה",
        action: { type: "command", value: "חפש ניגון חתונה" },
      },
      {
        text: "ניגונים שקטים",
        action: { type: "command", value: "מצא ניגונים שקטים" },
      },
      ...base,
    ];
  if (path.startsWith("/club"))
    return [
      {
        text: "כתוב פוסט חדש",
        action: { type: "link", value: "/club?compose=1" },
      },
      {
        text: "הצג תגובות",
        action: { type: "link", value: "/club?show=comments" },
      },
      {
        text: "מצא משתמש",
        action: { type: "command", value: "מצא משתמש ב־CLUB" },
      },
      ...base,
    ];
  if (path.startsWith("/maty-date"))
    return [
      {
        text: "הרשמה ל־MATY-DATE",
        action: { type: "link", value: "/maty-date?mode=signup" },
      },
      {
        text: "עדכון פרופיל היכרות",
        action: { type: "link", value: "/profile?tab=date" },
      },
      {
        text: "בדיקת התאמות",
        action: { type: "command", value: "בדוק התאמות" },
      },
      ...base,
    ];

  return [
    { text: "מצא ניגון", action: { type: "command", value: "מצא ניגון" } },
    {
      text: "מה זה MATY-DATE?",
      action: { type: "command", value: "מה זה MATY-DATE" },
    },
    ...base,
  ];
}

function safeInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  const { path = "/" } = (await req.json().catch(() => ({}))) as {
    path?: string;
  };
  const suggestions = hintsForPath(String(path || "/"));
  // מדמים “נוכחות”
  const online = safeInt(23, 118);
  const here = safeInt(1, 14);
  return j({ ok: true, suggestions, online, here });
}

export function GET() {
  return j({ ok: true, ping: "pong" });
}
