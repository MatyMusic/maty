// src/hooks/useLocalMedia.ts
"use client";

import * as React from "react";

type UseLocalMediaOpts = {
  video?: boolean;
  audio?: boolean;
};

export function useLocalMedia(
  opts: UseLocalMediaOpts = { video: true, audio: true },
) {
  const { video = true, audio = true } = opts;
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let currentStream: MediaStream | null = null;

    async function start() {
      if (!video && !audio) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("הדפדפן לא תומך בגישה למצלמה/מיקרופון");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const s = await navigator.mediaDevices.getUserMedia({ video, audio });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        currentStream = s;
        setStream(s);
      } catch (e: any) {
        setError(e?.name || e?.message || "שגיאה בגישה למצלמה");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [video, audio]);

  return { stream, loading, error };
}
