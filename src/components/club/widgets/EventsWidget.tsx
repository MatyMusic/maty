"use client";

import * as React from "react";

type ClubEvent = {
  id: string;
  title: string;
  date: string; // ISO
  location: string;
  kind?: "online" | "offline";
};

type ApiResp = {
  ok: boolean;
  items?: ClubEvent[];
};

function formatEventDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("he-IL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventsWidget() {
  const [items, setItems] = React.useState<ClubEvent[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/club/events?limit=4", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const data: ApiResp = await res.json();
        if (!data.ok) throw new Error("error");
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
  }, []);

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-3 shadow-lg shadow-black/40">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">
          אירועים ומפגשים
        </h2>
      </header>

      {items.length === 0 ? (
        <p className="text-xs text-neutral-500">
          אין אירועים פתוחים כרגע. בתור אדמין תוכל להוסיף מפגש 🎉
        </p>
      ) : (
        <ul className="space-y-1.5 text-xs">
          {items.map((ev) => (
            <li key={ev.id} className="rounded-lg bg-neutral-900 px-2 py-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-100">{ev.title}</span>
                <span className="text-[11px] text-neutral-400">
                  {ev.kind === "online" ? "און־ליין" : "פרונטלי"}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-neutral-400">
                {formatEventDate(ev.date)} • {ev.location}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
