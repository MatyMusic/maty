// src/components/club/ClubFeed.tsx
"use client";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Post, FeedResp } from "@/lib/club/types";
import PostCard from "@/components/club/PostCard";
import FeedToolbar, { type FeedFilters } from "@/components/club/FeedToolbar";
import {
  useInlinePromos,
  interleaveWithPromos,
} from "@/components/club/useInlinePromos";

/**
 * ClubFeed — פיד חווייתי עם פילטרים, אינפיניט-סקול, ופרומואים משולבים.
 * - q = חיפוש צד לקוח (טקסט/תגיות)
 * - יתר הפילטרים נשלחים ל-API
 */
export default function ClubFeed() {
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eof, setEof] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const promos = useInlinePromos();

  const [filters, setFilters] = useState<FeedFilters>({
    q: "",
    genre: "club",
    sort: "latest",
    shortsOnly: false,
  });
  const resetFilters = () =>
    setFilters({ q: "", genre: "club", sort: "latest", shortsOnly: false });

  const loadMore = useCallback(async () => {
    if (loading || eof) return;
    setLoading(true);
    const ctrl = new AbortController();
    try {
      const qs = new URLSearchParams();
      if (cursor) qs.set("cursor", cursor);
      if (filters.genre) qs.set("genre", filters.genre);
      if (filters.tag) qs.set("tag", filters.tag);
      if (filters.authorId) qs.set("authorId", filters.authorId);
      if (filters.sort) qs.set("sort", filters.sort);

      const res = await fetch(`/api/club/feed?${qs}`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
      const j = (await res.json()) as FeedResp;
      if (!j?.ok) throw new Error("bad_response");

      setItems((prev) => {
        const merged = [...prev, ...j.items];
        const q = (filters.q || "").trim().toLowerCase();
        if (!q) return merged;
        return merged.filter((p) => {
          const txt = (p.text || "").toLowerCase();
          const tags = (p.tags || []).join(" ").toLowerCase();
          return txt.includes(q) || tags.includes(q);
        });
      });

      setCursor(j.nextCursor);
      if (!j.nextCursor || j.items.length === 0) setEof(true);
    } catch (e) {
      console.error("feed load error", e);
    } finally {
      setLoading(false);
    }
    return () => ctrl.abort();
  }, [
    cursor,
    loading,
    eof,
    filters.genre,
    filters.tag,
    filters.authorId,
    filters.sort,
    filters.q,
  ]);

  // שינוי פילטרים (למעט q) — ריסט וטעינה מחדש
  useEffect(() => {
    let cancel = false;
    (async () => {
      setItems([]);
      setCursor(null);
      setEof(false);
      if (!cancel) await loadMore();
    })();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.genre, filters.tag, filters.authorId, filters.sort]);

  // open
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IO — בלי לשים ref.current בתלויות
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && loadMore()),
      { rootMargin: "400px 0px 800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const nodes = items.map((p) => <PostCard key={p._id} post={p} />);
  const list = interleaveWithPromos(nodes, promos, 6);

  return (
    <div className="space-y-4" dir="rtl">
      <FeedToolbar
        value={filters}
        onChange={(patch) => setFilters((v) => ({ ...v, ...patch }))}
        onReset={resetFilters}
      />

      {list}

      {!eof && (
        <div
          ref={sentinelRef}
          className="h-24 flex items-center justify-center"
        >
          {loading ? (
            <span className="text-sm opacity-70">טוען…</span>
          ) : (
            <span className="text-sm opacity-50">גלול להמשך…</span>
          )}
        </div>
      )}

      {eof && items.length === 0 && (
        <div className="rounded-2xl p-8 text-center bg-white/60 dark:bg-neutral-900/60">
          <div className="text-lg">אין עדיין פוסטים. היה הראשון!</div>
        </div>
      )}
    </div>
  );
}
