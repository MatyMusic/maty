"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = { videoId: string; title?: string };

export default function YouTubeAudioButton({ videoId, title }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  // load api once
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
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
        width: "106", // קטן אך גלוי (לפי תנאי YouTube)
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            const YT = window.YT;
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            if (
              e.data === YT.PlayerState.PAUSED ||
              e.data === YT.PlayerState.ENDED
            )
              setPlaying(false);
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
  }, [videoId]);

  const toggle = () => {
    if (!ready || !playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={toggle}
        className="px-3 py-1 rounded-md border shadow-sm"
      >
        {playing ? "Pause" : "Play"}
      </button>

      {/* נגן ממוזער גלוי (לא display:none) לשמירה על חוקיות */}
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
