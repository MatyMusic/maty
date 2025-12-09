"use client";

import * as React from "react";

type SuggestedUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  genre?: string;
  distanceKm?: number;
};

type ApiResp = {
  ok: boolean;
  items?: SuggestedUser[];
  error?: string;
};

function formatDistance(v?: number) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  if (v < 1) return `${(v * 1000).toFixed(0)} מ׳`;
  if (v < 10) return `${v.toFixed(1)} ק״מ`;
  return `${Math.round(v)} ק״מ`;
}

export default function SuggestedUsersWidget() {
  const [items, setItems] = React.useState<SuggestedUser[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/club/suggested-users?limit=5", {
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
  }, []);

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-3 shadow-lg shadow-black/40">
        <header className="mb-1">
          <h2 className="text-sm font-semibold text-neutral-100">
            אנשים שכדאי להכיר
          </h2>
        </header>
        <p className="text-xs text-neutral-500">
          ככל שתהיה יותר פעיל – נוכל להציע לך חיבורים מעניינים.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-3 shadow-lg shadow-black/40">
      <header className="mb-2">
        <h2 className="text-sm font-semibold text-neutral-100">
          אנשים שכדאי להכיר
        </h2>
      </header>
      <ul className="space-y-1.5 text-xs">
        {items.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between rounded-lg bg-neutral-900 px-2 py-1.5"
          >
            <div className="flex items-center gap-2">
              {u.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.avatarUrl}
                  alt={u.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-semibold text-white">
                  {u.name?.[0] || "?"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium text-neutral-100">{u.name}</span>
                <span className="text-[11px] text-neutral-400">
                  {u.genre || "כל הסגנונות"}
                  {u.distanceKm != null &&
                    ` • ${formatDistance(u.distanceKm)} ממך`}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400"
            >
              התחבר
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
