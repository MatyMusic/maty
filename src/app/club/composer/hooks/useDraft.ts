"use client";
import { useEffect } from "react";
import { DEFAULT_TAGS } from "../lib/constants";

const DRAFT_KEY = "club:composer:draft";
const DRAFT_VERSION = 2;

type Mode = "post" | "short";

export function useDraft(ctx: {
  mode: Mode;
  setMode: (m: Mode) => void;
  text: string;
  setText: (v: string) => void;
  genre: string;
  setGenre: (v: string) => void;
  trackUrl: string;
  setTrackUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  coverUrl: string;
  setCoverUrl: (v: string) => void;
  tags: string[];
  setTags: (t: string[]) => void;
  tagsInput: string;
  setTagsInput: (s: string) => void;
}) {
  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || typeof d !== "object") return;
      if (d.v !== DRAFT_VERSION) return;
      ctx.setMode(d.mode ?? "post");
      ctx.setText(d.text ?? "");
      ctx.setGenre(d.genre ?? "club");
      ctx.setTrackUrl(d.trackUrl ?? "");
      ctx.setVideoUrl(d.videoUrl ?? "");
      ctx.setCoverUrl(d.coverUrl ?? "");
      ctx.setTags(d.tags ?? DEFAULT_TAGS);
      ctx.setTagsInput((d.tags ?? DEFAULT_TAGS).join(","));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // save
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = {
          v: DRAFT_VERSION,
          mode: ctx.mode,
          text: ctx.text,
          genre: ctx.genre,
          trackUrl: ctx.trackUrl,
          videoUrl: ctx.videoUrl,
          coverUrl: ctx.coverUrl,
          tags: ctx.tags,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ctx.mode,
    ctx.text,
    ctx.genre,
    ctx.trackUrl,
    ctx.videoUrl,
    ctx.coverUrl,
    ctx.tags,
  ]);
}
