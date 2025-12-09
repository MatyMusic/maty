// src/components/club/ClubAiPanel.tsx
"use client";

import * as React from "react";

/* ───────── סוגי מצבים ───────── */

type Mode = "post" | "ideas" | "tags" | "reply" | "summary";

const MODES: { id: Mode; label: string; emoji: string; hint: string }[] = [
  {
    id: "post",
    label: "כתיבת פוסט",
    emoji: "✍️",
    hint: "ניסוח פוסטים אישיים/שיווקיים ל-CLUB, קצר וזורם.",
  },
  {
    id: "ideas",
    label: "רעיונות ופעילות",
    emoji: "💡",
    hint: "רעיונות למסיבות, פעילויות, אתגרים ושיחות שפותחות את הקבוצה.",
  },
  {
    id: "tags",
    label: "האשטגים ותיאור",
    emoji: "#️⃣",
    hint: "האשטגים ותיאור לפוסטים/וידאו, גם בעברית וגם באנגלית.",
  },
  {
    id: "reply",
    label: "תגובה מנומסת",
    emoji: "💬",
    hint: "ניסוח תגובה חכמה/מכבדת לתגובה שקיבלת ב-CLUB.",
  },
  {
    id: "summary",
    label: "סיכום דיון",
    emoji: "📚",
    hint: "סיכום קצר ומסודר של שיחה/דיון ארוך.",
  },
];

/* ───────── נושאים חמים ───────── */

const POPULAR_TOPICS: { label: string; prompt: string }[] = [
  {
    label: "חגים בישראל 🎉",
    prompt:
      "פוסט על חוויות מחנוכה, פורים או סוכות בתוך ה-CLUB, בסגנון אישי ומצחיק.",
  },
  {
    label: "שירות/צבא 🪖",
    prompt: "פוסט פתיחת שיחה על חוויות מהצבא, שמזמין אנשים לשתף סיפורים שלהם.",
  },
  {
    label: "מכבים / 443 ⚔️",
    prompt:
      "טקסט על קבוצת המכבים, בולם 6, מאבטחים, וייב מצחיק אבל עם כבוד לחבר'ה.",
  },
  {
    label: "מוזיקה ישראלית 🎵",
    prompt: "פוסט שמבקש המלצות על שירים ישראליים או חסידיים לסט הבא באירוע.",
  },
  {
    label: "קפה/עבודה ☕",
    prompt: "פוסט על יום עבודה עמוס ופתיחת שיחה 'איך עבר עליכם היום?'.",
  },
  {
    label: "זוגיות / דייטינג 💌",
    prompt:
      "פוסט פתיחת שיחה על דייטים מצחיקים שקרו לאנשים, בצורה מכבדת ולא צהובה.",
  },
  {
    label: "התמודדות וראש טוב 💪",
    prompt:
      "פוסט מוטיבציה על להתמודד עם נפילות ולהישאר עם ראש חיובי בתוך ה-CLUB.",
  },
];

/* ───────── טיפוסי צ'אט ───────── */

type ChatMsg = { role: "user" | "assistant"; content: string };

type Tone = "חברי" | "מקצועי" | "עם הומור";

type Props = {
  variant?: "sidebar" | "inline";
  className?: string;
  /** אם true – משתמש ב- /api/club/ai (לוגיקה מקומית/חינמית) במקום /api/ai-chat */
  useClubApi?: boolean;
  /** חיבור ישיר ל-Composer של פוסט: מכניס את הטקסט שנוצר לפוסט */
  onApplyText?: (text: string) => void;
};

export default function ClubAiPanel({
  variant = "sidebar",
  className,
  useClubApi = false,
  onApplyText,
}: Props) {
  const [mode, setMode] = React.useState<Mode>("post");
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tone, setTone] = React.useState<Tone>("חברי");
  const [addEmojis, setAddEmojis] = React.useState(true);

  const [msgs, setMsgs] = React.useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "היי, אני CLUB-AI 🤖\nנוסח פוסטים, רעיונות לשיחות, מסיבות, האשטגים ועוד – מותאם ל-MATY-CLUB ולישראל.\nתכתוב לי מה הכיוון שלך או תבחר נושא למעלה ואני אכין לך טקסט מוכן לשימוש.",
    },
  ]);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  /* ───────── הצעות לפי מצב ───────── */

  const suggestions = React.useMemo(() => {
    switch (mode) {
      case "post":
        return [
          'כתוב לי פוסט הזמנה למסיבת מוזיקה ב-MATY-CLUB בסופ"ש',
          "שפר את הטקסט הזה לפוסט אישי: היום היה לי אימון מטורף…",
          "טקסט תודה לחברים מה-CLUB שבאו להופעה שלי",
        ];
      case "ideas":
        return [
          "רעיונות לאתגר שבועי בקבוצת MATY-CLUB",
          "רעיונות למסיבת קונספט בסגנון מכבים/חוגי השמן",
          "איך לגרום לאנשים להגיב ולהשתתף בפוסט?",
        ];
      case "tags":
        return [
          "האשטגים לפוסט על מסיבת מוזיקה חיה בישראל",
          "האשטגים לפוסט על כושר/אימון אישי ב-CLUB",
          "האשטגים ותיאור קצר לוידאו קצר (short) מהאירוע",
        ];
      case "reply":
        return [
          "תגובה מנומסת לתגובה ביקורתית שקיבלתי על פוסט",
          "תגובה נעימה למישהו ששיתף קושי אישי ב-CLUB",
          "איך לענות למישהו שלא מסכים איתי אבל בלי לריב?",
        ];
      case "summary":
        return [
          "סכם דיון ארוך שהיה בקבוצת ה-CLUB על מוזיקה באירועים",
          "סיכום שיחה ארוכה על חגים ומשמעותם היום",
          "סיכום קצר לשיחת ווטסאפ/CLUB על התמודדות וראש טוב",
        ];
      default:
        return [];
    }
  }, [mode]);

  /* ───────── בניית פרומפט ל-AI (ל-api/ai-chat) ───────── */

  function buildUserPrompt(raw: string) {
    const text = raw.trim();
    if (!text) return "";

    const toneLine =
      tone === "מקצועי"
        ? "טון כתיבה: מקצועי, ברור, לא מתנשא."
        : tone === "עם הומור"
          ? "טון כתיבה: חברי, עם קצת הומור, בלי לצחוק על אנשים."
          : "טון כתיבה: חברי, זורם ופשוט.";

    const emojiLine = addEmojis
      ? "אפשר לשלב כמה אימוג'ים עדינים, לא להגזים."
      : "אל תשתמש באימוג'ים.";

    if (mode === "post") {
      return [
        "אתה CLUB-AI, עוזר טקסטים ל-MATY-CLUB.",
        "המטרה: לכתוב פוסט בעברית, קצר, זורם ומתאים לפיד חברתי.",
        toneLine,
        emojiLine,
        "אל תבטיח שירותים/מחירים – רק טקסט לפוסט.",
        "",
        "כיוון/תוכן לפוסט:",
        text,
      ].join("\n");
    }

    if (mode === "ideas") {
      return [
        "אתה CLUB-AI, עוזר ליצירת רעיונות ל-MATY-CLUB.",
        "המטרה: לתת רשימת רעיונות לפעילויות, אתגרים ופוסטים.",
        "תן רשימה ממוספרת, קצרה וברורה, לקהל ישראלי (דתי/חילוני מעורב).",
        toneLine,
        emojiLine,
        "",
        "קונטקסט ורעיון כללי:",
        text,
      ].join("\n");
    }

    if (mode === "tags") {
      return [
        "אתה CLUB-AI, עוזר לכתיבת האשטגים ותיאור לפוסט/וידאו.",
        "המטרה: לתת 8–15 האשטגים בעברית ואנגלית (מופרדים ברווחים), ואז תיאור קצר של 2–3 שורות.",
        toneLine,
        emojiLine,
        "",
        "על מה הפוסט:",
        text,
      ].join("\n");
    }

    if (mode === "reply") {
      return [
        "אתה CLUB-AI, עוזר לנסח תגובה מנומסת וחכמה ב-MATY-CLUB.",
        "המטרה: לענות בצורה מכבדת, בלי קללות ובלי ריב מיותר.",
        toneLine,
        emojiLine,
        "",
        "הטקסט/תגובה שקיבלתי ומה הכיוון שלי:",
        text,
      ].join("\n");
    }

    // summary
    return [
      "אתה CLUB-AI, עוזר לסיכום דיונים ב-MATY-CLUB.",
      "המטרה: לסכם בצורה קצרה וברורה, בכמה נקודות עיקריות, בעברית.",
      toneLine,
      emojiLine,
      "",
      "הטקסט/הדיון שאני רוצה לסכם:",
      text,
    ].join("\n");
  }

  /* ───────── שליחה ל-AI ───────── */

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const raw = input.trim();
    if (!raw || busy) return;

    const userMsg: ChatMsg = { role: "user", content: raw };
    const userPrompt = buildUserPrompt(raw);
    if (!userPrompt) return;

    // מוסיף את ההודעה לצ'אט
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      if (useClubApi) {
        // ─── מצב 1: שימוש ב- /api/club/ai (לוגיקת AI מקומית / חינמית) ───
        const res = await fetch("/api/club/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            input: raw,
            tone,
            addEmojis,
            history: msgs,
          }),
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok || !data || data.ok === false) {
          console.error("[ClubAiPanel] club-ai error", res.status, data);
          const msgFromServer: string | undefined =
            data?.error || data?.message || data?.detail;

          setError(
            msgFromServer ||
              (res.status >= 500
                ? "שרת ה-AI הפנימי כרגע לא זמין. נסה בעוד רגע."
                : "הבקשה ל-AI נכשלה. בדוק חיבור או נסה שוב."),
          );
          return;
        }

        const resolved: string =
          data.answer ||
          data.reply ||
          data.text ||
          data.message ||
          data.content ||
          data.result ||
          "";

        if (!resolved) {
          console.error("[ClubAiPanel] club-ai no_reply payload:", data);
          setError(
            "ה-AI הפנימי מחובר אבל לא התקבלה תשובה קריאה. בדוק שהפורמט של /api/club/ai מחזיר answer/reply.",
          );
          return;
        }

        setMsgs((prev) => [
          ...prev,
          { role: "assistant", content: String(resolved) },
        ]);
        return;
      }

      // ─── מצב 2: שימוש ב- /api/ai-chat (שם אתה מחבר ספק חינמי/חיצוני) ───
      const payload = {
        messages: [
          {
            role: "system",
            content:
              "אתה CLUB-AI, עוזר טקסטים חכם ל-MATY-CLUB. " +
              "אתה כותב בעברית ברורה, וייב טוב, ולא משתמש בקללות או תוכן בוטה. " +
              "טפל בפוסטים, רעיונות, האשטגים ושיחות בנושאים ישראליים, מוזיקה, חגים, צבא, עבודה, זוגיות ועוד.",
          },
          ...msgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: userPrompt },
        ],
      };

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data || data.ok === false) {
        console.error("[ClubAiPanel] api error", res.status, data);
        const msgFromServer: string | undefined =
          data?.error || data?.message || data?.detail;

        setError(
          msgFromServer ||
            (res.status >= 500
              ? "ה-AI כרגע לא זמין (שגיאת שרת). נסה בעוד רגע."
              : "הבקשה ל-AI נכשלה. בדוק חיבור או נסה שוב."),
        );
        return;
      }

      const resolved: string =
        data.reply ||
        data.text ||
        data.message ||
        data.content ||
        data.result ||
        "";

      if (!resolved) {
        console.error("[ClubAiPanel] no_ai_reply payload:", data);
        setError(
          "ה-AI מחובר אבל לא התקבלה תשובה קריאה מהשרת. בדוק שהפורמט של /api/ai-chat מחזיר reply/text/message.",
        );
        return;
      }

      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: String(resolved) },
      ]);
    } catch (err) {
      console.error("[ClubAiPanel] fetch error:", err);
      setError("שגיאה כללית בשליחת הבקשה ל-AI. נסה שוב.");
    } finally {
      setBusy(false);
    }
  }

  /* ───────── UI כללי ───────── */

  const base =
    "flex flex-col rounded-2xl border border-emerald-500/60 bg-slate-950/95 px-4 py-3 text-slate-50 shadow-xl shadow-emerald-500/10 backdrop-blur text-[13px]";
  const size =
    variant === "sidebar" ? "min-h-[560px] max-h-[820px]" : "min-h-[420px]";

  return (
    <section className={`${base} ${size} ${className ?? ""}`}>
      {/* כותרת + באדג' AI */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-emerald-300">
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-emerald-900/70 px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CLUB • AI</span>
            </span>
            <span className="hidden sm:inline-block rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-emerald-200">
              {useClubApi ? "Local / Free AI" : "Powered by AI-Chat"}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-bold leading-tight">
            עוזר ה-AI של ה-CLUB
          </h2>
          <p className="text-[11px] md:text-[12px] text-slate-300/90">
            כותב איתך פוסטים, רעיונות, האשטגים, תגובות וסיכומים על ישראל, חגים,
            צבא, מוזיקה, זוגיות ועוד.
          </p>
        </div>
      </div>

      {/* נושאים חמים */}
      <div className="mt-2 space-y-1">
        <span className="text-[11px] text-slate-400">נושאים חמים לשיחה:</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {POPULAR_TOPICS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setInput(t.prompt)}
              className="whitespace-nowrap rounded-full border border-emerald-500/60 bg-slate-900/80 px-2.5 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-600/30 hover:text-emerald-50"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* מצבים (פוסט / רעיונות / האשטגים / תגובה / סיכום) */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {MODES.map((m) => {
          const on = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 ${
                on
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                  : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* טיפ קצר לפי מצב */}
      <p className="mt-1 text-[11px] text-slate-400">
        {MODES.find((m) => m.id === mode)?.hint}
      </p>

      {/* טון + אימוג'ים */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <label className="inline-flex items-center gap-1">
          <span className="text-slate-400">טון:</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-[11px]"
          >
            <option value="חברי">חברי</option>
            <option value="מקצועי">מקצועי</option>
            <option value="עם הומור">עם הומור</option>
          </select>
        </label>

        <label className="inline-flex items-center gap-1 text-slate-400">
          <input
            type="checkbox"
            checked={addEmojis}
            onChange={(e) => setAddEmojis(e.target.checked)}
            className="h-3 w-3 rounded border-slate-500"
          />
          <span>להוסיף אימוג'ים 😊</span>
        </label>

        {onApplyText && (
          <span className="text-[10px] text-emerald-300">
            אפשר להכניס תשובה לפוסט בלחיצה אחרי שהיא מגיעה.
          </span>
        )}
      </div>

      {/* הצעות לפי מצב */}
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        {suggestions.map((s, i) => (
          <button
            key={`${mode}-sugg-${i}`}
            type="button"
            onClick={() => setInput(s)}
            className="rounded-full bg-slate-900 px-3 py-1 text-start text-slate-200 shadow-sm hover:bg-slate-800"
          >
            {s}
          </button>
        ))}
      </div>

      {/* צ'אט / תשובות */}
      <div
        ref={scrollRef}
        className="mt-3 h-[360px] md:h-[480px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/90 p-3 leading-relaxed"
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`mb-3 flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="max-w-[92%] space-y-0.5">
              <div
                className={`text-[11px] ${
                  m.role === "user"
                    ? "text-slate-400 text-right"
                    : "text-emerald-300 text-left"
                }`}
              >
                {m.role === "user" ? "אתה" : "CLUB-AI"}
              </div>
              <div
                className={
                  m.role === "user"
                    ? "inline-block rounded-2xl bg-slate-800 px-3 py-2 text-sm md:text-base text-slate-50"
                    : "inline-block rounded-2xl bg-emerald-500/90 px-3 py-2 text-sm md:text-base text-white shadow-md shadow-emerald-500/40"
                }
              >
                <p className="whitespace-pre-line break-words">{m.content}</p>
              </div>
              {m.role === "assistant" && onApplyText && (
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onApplyText(m.content)}
                    className="rounded-full border border-emerלד-400 bg-slate-950/80 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/20"
                  >
                    להכניס לפוסט ✨
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="mt-1 text-[11px] text-slate-400">חושב עבורך… ✨</div>
        )}
      </div>

      {/* אינפוט ושליחה */}
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="תכתוב כאן מה אתה רוצה שה-AI ינסח: רעיון לפוסט, שיחה, תגובה, האשטגים או סיכום דיון…"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "מייצר תשובה…" : "שלח ל-AI"}
          </button>
          <span className="text-[10px] text-slate-400">
            התשובה היא רעיון – אתה מחליט מה באמת לפרסם 👌
          </span>
        </div>

        {error && <div className="text-[11px] text-red-400">{error}</div>}
      </form>
    </section>
  );
}
