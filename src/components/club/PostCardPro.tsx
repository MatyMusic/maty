"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useSpring,
} from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { sendTelemetry } from "@/lib/telemetry";

type Media = {
  kind: "image" | "video";
  src: string;
  thumb?: string;
};

type PostPro = {
  _id: string;
  author?: { name?: string; avatarUrl?: string };
  createdAt: string | Date;
  text?: string;
  hashtags?: string[];
  images?: string[]; // שמירה קיימת אצלך
  videoUrl?: string | null;
  likeCount?: number;
  commentCount?: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function timeAgo(d: string | Date) {
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "רגע";
  if (mins < 60) return `${mins} ד׳`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} שע׳`;
  const days = Math.floor(h / 24);
  return `${days} ימ׳`;
}

function Avatar({ name, src }: { name?: string; src?: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center">
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold">{letter}</span>
      )}
    </div>
  );
}

function ExpandableText({
  text = "",
  max = 220,
}: {
  text?: string;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const needsCut = text.length > max;

  const shown = open ? text : text.slice(0, max);
  return (
    <div className="text-[15px] leading-6">
      <span className="whitespace-pre-line break-words">{shown}</span>
      {needsCut && !open && <span className="opacity-60">…</span>}
      {needsCut && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-2 text-violet-600 hover:underline"
        >
          {open ? "פחות" : "עוד"}
        </button>
      )}
    </div>
  );
}

function useInViewOnce(threshold = 0.6) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          entries[0].intersectionRatio >= threshold
        ) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, seen]);
  return { ref, seen };
}

function MediaCarousel({ items }: { items: Media[] }) {
  const [idx, setIdx] = useState(0);
  const go = (dir: number) =>
    setIdx((i) => clamp(i + dir, 0, items.length - 1));
  const cur = items[idx];

  // וידאו: אוטו-פליי כשהסלייד פעיל ובפוקוס
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const play = async () => {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    };
    if (cur.kind === "video") play();
    return () => {
      if (v) v.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, cur?.src]);

  return (
    <div className="relative rounded-xl overflow-hidden border dark:border-white/10 bg-black">
      {/* מדיה */}
      <div className="aspect-[4/5] sm:aspect-[4/3] w-full max-h-[72vh] grid place-items-center">
        {cur.kind === "image" ? (
          <img src={cur.src} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={cur.src}
              muted={muted}
              playsInline
              loop
              className="w-full h-full object-cover"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) v.play();
                  else v.pause();
                }}
                className="rounded-full bg-white/80 backdrop-blur px-2.5 py-1.5 flex items-center gap-1 text-sm"
              >
                {playing ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {playing ? "הפסק" : "נגן"}
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                className="rounded-full bg-white/80 backdrop-blur p-1.5"
                aria-label={muted ? "בטל השתקה" : "השתק"}
                title={muted ? "בטל השתקה" : "השתק"}
              >
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* חצים + מונה */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute top-1/2 -translate-y-1/2 right-2 rounded-full bg-white/85 hover:bg-white p-2 shadow"
            aria-label="הקודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => go(+1)}
            className="absolute top-1/2 -translate-y-1/2 left-2 rounded-full bg-white/85 hover:bg-white p-2 shadow"
            aria-label="הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-xs px-2 py-0.5">
            {idx + 1}/{items.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function PostCardPro({ post }: { post: PostPro }) {
  // בנה מערך מדיה אחיד
  const media = useMemo<Media[]>(() => {
    const arr: Media[] = [];
    (post.images || []).forEach((src) => arr.push({ kind: "image", src }));
    if (post.videoUrl) arr.push({ kind: "video", src: post.videoUrl });
    return arr;
  }, [post.images, post.videoUrl]);

  const likeAnim = useAnimation();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState<boolean | null>(null); // null = לא נטען עדיין

  // טען מצב לייק ראשוני
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r = await fetch(`/api/posts/${post._id}/like`, {
          cache: "no-store",
        });
        if (!on) return;
        const j = await r.json();
        setLiked(!!j.liked);
      } catch {
        setLiked(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [post._id]);

  // טלמטריה: נצפה פעם אחת
  const { ref, seen } = useInViewOnce(0.6);
  useEffect(() => {
    if (seen) sendTelemetry("view_post", { postId: post._id });
  }, [seen, post._id]);

  // לייק אופטימי
  const toggleLike = useCallback(async () => {
    const prev = liked === true;
    setLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : +1));

    // אנימציית פופ
    likeAnim.start({
      scale: [1, 1.25, 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });

    try {
      const method = prev ? "DELETE" : "POST";
      const r = await fetch(`/api/posts/${post._id}/like`, { method });
      if (!r.ok) throw new Error("like failed");
      sendTelemetry(prev ? "unlike_click" : "like_click", { postId: post._id });
    } catch {
      // החזר מצב אם נכשל
      setLiked(prev);
      setLikeCount((c) => c + (prev ? +1 : -1));
    }
  }, [liked, post._id, likeAnim]);

  // קיצורי מקשים: L לייק, S שמירה, C תגובה
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // אל תתנגש בשדות קלט
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;

      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLike();
      }
      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        document.getElementById(`cmt-${post._id}`)?.focus();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        onBookmark();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleLike, post._id]);

  const [bookmarked, setBookmarked] = useState(false);
  const onBookmark = () => {
    setBookmarked((b) => !b);
    sendTelemetry("bookmark_toggle", { postId: post._id, to: !bookmarked });
  };

  const onShare = async () => {
    const url = `${location.origin}/club/post/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      sendTelemetry("share_click", { postId: post._id });
    } catch {}
  };

  // סגנון כרטיס: יפה לדסקטופ, לא “בורח” לצדדים
  return (
    <article
      ref={ref}
      className="mx-auto max-w-[720px] sm:rounded-2xl border bg-white/85 dark:bg-neutral-950/70 dark:border-white/10 overflow-hidden shadow-sm"
    >
      {/* כותרת */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={post.author?.name} src={post.author?.avatarUrl} />
          <div className="min-w-0 text-right">
            <div className="font-semibold leading-tight truncate">
              {post.author?.name || "משתמש"}
            </div>
            <div className="text-xs opacity-70">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <button
          className="rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 p-2"
          aria-label="עוד אפשרויות"
          title="עוד"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* טקסט */}
      {post.text ? (
        <div className="px-3 sm:px-4 pb-3">
          <ExpandableText text={post.text} max={260} />
        </div>
      ) : null}

      {/* מדיה */}
      {media.length > 0 ? (
        <div className="px-3 sm:px-4 pb-3">
          <MediaCarousel items={media} />
        </div>
      ) : null}

      {/* סרגל פעולות */}
      <div className="px-3 sm:px-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button
              onClick={toggleLike}
              animate={likeAnim}
              aria-pressed={liked ?? false}
              className={[
                "rounded-full px-3 py-1.5 text-sm border",
                liked
                  ? "bg-rose-600 text-white border-rose-700"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-900",
              ].join(" ")}
              title="אהבתי (L)"
            >
              <span className="inline-flex items-center gap-2">
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </span>
            </motion.button>

            <button
              onClick={() =>
                document.getElementById(`cmt-${post._id}`)?.focus()
              }
              className="rounded-full px-3 py-1.5 text-sm border hover:bg-neutral-100 dark:hover:bg-neutral-900"
              title="תגובה (C)"
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentCount ?? 0}</span>
              </span>
            </button>

            <button
              onClick={onShare}
              className="rounded-full px-3 py-1.5 text-sm border hover:bg-neutral-100 dark:hover:bg-neutral-900"
              title="שתף"
            >
              <span className="inline-flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>שתף</span>
              </span>
            </button>
          </div>

          <button
            onClick={onBookmark}
            aria-pressed={bookmarked}
            className={[
              "rounded-full px-3 py-1.5 text-sm border",
              bookmarked
                ? "bg-violet-600 text-white border-violet-700"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-900",
            ].join(" ")}
            title="שמירה (S)"
          >
            <span className="inline-flex items-center gap-2">
              <Bookmark
                className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`}
              />
              <span>{bookmarked ? "נשמר" : "שמור"}</span>
            </span>
          </button>
        </div>

        {/* שורת תגובה מהירה (דמה UX) */}
        <div className="mt-3">
          <input
            id={`cmt-${post._id}`}
            type="text"
            placeholder="כתוב תגובה נעימה…"
            className="w-full rounded-xl border dark:border-white/10 bg-white/70 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>
    </article>
  );
}
