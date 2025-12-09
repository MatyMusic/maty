"use client";
import { useEffect, useState } from "react";
import YouTubePlayerMini from "@/components/YouTubePlayerMini";

type Track = {
  title: string;
  artist?: string;
  coverUrl?: string;
  youtube?: { id: string };
  genres?: string[];
};

const GENRES = ['חב"ד', "חסידי", "דתי", "חתונות", "שקט", "גיטרות"];

export default function GenresPage() {
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [items, setItems] = useState<Track[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(first = false) {
    setLoading(true);
    const url = new URL("/api/tracks", window.location.origin);
    url.searchParams.set("genre", genre);
    if (!first && next) url.searchParams.set("skip", String(next));
    url.searchParams.set("limit", "24");
    const res = await fetch(url.toString());
    const data = await res.json();
    setItems(first ? data.items || [] : [...items, ...(data.items || [])]);
    setNext(data.next ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre]);

  return (
    <main className="container mx-auto p-6 pb-safe">
      <h1 className="text-3xl font-bold mb-4">
        MATY-CLUB – לפי ז׳אנר (YouTube בלבד)
      </h1>

      {/* ✅ צ׳יפים עם ניגודיות טובה גם ב-Dark */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={g === genre}
            onClick={() => setGenre(g)}
            className={`mm-btn ${
              g === genre ? "mm-btn-primary" : "mm-btn-outline"
            } mm-pressable`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((t, i) => (
          <article
            key={(t.youtube?.id || "") + t.title + i}
            className="mm-card overflow-hidden"
          >
            <div className="relative aspect-video">
              <img
                src={
                  t.coverUrl || `/api/og?title=${encodeURIComponent(t.title)}`
                }
                alt={t.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <div className="text-sm opacity-70 clamp-1">{t.artist}</div>
              <div className="font-semibold clamp-2">{t.title}</div>
              {t.youtube?.id && (
                <YouTubePlayerMini videoId={t.youtube.id} title={t.title} />
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        {next && (
          <button
            disabled={loading}
            onClick={() => load(false)}
            className="mm-btn mm-btn-outline mm-pressable"
          >
            {loading ? "טוען..." : "טען עוד"}
          </button>
        )}
      </div>
    </main>
  );
}
