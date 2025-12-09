// src/components/fit/FitLivePanel.tsx
"use client";

import * as React from "react";

type LiveItem = {
  id: string;
  userName: string;
  areaName?: string;
  kind: "public" | "one_to_one";
  startedAt: string;
};

type ApiResp =
  | { ok: true; items: LiveItem[] }
  | { ok: false; error?: string; message?: string };

function timeAgo(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return "עכשיו";
  if (diff < 3600) return `${Math.floor(diff / 60)} ד׳`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ש׳`;
  return d.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FitLivePanel() {
  const [items, setItems] = React.useState<LiveItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "public" | "one_to_one">(
    "all",
  );
  const [isLive, setIsLive] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fit/live/list");
      const data: ApiResp = await res.json();
      if (!data.ok) {
        setError(data.error || data.message || "שגיאה בטעינת הלייבים");
      } else {
        setItems(data.items);
      }
    } catch {
      setError("לא הצלחתי למשוך לייבים. אולי אין כרגע?");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((it) =>
    filter === "all" ? true : it.kind === filter,
  );

  return (
    <aside className="rounded-3xl border border-emerald-400/40 bg-gradient-to-b from-slate-900/80 via-slate-950 to-black p-4 text-xs shadow-lg shadow-emerald-500/20">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-emerald-200">
            LIVE · MATY-FIT
          </h2>
          <p className="text-[11px] text-emerald-100/80">
            שליטה בלייב שלך + שידורים פתוחים של מתאמנים ומאמנים.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsLive((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
            isLive
              ? "bg-red-500 text-white shadow shadow-red-500/50"
              : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? "bg-red-200 animate-pulse" : "bg-emerald-300"
            }`}
          />
          {isLive ? "אתה בשידור" : "Go Live"}
        </button>
      </header>

      {/* פילטרים */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "הכל" },
          { id: "public", label: "שידורים פתוחים" },
          { id: "one_to_one", label: "1 על 1" },
        ].map((f) => {
          const active = filter === (f.id as any);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id as any)}
              className={`rounded-full px-3 py-1 text-[11px] transition ${
                active
                  ? "bg-emerald-400 text-black"
                  : "bg-black/40 text-emerald-100/80 ring-1 ring-emerald-500/40 hover:bg-black/70"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={load}
          className="ml-auto rounded-full bg-black/40 px-3 py-1 text-[11px] text-emerald-100/90 ring-1 ring-emerald-500/40 hover:bg-black/70"
        >
          רענן
        </button>
      </div>

      {/* רשימת לייבים */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {loading && (
          <p className="text-[11px] text-emerald-100/80">טוען שידורים...</p>
        )}
        {error && <p className="text-[11px] text-red-300">❗ {error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-[11px] text-emerald-100/70">
            אין כרגע שידורי FIT פעילים. תן גז ופתח אחד 😎
          </p>
        )}

        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-2xl bg-black/40 px-3 py-2 ring-1 ring-emerald-500/25"
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-emerald-100">
                {item.userName}
              </span>
              <span className="text-[10px] text-emerald-200/80">
                {item.areaName || "אונליין"}
              </span>
              <span className="text-[10px] text-emerald-300/80">
                התחיל: {timeAgo(item.startedAt)}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
                {item.kind === "public" ? "פתוח לכולם" : "1 על 1"}
              </span>
              <button
                type="button"
                className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-black hover:bg-emerald-400"
              >
                היכנס לשידור
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* הערה קטנה – אפשרות לוידאו 1 על 1 */}
      <p className="mt-3 text-[10px] text-emerald-100/70">
        🔧 בהמשך: חיבור לחדר וידאו 1 על 1 (WebRTC) כמו ב־CLUB, עם שיחות לייב
        מאמן־מתאמן.
      </p>
    </aside>
  );
}
