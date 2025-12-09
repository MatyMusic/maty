// src/components/club/LikeButton.tsx
"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { likeStatus, likeToggle } from "@/lib/club/api";

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  size = 18,
  className = "",
}: {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: number;
  className?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [liked, setLiked] = React.useState(!!initialLiked);
  const [count, setCount] = React.useState(initialCount ?? 0);
  const [error, setError] = React.useState<string | null>(null);

  // hydrate status on mount if not provided
  React.useEffect(() => {
    let cancelled = false;
    if (
      typeof initialLiked === "undefined" ||
      typeof initialCount === "undefined"
    ) {
      likeStatus(postId)
        .then((r) => {
          if (!cancelled) {
            setLiked(!!r.liked);
            setCount(r.likeCount ?? 0);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    setError(null);

    // optimistic UI
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    try {
      const r = await likeToggle(postId, next);
      setLiked(!!r.liked);
      setCount(r.likeCount ?? 0);
    } catch (e: any) {
      const msg = String(e?.message || "");
      // Revert
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));

      if (msg === "unauthorized" || msg.includes("401")) {
        // open login
        try {
          const { signIn }: any = await import("next-auth/react");
          signIn?.();
        } catch {}
      } else {
        setError("אירעה שגיאה. נסה שוב.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 select-none ${
        liked ? "text-rose-500" : "text-foreground/70 hover:text-foreground"
      } ${loading ? "opacity-60" : ""} ${className}`}
      title={liked ? "ביטול לייק" : "לייק"}
      aria-pressed={liked}
    >
      <Heart
        size={size}
        className={`transition-transform ${liked ? "fill-current scale-110" : ""}`}
      />
      <span className="text-sm tabular-nums">{count}</span>
      {error ? <span className="sr-only">{error}</span> : null}
    </button>
  );
}
