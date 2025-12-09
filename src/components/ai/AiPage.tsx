// src/components/ai/AiPage.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "setlist" | "lyrics" | "tips";

type AiPageProps = {
  initialMode?: Mode;
};

const MODES: { id: Mode; label: string; emoji: string }[] = [
  { id: "setlist", label: "סט חכם להופעה", emoji: "🎼" },
  { id: "lyrics", label: "טקסט לשיר אישי", emoji: "📝" },
  { id: "tips", label: "טיפים להופעה / אירוע", emoji: "💡" },
];

export default function AiPage({ initialMode = "lyrics" }: AiPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // מסנכרן את ה-mode עם ה-URL (‎/ai?mode=lyrics וכו')
  useEffect(() => {
    const spMode = searchParams?.get("mode") as Mode | null;
    if (
      spMode &&
      ["setlist", "lyrics", "tips"].includes(spMode) &&
      spMode !== mode
    ) {
      setMode(spMode);
      setAnswer("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const placeholder =
    mode === "setlist"
      ? 'תאר/י את האירוע (סוג, קהל, סגנון – חב"ד, מזרחי, קאנטרי...) ואבנה עבורך סט ראשוני לשירים.'
      : mode === "lyrics"
        ? 'למי השיר מיועד? (שם, קשר משפחתי), מה האירוע, איזה סגנון (חב"ד, מזרחי, קאנטרי...) ואיזה מסר חשוב לך שיעבור.'
        : "ספר/י בקצרה על סוג האירוע או ההופעה, ומה היית רוצה לשפר – חיבור לקהל, בחירת שירים, דיבור בין השירים וכו׳.";

  async function handleAsk() {
    if (!prompt.trim()) {
      setAnswer("✍️ כתבו כמה מילים כדי שאוכל ליצור משהו עבורכם.");
      return;
    }

    setLoading(true);
    setAnswer("⏳ יוצר רעיון... רגע אחד בבקשה");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt }),
      });

      const contentType = res.headers.get("content-type") || "";
      let textFromServer = "";

      if (contentType.includes("application/json")) {
        const data = await res.json().catch(() => null);
        textFromServer = data?.answer || data?.text || data?.error || "";
      } else {
        textFromServer = await res.text().catch(() => "");
      }

      if (!res.ok) {
        setAnswer(
          textFromServer ||
            "לא הצלחתי לקבל תשובה תקינה מהמערכת. אפשר לנסות שוב בעוד רגע.",
        );
        setLoading(false);
        return;
      }

      if (!textFromServer) {
        setAnswer("📝 לא חזר טקסט מהמערכת. אפשר לנסות שוב בעוד רגע.");
      } else {
        setAnswer(textFromServer);
      }
    } catch (err) {
      console.error("AI ERROR:", err);
      setAnswer(
        [
          "❗לא הצלחתי להביא הצעה כרגע.",
          "",
          "🟣 אפשר לנסות שוב עוד דקה, לפעמים זה רק עומס זמני.",
          "📞 ואם זה חוזר על עצמו – לוחצים על כפתור הוואטסאפ באתר ונדבר.",
        ].join("\n"),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    setAnswer("");
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("mode", next);
      router.replace(`/ai?${params.toString()}`);
    }
  }

  // רינדור מותאם לפי מצב: שיר / סט / טיפים
  function renderAnswer() {
    if (!answer) {
      return (
        <span className="opacity-60 text-[13px]">
          אחרי שתלחצו על “צור לי הצעה”, כאן יופיע הטקסט או רשימת השירים שהמערכת
          תבנה עבורכם. תוכלו לערוך, להעתיק, לשלוח לחברים או למתי להמשך עבודה.
        </span>
      );
    }

    const lines = answer.split("\n").map((l) => l.trim());

    // מצב שיר – טקסט לשיר אישי
    if (mode === "lyrics") {
      return (
        <div className="leading-[1.8] text-[14px]">
          {lines.map((line, i) => {
            if (!line) return <div key={i} className="h-1.5" />;

            // "בית 1:" / "בית:" / "בית שני:"
            if (/^בית(\s+\d+|[^:]*)?:?$/u.test(line)) {
              return (
                <p
                  key={i}
                  className="mt-3 font-bold text-[15px] text-purple-600 flex items-center gap-1"
                >
                  <span>🎵</span>
                  <span>{line.replace(/:$/u, "")}</span>
                </p>
              );
            }

            // "פזמון:"
            if (/^פזמון:?$/u.test(line)) {
              return (
                <p
                  key={i}
                  className="mt-4 font-extrabold text-[15px] text-amber-600 border-b border-amber-300/70 pb-1 flex items-center gap-1"
                >
                  <span>🎶</span>
                  <span>{line.replace(/:$/u, "")}</span>
                </p>
              );
            }

            return (
              <p key={i} className="pl-2">
                {line}
              </p>
            );
          })}
        </div>
      );
    }

    // מצב סט – רשימת שירים / מבנה ערב
    if (mode === "setlist") {
      const nonEmpty = lines.filter(Boolean);

      return (
        <div className="text-[14px] leading-[1.8]">
          {nonEmpty[0] && (
            <p className="font-semibold text-purple-600 mb-2 flex items-center gap-1">
              <span>🎼</span>
              <span>{nonEmpty[0]}</span>
            </p>
          )}

          <ul className="list-disc pr-4 space-y-1.5">
            {nonEmpty.slice(1).map((line, i) => (
              <li key={i}>{line.replace(/^\d+[\).\-\s]*/, "")}</li>
            ))}
          </ul>
        </div>
      );
    }

    // מצב טיפים – בולטים
    if (mode === "tips") {
      const nonEmpty = lines.filter(Boolean);
      return (
        <div className="text-[14px] leading-[1.8] space-y-1.5">
          {nonEmpty.map((line, i) => {
            if (line.startsWith("•")) {
              return (
                <p key={i} className="flex items-start gap-1">
                  <span className="mt-[2px]">•</span>
                  <span>{line.slice(1).trim()}</span>
                </p>
              );
            }
            return <p key={i}>{line}</p>;
          })}
        </div>
      );
    }

    return <pre className="text-[13px] whitespace-pre-wrap">{answer}</pre>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-12" dir="rtl">
      {/* כותרת עליונה */}
      <header className="mb-6 text-right">
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">
          MATY-AI · כתיבה חכמה למוזיקה
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-1">
          תנו ל-AI לעזור לכם לבנות שיר, סט או ערב מושלם 🎤
        </h1>
        <p className="text-sm md:text-base opacity-80 mt-1 max-w-2xl ml-auto">
          כתבו כמה מילים על האירוע או על האדם המיוחד – והמערכת תציע לכם טקסט
          לשיר אישי, רעיון לסט שירים או טיפים לניהול הופעה. אפשר להעתיק, לערוך,
          לשמור, או לשלוח למתי להמשך עבודה.
        </p>
      </header>

      {/* טאבים למצבי AI */}
      <section className="mb-4">
        <div className="inline-flex rounded-full bg-black/5 dark:bg-white/5 p-1 gap-1">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                className={
                  "px-3 py-1.5 text-xs md:text-sm rounded-full flex items-center gap-1 transition " +
                  (active
                    ? "bg-violet-600 text-white shadow"
                    : "text-black/70 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10")
                }
              >
                <span aria-hidden>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* קלט + פלט */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* קלט */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1.5 text-right">
            כתבו כאן מה אתם רוצים שניצור עבורכם
          </label>
          <textarea
            className="min-h-[160px] rounded-2xl border border-black/10 dark:border-white/15 bg-transparent dark:bg-neutral-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-vertical"
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="mt-3 flex justify-between items-center gap-2">
            <span className="text-[11px] opacity-70">
              מצב נוכחי:{" "}
              {mode === "setlist"
                ? "סט להופעה / אירוע"
                : mode === "lyrics"
                  ? "כתיבת טקסט לשיר אישי"
                  : "טיפים לניהול הופעה / אירוע"}
            </span>
            <button
              type="button"
              onClick={handleAsk}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 text-white text-xs md:text-sm px-4 py-1.5 shadow hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "חושב..." : "צור לי הצעה"}
            </button>
          </div>
        </div>

        {/* פלט */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold mb-1.5 text-right">
            הצעה ראשונית מה-AI (אפשר להעתיק ולערוך)
          </label>

          <div className="min-h-[160px] rounded-2xl border border-black/10 dark:border-white/15 px-4 py-3 text-sm whitespace-pre-wrap text-right bg-transparent">
            {renderAnswer()}
          </div>
        </div>
      </section>
    </main>
  );
}
