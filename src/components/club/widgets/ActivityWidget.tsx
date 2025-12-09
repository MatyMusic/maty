"use client";

import * as React from "react";

type ActivityItem = {
  id: string;
  kind: "post" | "comment" | "like" | "join" | "music";
  text: string;
  at: string;
};

type ApiResp = {
  ok: boolean;
  items?: ActivityItem[];
  error?: string;
};

function timeAgo(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "לפני רגע";
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק׳`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שע׳`;
  return d.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ICONS: Record<ActivityItem["kind"], string> = {
  post: "📝",
  comment: "💬",
  like: "❤️",
  join: "🙋‍♂️",
  music: "🎵",
};

export default function ActivityWidget() {
  const [items, setItems] = React.useState<ActivityItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/club/activity?limit=10", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const data: ApiResp = await res.json();
        if (!data.ok) throw new Error(data.error || "error");
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
    const id = setInterval(load, 45_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/70 p-3 shadow-lg shadow-black/40">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">
          מה קורה עכשיו במערכת
        </h2>
      </header>

      {items.length === 0 ? (
        <p className="text-xs text-neutral-500">
          המערכת שקטה כרגע… זה הזמן להעלות משהו 😉
        </p>
      ) : (
        <ul className="space-y-1.5 text-xs">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-2 rounded-lg bg-neutral-900 px-2 py-1.5"
            >
              <span className="mt-0.5 text-base">{ICONS[a.kind]}</span>
              <div className="flex flex-col">
                <span className="text-neutral-100">{a.text}</span>
                <span className="text-[11px] text-neutral-400">
                  {timeAgo(a.at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
