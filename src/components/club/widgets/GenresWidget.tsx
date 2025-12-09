"use client";

import Link from "next/link";
import * as React from "react";

type GenreStat = {
  id: string;
  slug: string;
  name: string;
  activityScore: number;
};

type ApiResp = {
  ok: boolean;
  items?: GenreStat[];
};

export default function GenresWidget() {
  const [items, setItems] = React.useState<GenreStat[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/club/genres/stats", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const data: ApiResp = await res.json();
        if (!data.ok) throw new Error("error");
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled)
          setItems([
            // fallback בסיסי
            {
              id: "mizrahi",
              slug: "mizrahi",
              name: "מזרחי",
              activityScore: 95,
            },
            {
              id: "chabad",
              slug: "chabad",
              name: "חב״ד / חסידי",
              activityScore: 80,
            },
            {
              id: "soft",
              slug: "soft",
              name: "שקט / אווירה",
              activityScore: 60,
            },
          ]);
      }
    }
    load();
  }, []);

  const maxScore = items.reduce(
    (max, g) => (g.activityScore > max ? g.activityScore : max),
    1,
  );

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-3 shadow-lg shadow-black/40">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">
          ז׳אנרים בולטים עכשיו
        </h2>
      </header>

      <ul className="space-y-1.5 text-xs">
        {items.map((g) => {
          const ratio =
            maxScore > 0 ? Math.max(0.1, g.activityScore / maxScore) : 0.3;
          return (
            <li key={g.id}>
              <Link
                href={`/club?genre=${encodeURIComponent(g.slug)}`}
                className="block rounded-lg bg-neutral-900 px-2 py-1.5 hover:bg-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-neutral-100">{g.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    פעילות {g.activityScore}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
