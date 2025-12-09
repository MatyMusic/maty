"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type ShortItem = {
  _id: string;
  text?: string;
  genre?: string;
  videoUrl: string;
  coverUrl?: string;
  authorId?: string;
  createdAt?: string;
};

export default function ShortsFeed() {
  const [items, setItems] = useState<ShortItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eof, setEof] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadMore() {
    if (loading || eof) return;
    setLoading(true);
    try {
      const u = new URL("/api/club/shorts", window.location.origin);
      if (cursor) u.searchParams.set("cursor", cursor);
      u.searchParams.set("limit", "6");

      const r = await fetch(u.toString(), { cache: "no-store" });
      const j = await r.json();
      if (!j?.ok) throw new Error("failed to load shorts");

      const next = j.items as ShortItem[];
      setItems((prev) => [...prev, ...next]);
      setCursor(j.nextCursor);
      if (!j.nextCursor || next.length === 0) setEof(true);
    } catch (e) {
      // no-op
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) loadMore();
        });
      },
      { rootMargin: "220px 0px 600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, cursor, loading, eof]);

  return (
    <div
      className="h-[calc(100dvh-56px)] md:h-[calc(100dvh-64px)] overflow-y-auto snap-y snap-mandatory"
      dir="rtl"
    >
      {items.map((it) => (
        <ShortCard key={it._id} item={it} />
      ))}

      {/* Sentinel לטעינות נוספות */}
      <div ref={sentinelRef} />

      {/* מצב ריק / טעינה */}
      {loading && items.length === 0 && (
        <div className="grid place-items-center h-[60vh]">
          <div className="mm-card p-6">טוען Shorts…</div>
        </div>
      )}
      {!loading && items.length === 0 && (
        <div className="grid place-items-center h-[60vh]">
          <div className="mm-card p-6">
            אין עדיין Shorts. נסה להוסיף פוסט עם <b>videoUrl</b>.
          </div>
        </div>
      )}
      {eof && items.length > 0 && (
        <div className="text-center text-sm text-slate-500 py-6">עד כאן ✨</div>
      )}
    </div>
  );
}

function ShortCard({ item }: { item: ShortItem }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // הפעלה אוטומטית בשדה ראייה
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (!v) return;
        if (en.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const caption = useMemo(() => item.text || "—", [item.text]);
  const genre = item.genre || "club";

  return (
    <section className="snap-start relative h-[100dvh] w-full">
      {/* וידאו בגודל מלא */}
      <video
        ref={videoRef}
        src={item.videoUrl}
        poster={item.coverUrl || undefined}
        className="h-full w-full object-cover"
        playsInline
        muted
        loop
        preload="metadata"
        controls={false}
      />

      {/* שכבת מידע / כיתוב */}
      <div className="absolute inset-0 p-4 flex items-end pointer-events-none">
        <div className="pointer-events-auto mm-card px-4 py-3 max-w-[92%] md:max-w-[60%]">
          <div className="text-xs opacity-80 mb-1">
            #{genre} •{" "}
            {new Date(item.createdAt || Date.now()).toLocaleString("he-IL")}
          </div>
          <div className="text-sm clamp-3">{caption}</div>
          <div className="mt-2 flex gap-2">
            <Link href="/club" className="mm-chip">
              חזרה ל-CLUB
            </Link>
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="mm-chip"
            >
              פתיחה בווידאו
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
