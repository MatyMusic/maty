// src/components/club/FeedCard.tsx
"use client";
import React from "react";

export type ClubPost = {
  _id: string;
  authorId: string;
  text?: string;
  genre?: string;
  trackUrl?: string;
  videoUrl?: string;
  coverUrl?: string;
  likeCount?: number;
  commentCount?: number; // חדש: עדיף שם עקבי
  shares?: number;
  tags?: string[];
  createdAt?: string;
  views?: number;
};

type LikeResp = { liked: boolean } | null;

const fmtTime = (ts?: string) =>
  ts ? new Date(ts).toLocaleString("he-IL") : "";

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/* ╭─────────────────────────────────────────────────────────╮
   │ Mini hooks                                              │
   ╰─────────────────────────────────────────────────────────╯ */
function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

function useIOOnce(cb: () => void, rootMargin = "320px 0px") {
  const ref = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    let once = false;
    const obs = new IntersectionObserver(
      (ents) => {
        if (!once && ents[0].isIntersecting) {
          once = true;
          cb();
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [cb, rootMargin]);
  return ref as React.RefObject<HTMLElement>;
}

function useOptimistic<T>(value: T) {
  const [state, setState] = React.useState<T>(value);
  React.useEffect(() => setState(value), [value]);
  return [state, setState] as const;
}

/* ╭─────────────────────────────────────────────────────────╮
   │ API helpers (תואם לנתיבים שלך)                         │
   ╰─────────────────────────────────────────────────────────╯ */
async function getLikeStatus(postId: string): Promise<LikeResp> {
  try {
    const r = await fetch(`/api/club/posts/${postId}/like`, {
      cache: "no-store",
    });
    return (await r.json()) as LikeResp;
  } catch {
    return null;
  }
}
async function likeOn(postId: string) {
  return fetch(`/api/club/posts/${postId}/like`, { method: "POST" });
}
async function likeOff(postId: string) {
  return fetch(`/api/club/posts/${postId}/like`, { method: "DELETE" });
}
async function reportPost(postId: string, authorId: string, reason: string) {
  return fetch(`/api/club/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ targetUser: authorId, postId, reason }),
  });
}
async function blockUser(authorId: string) {
  return fetch(`/api/club/block`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: authorId }),
  });
}

/* ╭─────────────────────────────────────────────────────────╮
   │ UI atoms                                                │
   ╰─────────────────────────────────────────────────────────╯ */
function ActionBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        "rounded-xl border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50",
        className,
      ].join(" ")}
    />
  );
}

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-7 rounded-full px-2.5 text-xs border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60">
      {children}
    </span>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ Media                                                   │
   ╰─────────────────────────────────────────────────────────╯ */
function Media({ post }: { post: ClubPost }) {
  if (post.videoUrl) {
    return (
      <div className="aspect-[9/16] w-full bg-black">
        <video
          src={post.videoUrl}
          poster={post.coverUrl || undefined}
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }
  if (post.trackUrl) {
    return (
      <div className="p-4">
        {post.coverUrl && (
          <img
            src={post.coverUrl}
            alt=""
            className="mb-3 w-full rounded-xl object-cover"
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).src =
                "/assets/images/fallback-cover.jpg")
            }
          />
        )}
        <audio className="w-full" controls src={post.trackUrl} preload="none" />
      </div>
    );
  }
  if (post.coverUrl) {
    return (
      <img
        src={post.coverUrl}
        alt=""
        className="w-full object-cover"
        onError={(e) =>
          ((e.currentTarget as HTMLImageElement).src =
            "/assets/images/fallback-cover.jpg")
        }
      />
    );
  }
  return null;
}

/* ╭─────────────────────────────────────────────────────────╮
   │ Overflow Menu (דיווח/חסימה/שיתוף קישור)               │
   ╰─────────────────────────────────────────────────────────╯ */
function OverflowMenu({
  onReport,
  onBlock,
  url,
}: {
  onReport: () => void;
  onBlock: () => void;
  url: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const share = () => {
    if (navigator.share) {
      navigator
        .share({ title: "פוסט מ־MATY-CLUB", text: "שווה הצצה 👇", url })
        .catch(() => navigator.clipboard.writeText(url));
    } else {
      navigator.clipboard.writeText(url);
      alert("קישור הועתק");
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 grid place-items-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
        title="עוד"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[110%] z-20 min-w-40 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 shadow-lg p-1"
        >
          <button
            role="menuitem"
            onClick={share}
            className="block w-full text-right rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            שיתוף/העתקת קישור
          </button>
          <button
            role="menuitem"
            onClick={onReport}
            className="block w-full text-right rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            דיווח על פוסט
          </button>
          <button
            role="menuitem"
            onClick={onBlock}
            className="block w-full text-right rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg:white/5"
          >
            חסימת משתמש
          </button>
        </div>
      )}
    </div>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ FeedCard                                                │
   ╰─────────────────────────────────────────────────────────╯ */
export function FeedCard({ post }: { post: ClubPost }) {
  const mounted = useMounted();

  // לייקים — אופטימי
  const [liked, setLiked] = React.useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useOptimistic<number>(post.likeCount || 0);
  const [working, setWorking] = React.useState(false);

  // שמור מקומי
  const [saved, setSaved] = React.useState(false);

  // צפיות (קליל/אופציונלי)
  const [views, setViews] = React.useState<number>(post.views || 0);
  const viewRef = useIOOnce(() => setViews((v) => v + 1), "600px 0px");

  // טקסט "עוד/פחות"
  const LONG = 360;
  const [expanded, setExpanded] = React.useState(false);
  const text = post.text || "";
  const needsMore = text.length > LONG;
  const shownText = !needsMore || expanded ? text : text.slice(0, LONG) + "…";

  // bootstrap like + saved
  React.useEffect(() => {
    getLikeStatus(post._id).then((j) => setLiked(!!j?.liked));
    try {
      const raw = localStorage.getItem("mm:club:saved");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      setSaved(arr.includes(post._id));
    } catch {}
  }, [post._id]);

  // פעולות
  async function toggleLike() {
    if (working || liked == null) return;
    setWorking(true);
    const want = !liked;
    // אופטימי
    setLiked(want);
    setLikeCount((n) => clamp(n + (want ? 1 : -1), 0, 1e9));
    try {
      const r = want ? await likeOn(post._id) : await likeOff(post._id);
      if (!r.ok) throw new Error("like_failed");
    } catch {
      // החזר מצב
      setLiked(!want);
      setLikeCount((n) => clamp(n + (want ? -1 : +1), 0, 1e9));
    } finally {
      setWorking(false);
    }
  }

  function toggleSaved() {
    try {
      const raw = localStorage.getItem("mm:club:saved");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      const has = arr.includes(post._id);
      const next = has ? arr.filter((x) => x !== post._id) : [...arr, post._id];
      localStorage.setItem("mm:club:saved", JSON.stringify(next));
      setSaved(!has);
    } catch {}
  }

  async function onReport() {
    const reason =
      prompt("סיבת דיווח קצרה (עד 300 תווים):")?.slice(0, 300) || "";
    if (!reason) return;
    const r = await reportPost(post._id, post.authorId, reason);
    alert(r.ok ? "תודה! נבדוק את הדיווח." : "שגיאה בדיווח");
  }

  async function onBlock() {
    if (!confirm("לחסום משתמש זה? תמיד אפשר לבטל אח״כ בהגדרות.")) return;
    const r = await blockUser(post.authorId);
    alert(r.ok ? "נחסם. לא תראה/י ממנו תכנים." : "שגיאה בחסימה");
  }

  const postUrl = mounted ? `${location.origin}/club?post=${post._id}` : "#";

  return (
    <article
      ref={viewRef as any}
      dir="rtl"
      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 overflow-hidden"
    >
      {/* מדיה */}
      <Media post={post} />

      {/* גוף */}
      <div className="p-4">
        {/* מטא מינימלי */}
        <div className="flex items-center gap-2 text-xs opacity-70">
          <span>מאת: {String(post.authorId || "").slice(0, 8) || "—"}</span>
          {post.genre && (
            <>
              <span>•</span>
              <span>ז׳אנר: {post.genre}</span>
            </>
          )}
          <span className="ms-auto">{fmtTime(post.createdAt)}</span>
        </div>

        {/* תגיות — גלילה אופקית במובייל */}
        {(post.tags?.length || 0) > 0 && (
          <div className="mt-2 -mx-1 overflow-auto no-scrollbar [scrollbar-width:thin]">
            <div className="px-1 inline-flex items-center gap-1.5 min-w-full">
              {post.tags!.slice(0, 12).map((t) => (
                <TagPill key={t}>#{t}</TagPill>
              ))}
            </div>
          </div>
        )}

        {/* טקסט */}
        {text && (
          <div className="mt-2">
            <p className="whitespace-pre-wrap leading-relaxed">{shownText}</p>
            {needsMore && (
              <button
                className="mt-1 text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "פחות" : "עוד"}
              </button>
            )}
          </div>
        )}

        {/* אודיו (אם יש) – כבר במדיה, אבל נשאיר תמיכה לשני המצבים */}
        {post.trackUrl && !post.videoUrl && (
          <audio className="w-full mt-3" controls src={post.trackUrl} />
        )}

        {/* פעולות */}
        <div className="mt-4 flex items-center gap-2">
          <ActionBtn
            onClick={toggleLike}
            disabled={working || liked == null}
            title="לייק"
          >
            {liked ? "❤️ אהבתי" : "🤍 לייק"} · {likeCount}
          </ActionBtn>

          <ActionBtn onClick={toggleSaved} title="שמור">
            {saved ? "✅ שמור" : "⭐ שמור"}
          </ActionBtn>

          <ActionBtn
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({
                    title: "פוסט מ־MATY-CLUB",
                    text: post.text?.slice(0, 120) || "שווה הצצה",
                    url: postUrl,
                  })
                  .catch(() => navigator.clipboard.writeText(postUrl));
              } else {
                navigator.clipboard.writeText(postUrl);
                alert("קישור הועתק");
              }
            }}
            title="שיתוף"
          >
            שיתוף
          </ActionBtn>

          {/* מימין: תגובות/צפיות/תפריט */}
          <div className="ms-auto flex items-center gap-2">
            <span
              className="inline-flex items-center h-8 rounded-lg px-2 text-xs border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60"
              title="תגובות"
            >
              💬 {post.commentCount ?? 0}
            </span>
            <span
              className="inline-flex items-center h-8 rounded-lg px-2 text-xs border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60"
              title="צפיות (קליל)"
            >
              👁 {views}
            </span>
            <OverflowMenu onReport={onReport} onBlock={onBlock} url={postUrl} />
          </div>
        </div>
      </div>

      {/* Polish גלובלי קליל לרכיב */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        @media (max-width: 480px) {
          /* כפתורי אקשן – לא יישברו, לחיצה נוחה */
          .mm-feed-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
        }
      `}</style>
    </article>
  );
}
