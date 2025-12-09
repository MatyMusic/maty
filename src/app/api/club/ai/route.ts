// src/app/api/club/ai/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mode = "post" | "ideas" | "tags" | "reply" | "summary";
type ChatMsg = { role: "user" | "assistant"; content: string };

type Body = {
  mode?: Mode;
  input?: string;
  tone?: string;
  addEmojis?: boolean;
  history?: ChatMsg[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const mode: Mode = body.mode || "post";
    const input = (body.input || "").trim();
    const tone = body.tone || "חברי";
    const addEmojis = body.addEmojis ?? true;
    const history = Array.isArray(body.history) ? body.history : [];

    if (!input) {
      return NextResponse.json(
        { ok: false, error: "missing_input" },
        { status: 400 },
      );
    }

    const { answer, tags, title, bullets } = buildAnswer({
      mode,
      input,
      tone,
      addEmojis,
      history,
    });

    return NextResponse.json({
      ok: true,
      mode,
      input,
      answer,
      tags,
      title,
      bullets,
    });
  } catch (err: any) {
    console.error("[/api/club/ai] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}

function buildAnswer(args: {
  mode: Mode;
  input: string;
  tone: string;
  addEmojis: boolean;
  history: ChatMsg[];
}): {
  answer: string;
  tags?: string[];
  title?: string;
  bullets?: string[];
} {
  const { mode, input, tone, addEmojis, history } = args;

  const emoji = addEmojis ? " 💥" : "";
  const toneSuffix =
    tone === "מקצועי"
      ? " (ניסוח רשמי ומסודר)"
      : tone === "עם הומור"
        ? " (עם קריצה וחיוך קל)"
        : "";

  const lastUserLine =
    history
      .slice()
      .reverse()
      .find((m) => m.role === "user")?.content || "";

  const contextHint =
    lastUserLine && !input.includes(lastUserLine)
      ? `\n\nהקשר קודם מהצ'אט: ${truncate(lastUserLine, 120)}`
      : "";

  /* ───────── POST ───────── */
  if (mode === "post") {
    const title =
      tone === "מקצועי"
        ? "עדכון מהשטח – MATY-CLUB"
        : tone === "עם הומור"
          ? "בולם 6, ערק ומשקולות – מה עוד צריך? 😅"
          : "עדכון קטן מה-CLUB";

    const lines = [
      `כותרת${toneSuffix}:`,
      title,
      "",
      "פתיח:",
      `היי חברים, פה מתי מהמכבים – ${input}.`,
      "",
      "גוף הפוסט:",
      "אנחנו חיים בין משמרות, אימונים, אירועים ומוזיקה – ",
      "ובין כל הטירוף הזה אני מנסה לעצור רגע, לנשום, ולשתף אתכם באמת איך זה מרגיש.",
      "ב-CLUB של MATY אנחנו לא עוד פיד יבש – זה מקום לסיפורים, צחוקים, מאבקים ורגעים קטנים של אור.",
      contextHint || "",
      "קריאה לפעולה:",
      "ספרו גם אתם מה עבר עליכם היום – אימון, משמרת, דייט, הופעה או סתם רגע שווה.",
      "",
      `יאללה, מחכה לקרוא אתכם!${emoji}`,
    ]
      .filter(Boolean)
      .join("\n");

    return { answer: lines, title };
  }

  /* ───────── IDEAS ───────── */
  if (mode === "ideas") {
    const lines = [
      `רעיונות לפוסטים ופעילות סביב: "${input}"${toneSuffix}`,
      "",
      "1. לפני / אחרי – תמונה לפני האימון או המשמרת, ותמונה אחרי, עם משפט קצר מה למדת מזה.",
      "2. מאחורי הקלעים – פוסט/סטורי שמראה איך אתה מתכונן לאירוע, לשמירה או לנגינה.",
      "3. 'רגע של אמת' – שתף קושי שעברת (עייפות, פחד, לחץ), ואיך יצאת מזה.",
      "4. המלצה מהשטח – שיר, ניגון, טיפ קטן לציוד או לאימון שעשה לך שינוי.",
      "5. סיפור מצחיק – משהו הזוי שקרה בבולם / באירוע / בנסיעה, כמובן בלי לחשוף אנשים.",
      "6. שאלת היום – שאלה פתוחה לחברים ב-CLUB שתעשה דיון חי (למשל: 'מה השיר שהכי מרים אתכם באמצע הלילה?').",
      contextHint ? "" : "",
      "טיפ: תבחר רעיון אחד ותפתח אותו בפוסט של 4–6 משפטים בתכלס, בלי הרבה פילוסופיה.",
    ].filter(Boolean);

    return { answer: lines.join("\n") };
  }

  /* ───────── TAGS ───────── */
  if (mode === "tags") {
    const baseWords = extractKeywords(input);
    const baseTags = Array.from(
      new Set(
        [
          ...baseWords,
          "maty",
          "club",
          "music",
          "security",
          "מכבים",
          "443",
          "בולם6",
          "party",
          "live",
        ].filter(Boolean),
      ),
    );
    const tags = baseTags.slice(0, 12);
    const line = tags.map((t) => `#${t}`).join("  ");

    const lines = [
      "הנה כמה תגיות אפשריות לפוסט שלך:",
      "",
      line,
      "",
      "טיפ:",
      "• אל תעמיס – בחר 4–8 האשטגים חזקים.",
      "• ערבב עברית ואנגלית כדי להגיע גם לחבר'ה בארץ וגם מחוץ לישראל.",
    ];

    return { answer: lines.join("\n"), tags };
  }

  /* ───────── REPLY ───────── */
  if (mode === "reply") {
    const lines = [
      `תגובה מנומסת על בסיס: "${truncate(input, 160)}"…${toneSuffix}`,
      "",
      "היי, תודה שכתבת 🙏",
      "אני באמת מעריך את זה שהקדשת זמן להגיב ולשתף איך אתה רואה את הדברים.",
      "המטרה שלי פה ב-CLUB היא לפתוח שיח אמיתי ומכבד, גם כשלא מסכימים על הכול.",
      "",
      "יכול להיות שלא נסכים על כל נקודה, וזה בסדר – העיקר שנדבר בכבוד וננסה להבין אחד את השני.",
      "",
      "אם בא לך, אשמח להמשיך את השיחה בטון רגוע ולשמוע עוד מהצד שלך.",
      "",
      `תודה על ההבנה והכבוד הדדי.${emoji}`,
    ];

    return { answer: lines.join("\n") };
  }

  /* ───────── SUMMARY ───────── */
  if (mode === "summary") {
    const bullets: string[] = [
      "מה הנושא המרכזי? – שיתוף חוויות אישיות וחיבור דרך ה-CLUB.",
      "מה עלה בדיון? – כמה זוויות שונות, חוויות מהשטח ודעות על איך נכון להתנהל.",
      "המסר המרכזי – כולנו באותו צד: מחפשים לצמוח, להשתפר ולהרגיש שייכים.",
    ];

    const lines = [
      `סיכום קצר לדיון/טקסט סביב: "${truncate(input, 80)}"…${toneSuffix}`,
      "",
      "נקודות עיקריות:",
      ...bullets.map((b) => `• ${b}`),
      "",
      `אפשר לסיים במשפט אישי שלך שמסכם איך אתה רואה את הדברים.${emoji}`,
    ];

    return { answer: lines.join("\n"), bullets };
  }

  // fallback
  return { answer: input };
}

/* ───────── עזרי טקסט ───────── */

function extractKeywords(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const parts = cleaned.split(/\s+/).filter((w) => w.length > 2);
  return parts.slice(0, 20);
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}
