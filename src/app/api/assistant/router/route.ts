// src/app/api/assistant/router/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

type LinkCard = {
  title: string;
  href: string;
  subtitle?: string;
  external?: boolean;
};

const KB: Record<string, string> = {
  "מה זה maty-date": "שירות שידוכים חכם ונקי לקהילות יהודיות. אפשר להירשם, למלא פרופיל קצר ולקבל התאמות.",
  "מה זה maty club": "מרחב קהילתי לפוסטים, תגובות ומציאת אנשים סביב מוזיקה ואירועים.",
  "איך נרשמים": "אפשר דרך /auth?mode=register או התחברות עם Google מהכפתור בראש האתר.",
};

function norm(s: string) {
  return (s || "").toLowerCase().trim();
}
function includesAny(s: string, arr: string[]) {
  return arr.some((k) => s.includes(k));
}

function route(qRaw: string, path: string): { type: "answer" | "links"; text?: string; items?: LinkCard[] } | null {
  const q = norm(qRaw);

  // תשובות קצרות מה־KB
  for (const k of Object.keys(KB)) {
    if (q.includes(norm(k))) return { type: "answer", text: KB[k] };
  }

  // AUTH
  if (includesAny(q, ["התחבר", "כניסה", "login"]))
    return {
      type: "links",
      items: [
        { title: "כניסה", href: "/auth?mode=login", subtitle: "התחברות לחשבון" },
        { title: "הרשמה", href: "/auth?mode=register", subtitle: "פתיחת חשבון חדש" },
      ],
    };

  // BOOK / אירועים
  if (includesAny(q, ["הזמנה", "book", "אירוע", "הופעה"]))
    return {
      type: "links",
      items: [
        { title: "הזמן הופעה", href: "/book", subtitle: "מלא פרטים ונחזור אליך" },
        { title: "צור קשר", href: "/contact", subtitle: "ווטסאפ / טלפון / מייל" },
      ],
    };

  // NIGUNIM
  if (includesAny(q, ["ניגון", "שיר", "פלייליסט", "חתונה", "קליל", "שקט", "מקפיץ"])) {
    const query = encodeURIComponent(q.replace(/(חפש|מצא|ניגון|שיר|פלייליסט)/g, "").trim());
    const base = "/nigunim" + (query ? `?query=${query}` : "");
    return {
      type: "links",
      items: [
        { title: "חיפוש ניגונים", href: base, subtitle: decodeURIComponent(query || "עיון חופשי") },
        { title: "Wedding Essentials", href: "/nigunim?wedding=1", subtitle: "פלייליסטי חתונה" },
        { title: "Soft Shabbat", href: "/nigunim?mood=soft", subtitle: "אווירה שקטה" },
        { title: "Party 140BPM", href: "/nigunim?mood=fun", subtitle: "מסיבה / דאנס" },
      ],
    };
  }

  // CLUB
  if (includesAny(q, ["club", "קלאב", "פוסט", "תגובה", "משתמש"])) {
    const who = encodeURIComponent(q.replace(/(מצא|חפש|משתמש(ים)?|ב־?club|קלאב)/g, "").trim());
    return {
      type: "links",
      items: [
        { title: "כתוב פוסט חדש", href: "/club?compose=1", subtitle: "שתף קטע/מחשבה" },
        { title: "הצג תגובות", href: "/club?show=comments", subtitle: "מה חם עכשיו" },
        { title: "מצא משתמש", href: "/club/users" + (who ? `?q=${who}` : ""), subtitle: who ? `תוצאות עבור “${decodeURIComponent(who)}”` : "עיון לפי קהילה" },
      ],
    };
  }

  // MATY-DATE
  if (includesAny(q, ["date", "שידוך", "התאמה", "היכרות", "זוגיות"])) {
    return {
      type: "links",
      items: [
        { title: "הרשמה ל־MATY-DATE", href: "/maty-date?mode=signup", subtitle: "פתיחת כרטיס היכרות" },
        { title: "עדכון פרופיל", href: "/profile?tab=date", subtitle: "תמונות, העדפות, יעד" },
        { title: "בדיקת התאמות", href: "/maty-date?mode=matches", subtitle: "התאמות חכמות (דמו)" },
        { title: "שאלות ותשובות", href: "/maty-date/faq", subtitle: "איך זה עובד?" },
      ],
    };
  }

  // CONTACT
  if (includesAny(q, ["צור קשר", "טלפון", "וואטסאפ", "whatsapp", "support", "סיוע"]))
    return {
      type: "links",
      items: [
        { title: "טופס יצירת קשר", href: "/contact", subtitle: "נחזור אליך מהר" },
        { title: "הזמן הופעה", href: "/book", subtitle: "לידים להופעות ואירועים" },
      ],
    };

  // nothing matched → null
  return null;
}

export async function POST(req: NextRequest) {
  const { q, path = "/" } = (await req.json().catch(() => ({}))) as { q?: string; path?: string };
  if (!q || typeof q !== "string") return j({ ok: false, error: "bad_request" }, { status: 400 });

  const result = route(q, path);
  if (!result) return j({ ok: true, type: "none" });

  if (result.type === "answer") return j({ ok: true, type: "answer", answer: result.text });
  return j({ ok: true, type: "links", links: result.items });
}

export function GET() {
  return j({ ok: true, ping: "router" });
}
