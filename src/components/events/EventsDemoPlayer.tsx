"use client";

import { Music4, Pause, Play, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

type DemoTrack = {
  id: string;
  title: string;
  subtitle?: string;
  category: "wedding" | "bar-mitzvah" | "farbrengen" | "community" | "concert";
  url: string;
};

const DEMO_TRACKS: DemoTrack[] = [
  {
    id: "t1",
    title: "סט חופה חב״די — דוגמה",
    subtitle: "קטע קצר מתוך סט חופה חי",
    category: "wedding",
    url: "https://res.cloudinary.com/your-cloud/audio/upload/v1234567890/chupa-demo.mp3",
  },
  {
    id: "t2",
    title: "ניגוני התוועדות — דוגמה",
    subtitle: "ניגון חב״ד בעומק להתוועדות",
    category: "farbrengen",
    url: "https://res.cloudinary.com/your-cloud/audio/upload/v1234567890/farbengen-demo.mp3",
  },
  {
    id: "t3",
    title: "סט ריקודים חב״ד/ים תיכוני — דוגמה",
    subtitle: "מעגל ריקודים קצבי",
    category: "bar-mitzvah",
    url: "https://res.cloudinary.com/your-cloud/audio/upload/v1234567890/dance-demo.mp3",
  },
];

export function EventsDemoPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (track: DemoTrack) => {
    // אם לוחצים על אותו טרק – Toggle Play/Pause
    if (currentId === track.id) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
      return;
    }

    // החלפת טרק
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current
        .play()
        .then(() => {
          setCurrentId(track.id);
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl p-4 sm:p-5 text-right space-y-3 shadow-md">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Music4 className="w-5 h-5 text-violet-600" />
            לשמוע איך זה נשמע באירוע
          </h2>
          <p className="text-xs sm:text-sm opacity-75">
            קטעי דמו קצרים מחופה, התוועדות וריקודים. באירוע שלכם בונים סט מלא
            ומותאם במיוחד.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-violet-600/10 border border-violet-600/30 px-3 py-1 text-[11px] text-violet-700 dark:text-violet-200">
          <Sparkles className="w-3.5 h-3.5" />
          DEMO חי מתוך MATY-MUSIC
        </div>
      </header>

      <div className="space-y-2">
        {DEMO_TRACKS.map((track) => {
          const active = currentId === track.id && isPlaying;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => handlePlay(track)}
              className={[
                "w-full flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-right text-xs sm:text-sm transition",
                active
                  ? "border-violet-600 bg-violet-600/10"
                  : "border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/90 hover:bg-neutral-50 dark:hover:bg-neutral-900",
              ].join(" ")}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{track.title}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900">
                    {labelByCategory(track.category)}
                  </span>
                </div>
                {track.subtitle && (
                  <div className="text-[11px] opacity-75 truncate">
                    {track.subtitle}
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {active ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-violet-600 text-white w-8 h-8">
                    <Pause className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 w-8 h-8">
                    <Play className="w-4 h-4 ms-0.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* נגן אודיו נסתר – שולט בכל הטרקים */}
      <audio
        ref={audioRef}
        hidden
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => currentId && setIsPlaying(true)}
      />
    </section>
  );
}

function labelByCategory(
  c: DemoTrack["category"],
): "חתונה" | "בר מצווה" | "התוועדות" | "קהילה" | "קונצרט" {
  switch (c) {
    case "wedding":
      return "חתונה";
    case "bar-mitzvah":
      return "בר מצווה";
    case "farbrengen":
      return "התוועדות";
    case "community":
      return "קהילה";
    case "concert":
    default:
      return "קונצרט";
  }
}
