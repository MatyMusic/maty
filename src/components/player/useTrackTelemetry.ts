"use client";
import { useEffect, useRef } from "react";

type Src = "nigunim" | "genres" | "club" | "featured" | "search";

export function useTrackTelemetry(opts: {
  trackId?: string;
  userId?: string | null;
  anonId?: string | null;
  src?: Src;
  audioEl?: HTMLAudioElement | null;
}) {
  const { trackId, userId, anonId, src = "nigunim", audioEl } = opts;
  const startedRef = useRef(false);
  const lastBeatRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!trackId || !audioEl) return;

    const post = (url: string, body: any) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});

    const onStart = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      lastBeatRef.current = Date.now();
      post("/api/plays/start", { trackId, userId, anonId, src });
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const playedMs = now - lastBeatRef.current;
        lastBeatRef.current = now;
        post("/api/plays/heartbeat", {
          trackId,
          userId,
          anonId,
          src,
          playedMs,
        });
      }, 15000); // כל 15 שניות
    };

    const onStop = () => {
      if (!startedRef.current) return;
      startedRef.current = false;
      clearInterval(timerRef.current);
      const playedMs = Date.now() - lastBeatRef.current;
      post("/api/plays/stop", { trackId, userId, anonId, src, playedMs });
    };

    audioEl.addEventListener("play", onStart);
    audioEl.addEventListener("pause", onStop);
    audioEl.addEventListener("ended", onStop);

    return () => {
      audioEl.removeEventListener("play", onStart);
      audioEl.removeEventListener("pause", onStop);
      audioEl.removeEventListener("ended", onStop);
      clearInterval(timerRef.current);
    };
  }, [trackId, userId, anonId, src, audioEl]);
}
