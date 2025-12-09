// src/components/club/ClubImageGenPanel.tsx
"use client";

import * as React from "react";

type Kind = "avatar" | "cover" | "post-image" | "background";
type Provider = "huggingface" | "openai" | "stability" | "replicate";

type Props = {
  className?: string;
};

type State = {
  prompt: string;
  kind: Kind;
  style: string;
  provider: Provider | "auto";
};

type ApiResp = {
  ok: boolean;
  url?: string;
  provider?: Provider;
  error?: string;
};

export default function ClubImageGenPanel({ className }: Props) {
  const [state, setState] = React.useState<State>({
    prompt: "",
    kind: "avatar",
    style: "",
    provider: "auto",
  });

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [lastProvider, setLastProvider] = React.useState<string | null>(null);

  function patch(p: Partial<State>) {
    setState((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = state.prompt.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/club/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          kind: state.kind,
          style: state.style,
          provider: state.provider === "auto" ? undefined : state.provider,
        }),
      });

      let data: ApiResp | null = null;
      try {
        data = (await res.json()) as ApiResp;
      } catch {
        data = null;
      }

      if (!res.ok || !data || !data.ok || !data.url) {
        const msg =
          data?.error ||
          (res.status >= 500
            ? "שגיאה בשרת יצירת התמונות. נסה בעוד רגע."
            : "לא הצלחתי לייצר תמונה. בדוק את ההגדרות ונסה שוב.");
        setError(msg);
        return;
      }

      setImageUrl(data.url);
      setLastProvider(data.provider || null);
    } catch (err) {
      console.error("[ClubImageGenPanel] error:", err);
      setError("שגיאה כללית בשליחת הבקשה. בדוק את החיבור ונסה שוב.");
    } finally {
      setBusy(false);
    }
  }

  function handleExample(kind: Kind) {
    const examples: Record<Kind, string> = {
      avatar:
        "אווטאר תלת מימד של מאבטח שחור סטייל ויקינג, מכבים 443 בבולם 6, לבוש מדים טקטיים שחורים וקסדה מגניבה",
      cover:
        "תמונת קאבר ל-MATY-CLUB, נוף לילה ישראלי, אורות עיר, מסיבה, אווירה של חופש ומוזיקה",
      "post-image":
        "איור מצחיק של חבורה של מאבטחים יושבים בפינה בבולם 6 עם ערק, משקולות וכתר על הראש למתי",
      background:
        "רקע מופשט כהה עם נגיעות ירוק וטורכיז שמתאים לאפליקציית מוזיקה מודרנית",
    };

    patch({
      kind,
      prompt: examples[kind],
    });
  }

  const box =
    "rounded-2xl border border-indigo-500/60 bg-slate-950/95 px-4 py-3 text-slate-50 shadow-xl shadow-indigo-500/10 backdrop-blur text-[13px]";

  return (
    <section className={`${box} ${className ?? ""}`}>
      <header className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-indigo-300">
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-indigo-900/70 px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>CLUB • Image AI</span>
            </span>
          </div>
          <h2 className="text-base md:text-lg font-bold leading-tight">
            מחולל תמונות ו/אווטארים ל-CLUB
          </h2>
          <p className="text-[11px] md:text-[12px] text-slate-300/90">
            יוצר תמונות לפוסטים, אווטארים ודיזיין ל-MATY-CLUB לפי טקסט שאתה
            כותב.
          </p>
        </div>
      </header>

      {/* בחירת סוג תמונה */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <button
          type="button"
          onClick={() => patch({ kind: "avatar" })}
          className={`rounded-full border px-3 py-1 ${
            state.kind === "avatar"
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
              : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          👤 אווטאר
        </button>
        <button
          type="button"
          onClick={() => patch({ kind: "cover" })}
          className={`rounded-full border px-3 py-1 ${
            state.kind === "cover"
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
              : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          🖼️ קאבר
        </button>
        <button
          type="button"
          onClick={() => patch({ kind: "post-image" })}
          className={`rounded-full border px-3 py-1 ${
            state.kind === "post-image"
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
              : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          📌 תמונה לפוסט
        </button>
        <button
          type="button"
          onClick={() => patch({ kind: "background" })}
          className={`rounded-full border px-3 py-1 ${
            state.kind === "background"
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
              : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          🌌 רקע / טפט
        </button>
      </div>

      {/* בחירת ספק – כולל Hugging Face */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <label className="inline-flex items-center gap-1">
          <span className="text-slate-400">ספק:</span>
          <select
            value={state.provider}
            onChange={(e) =>
              patch({ provider: e.target.value as State["provider"] })
            }
            className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-[11px]"
          >
            <option value="auto">אוטומטי (לפי ENV)</option>
            <option value="huggingface">Hugging Face</option>
            <option value="openai">OpenAI</option>
            <option value="stability">Stability</option>
            <option value="replicate">Replicate</option>
          </select>
        </label>

        <label className="inline-flex items-center gap-1">
          <span className="text-slate-400">סגנון:</span>
          <input
            value={state.style}
            onChange={(e) => patch({ style: e.target.value })}
            placeholder="למשל: 3D cartoon, cyberpunk, realistic…"
            className="min-w-[160px] flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-slate-50 placeholder:text-slate-500"
          />
        </label>
      </div>

      {/* דוגמאות מוכנות */}
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <button
          type="button"
          onClick={() => handleExample("avatar")}
          className="rounded-full bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800"
        >
          דוגמה לאווטאר מכבים 443
        </button>
        <button
          type="button"
          onClick={() => handleExample("post-image")}
          className="rounded-full bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800"
        >
          דוגמה לתמונה מצחיקה לפוסט
        </button>
      </div>

      {/* טקסט פרומפט + שליחה */}
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <textarea
          value={state.prompt}
          onChange={(e) => patch({ prompt: e.target.value })}
          rows={3}
          placeholder="תכתוב בעברית מה אתה רוצה לראות בתמונה – למשל: אווטאר תלת מימד של מתי יושב בבולם 6 עם כתר על הראש…"
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-50 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy || !state.prompt.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "מייצר תמונה…" : "צור תמונה עם AI"}
          </button>
          <span className="text-[10px] text-slate-400">
            את התמונה אפשר אחר כך לשמור, להעלות לגלריה או להפוך לאווטאר.
          </span>
        </div>
      </form>

      {/* שגיאה / תוצאה */}
      {error && <div className="mt-2 text-[11px] text-red-400">{error}</div>}

      {imageUrl && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>תוצאה שנוצרה:</span>
            {lastProvider && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px]">
                מקור: {lastProvider}
              </span>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="תמונה שנוצרה עם AI"
              className="h-auto w-full max-h-[420px] object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
