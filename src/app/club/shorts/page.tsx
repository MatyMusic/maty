// src/app/club/shorts/page.tsx
"use client";
import React, { useEffect, useMemo } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

type ShortItem = {
  _id: string;
  videoUrl: string;
  coverUrl?: string;
  text?: string;
  authorId: string;
  createdAt?: string;
};

async function fetchShorts(cursor: string | null) {
  const params = new URLSearchParams();
  params.set("limit", "6");
  if (cursor) params.set("cursor", cursor);
  params.set("tag", "shorts");
  const r = await fetch(`/api/club/shorts?` + params.toString(), {
    cache: "no-store",
  });
  const j = await r.json();
  if (!j?.ok) throw new Error("shorts_error");
  return {
    items: j.items as ShortItem[],
    nextCursor: j.nextCursor as string | null,
  };
}

export default function ShortsPage() {
  const loader = useMemo(
    () => (cursor: string | null) => fetchShorts(cursor),
    [],
  );
  const { items, loading, done, more, sentinelRef } =
    useInfiniteScroll<ShortItem>({ loadMore: loader });

  useEffect(() => {
    fetch("/api/analytics/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ t: "pageview", p: "/club/shorts" }),
    }).catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-[480px] px-2 py-4" dir="rtl">
      <h1 className="mb-3 text-xl font-extrabold">Shorts</h1>
      <div className="grid gap-4">
        {items.map((s) => (
          <section
            key={s._id}
            className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black"
          >
            <video
              src={s.videoUrl}
              poster={s.coverUrl || undefined}
              className="w-full h-[72vh] object-cover"
              controls
              playsInline
            />
            {s.text && (
              <div className="p-3 text-sm bg-white/80 dark:bg-neutral-900/70">
                {s.text}
              </div>
            )}
          </section>
        ))}
      </div>

      {!done && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={more}
            disabled={loading}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            {loading ? "טוען…" : "עוד"}
          </button>
        </div>
      )}
      <div ref={sentinelRef} className="h-16" />
    </main>
  );
}
