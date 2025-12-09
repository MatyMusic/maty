"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type TrackLike = {
  _id: string;
  title: string;
  artists?: string[];
  cover?: string;
  audioUrl?: string;
  previewUrl?: string;
  embedUrl?: string;
  videoId?: string;
  externalUrl?: string;
  durationSec?: number;
  source?: string;
};

type PlayerState = {
  open: boolean;
  playing: boolean;
  kind: "audio" | "youtube" | null;
  current?: TrackLike;
  queue: TrackLike[];
  index: number;
  volume: number; // 0..1
  progress: number; // seconds
};

type PlayerCtx = PlayerState & {
  play: (t: TrackLike, q?: TrackLike[]) => void;
  toggle: () => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  seek: (sec: number) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

function pickPlayable(t?: TrackLike): {
  kind: "audio" | "youtube" | null;
  url: string | null;
} {
  if (!t) return { kind: null, url: null };
  if (t.audioUrl) return { kind: "audio", url: t.audioUrl };
  if (t.previewUrl) return { kind: "audio", url: t.previewUrl };
  const embed =
    t.embedUrl ??
    (t.videoId ? `https://www.youtube.com/embed/${t.videoId}` : null);
  if (embed) return { kind: "youtube", url: embed };
  return { kind: null, url: null };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    open: false,
    playing: false,
    kind: null,
    current: undefined,
    queue: [],
    index: 0,
    volume:
      typeof window !== "undefined"
        ? Number(localStorage.getItem("player:v") ?? 0.9)
        : 0.9,
    progress: 0,
  });

  // attach audio events
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const onTime = () =>
      setState((s) => ({ ...s, progress: audio.currentTime }));
    const onEnd = () => next();
    const onPlay = () => setState((s) => ({ ...s, playing: true }));
    const onPause = () => setState((s) => ({ ...s, playing: false }));
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // keep volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume;
    if (typeof window !== "undefined")
      localStorage.setItem("player:v", String(state.volume));
  }, [state.volume]);

  const play = (t: TrackLike, q?: TrackLike[]) => {
    const pq = pickPlayable(t);
    const queue = q ?? [];
    setState((s) => ({
      ...s,
      open: true,
      current: t,
      kind: pq.kind,
      index: queue.length
        ? Math.max(
            0,
            queue.findIndex((x) => x._id === t._id),
          )
        : 0,
      queue: queue.length ? queue : s.queue,
      progress: 0,
    }));
    // audio will auto-play in effect below
  };

  const toggle = () => {
    if (state.kind === "audio" && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  };

  const close = () => {
    if (audioRef.current) audioRef.current.pause();
    setState((s) => ({
      ...s,
      open: false,
      playing: false,
      current: undefined,
      kind: null,
      progress: 0,
    }));
  };

  const next = () => {
    if (!state.queue.length) return;
    const ni = (state.index + 1) % state.queue.length;
    const t = state.queue[ni];
    const pq = pickPlayable(t);
    setState((s) => ({
      ...s,
      index: ni,
      current: t,
      kind: pq.kind,
      progress: 0,
      open: true,
    }));
  };

  const prev = () => {
    if (!state.queue.length) return;
    const pi = (state.index - 1 + state.queue.length) % state.queue.length;
    const t = state.queue[pi];
    const pq = pickPlayable(t);
    setState((s) => ({
      ...s,
      index: pi,
      current: t,
      kind: pq.kind,
      progress: 0,
      open: true,
    }));
  };

  const setVolume = (v: number) =>
    setState((s) => ({ ...s, volume: Math.min(1, Math.max(0, v)) }));
  const seek = (sec: number) => {
    if (state.kind === "audio" && audioRef.current) {
      audioRef.current.currentTime = Math.max(0, sec);
    }
  };

  // when track/kind changes, (re)play audio automatically
  useEffect(() => {
    if (state.kind === "audio" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = state.volume;
      audioRef.current.play().catch(() => {});
    }
  }, [state.current?._id, state.kind]);

  const ctx: PlayerCtx = useMemo(
    () => ({
      ...state,
      play,
      toggle,
      close,
      next,
      prev,
      setVolume,
      seek,
    }),
    [state],
  );

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {/* hidden audio element for HTML5 playback */}
      <audio
        ref={audioRef}
        src={
          state.kind === "audio"
            ? (pickPlayable(state.current).url ?? undefined)
            : undefined
        }
        preload="metadata"
      />
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer must be used within PlayerProvider");
  return v;
}
