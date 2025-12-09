"use client";
import { useEffect, useRef, useState } from "react";
import { logPlay } from "@/lib/plays";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  videoId: string;
  title?: string;
  trackId?: string; // נצרף מה-API כדי ללוגג
  src?: "genres" | "club" | "featured" | "trending" | "search";
};

export default function YouTubePlayerMini({
  videoId,
  title,
  trackId,
  src = "genres",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const playedLoggedRef = useRef(false);

  // load api once
  useEffect(() => {
    if (window.YT?.Player) return;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(s);
  }, []);

  // init player
  useEffect(() => {
    if (!hostRef.current) return;

    const start = () => {
      if (playerRef.current) {
        try {
          playerRef.current.cueVideoById(videoId);
        } catch {}
        return;
      }
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        height: "60",
        width: "106", // ממוזער אך גלוי (חוקי)
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            const YT = window.YT;
            if (e.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              if (!playedLoggedRef.current) {
                playedLoggedRef.current = true;
                logPlay(trackId, src);
              }
            }
            if (
              e.data === YT.PlayerState.PAUSED ||
              e.data === YT.PlayerState.ENDED
            ) {
              setPlaying(false);
            }
          },
          onError: (e: any) => {
            const code = e?.data;
            setBlocked(String(code ?? "unknown"));
          },
        },
      });
    };

    if (window.YT?.Player) start();
    else window.onYouTubeIframeAPIReady = start;

    return () => {
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [videoId, src, trackId]);

  const toggle = () => {
    if (!ready || !playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo(); // יפעל אחרי קליק – עומד במדיניות דפדפנים
  };

  if (blocked) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <a
          className="px-3 py-1 rounded-md border shadow-sm"
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          פתיחה ביוטיוב
        </a>
        <span className="text-xs opacity-60">
          לא ניתן להטמיע (קוד {blocked})
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={toggle}
        className="px-3 py-1 rounded-md border shadow-sm"
      >
        {playing ? "Pause" : "Play"}
      </button>
      <div className="border rounded overflow-hidden" style={{ lineHeight: 0 }}>
        <div ref={hostRef} />
      </div>
      <a
        className="text-xs opacity-70 underline"
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        title={title || "Open on YouTube"}
      >
        YouTube
      </a>
    </div>
  );
}
