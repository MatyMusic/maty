"use client";

import * as React from "react";

type TrendItem = {
  id: string;
  title: string;
  kind: "likes" | "comments" | "views";
  value: number;
};

type ApiResp = {
  ok: boolean;
  items?: TrendItem[];
  error?: string;
};

const LABELS: Record<TrendItem["kind"], string> = {
  likes: "לייקים",
  comments: "תגובות",
  views: "צפיות",
};

export default function TrendsWidget() {
  const [items, setItems] = React.useState<TrendItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/club/trends?range=24h", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const data: ApiResp = await res.json();
        if (!data.ok) throw new Error(data.error || "error");
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/70 p-3 shadow-lg shadow-black/40 backdrop-blur-md">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">
            מה חם עכשיו ב־CLUB
          </h2>
          <p className="text-xs text-neutral-400">24 השעות האחרונות</p>
        </div>
      </header>

      {loading && <p className="text-xs text-neutral-400">טוען טרנדים…</p>}

      {!loading && items.length === 0 && (
        <p className="text-xs text-neutral-500">
          עדיין אין מספיק פעילות לטרנדים. תעלה פוסט 😉
        </p>
      )}

      <ul className="mt-1 space-y-1.5">
        {items.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-lg bg-neutral-900 px-2 py-1.5 text-xs hover:bg-neutral-800/80"
          >
            <div className="flex flex-col">
              <span className="font-medium text-neutral-100 line-clamp-1">
                {t.title}
              </span>
              <span className="text-[11px] text-neutral-400">
                {LABELS[t.kind]} • {t.value.toLocaleString("he-IL")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
