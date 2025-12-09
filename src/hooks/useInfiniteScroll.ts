// src/hooks/useInfiniteScroll.ts
"use client";
import { useEffect, useRef, useState } from "react";

export function useInfiniteScroll<T>(opts: {
  loadMore: (
    cursor: string | null,
  ) => Promise<{ items: T[]; nextCursor: string | null }>;
  initial?: { items: T[]; nextCursor: string | null };
  auto?: boolean; // ברירת מחדל: true
}) {
  const { loadMore, initial, auto = true } = opts;
  const [items, setItems] = useState<T[]>(initial?.items || []);
  const [cursor, setCursor] = useState<string | null>(
    initial?.nextCursor || null,
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!initial && !initial.nextCursor);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const more = async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const { items: newItems, nextCursor } = await loadMore(cursor);
      setItems((prev) => [...prev, ...newItems]);
      setCursor(nextCursor);
      if (!nextCursor || newItems.length === 0) setDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auto) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && more()),
      { rootMargin: "600px 0px 600px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, auto, cursor, loading, done]);

  return { items, loading, done, more, sentinelRef };
}
