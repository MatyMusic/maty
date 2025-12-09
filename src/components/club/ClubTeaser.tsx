"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import YouTubePlayerMini from "@/components/YouTubePlayerMini";

type Item = {
  id: string;
  title: string;
  artist?: string;
  coverUrl?: string;
  youtube?: { id: string };
  plays?: number;
};

export default function ClubTeaser({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/club/trending", { cache: "no-store" });
        const j = await r.json();
        const rows: Item[] = Array.isArray(j?.items) ? j.items.slice(0, limit) : [];
        if (alive) setItems(rows);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [limit]);

  if (!items.length) return null;

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:py-14" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-right">
          <h2 className="text-2xl font-extrabold md:text-3xl">🔥 Trending מ־MATY-CLUB</h2>
          <p className="opacity-80 mt-1 text-sm">מבוסס על השמעות אחרונות באתר</p>
        </div>
        <Link href="/club" className="mm-btn mm-btn-outline">לכל ה־Club</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t, i) => (
          <article key={t.id + i} className="mm-card overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={
                  t.coverUrl ||
                  (t.youtube?.id ? `https://i.ytimg.com/vi/${t.youtube.id}/hqdefault.jpg` : "/assets/placeholder.png")
                }
                alt={t.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="p-3">
              <div className="text-sm opacity-70 clamp-1">{t.artist}</div>
              <div className="font-semibold clamp-2">{t.title}</div>
              {typeof t.plays === "number" && (
                <div className="text-xs opacity-60 mt-1">השמעות 7 ימים: {t.plays}</div>
              )}
              {t.youtube?.id && (
                <YouTubePlayerMini videoId={t.youtube.id} title={t.title} trackId={t.id} src="trending" />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
