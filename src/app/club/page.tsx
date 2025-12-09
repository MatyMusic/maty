// src/app/club/page.tsx
"use client";

import ChatDock from "@/components/club/ChatDock";
import ClubAiPanel from "@/components/club/ClubAiPanel";
import ClubImageGenPanel from "@/components/club/ClubImageGenPanel";
import ClubNav from "@/components/club/ClubNav";
import FeedToolbar from "@/components/club/FeedToolbar";
import {
  interleaveWithPromos,
  useInlinePromos,
} from "@/components/club/InlinePromos";
import LiveFeedBar from "@/components/club/LiveFeedBar"; // 🔴 פס שידורים חיים
import PostCard, { PostItem } from "@/components/club/PostCard";
import PromotionsStrip from "@/components/club/PromotionsStrip";
import QuizCreatorPanel from "@/components/club/QuizCreatorPanel";
import { useFeedQuery } from "@/components/club/useFeedQuery";
import * as React from "react";

/* ───────────────── Types ───────────────── */
type FeedResp = { ok: boolean; items: PostItem[]; nextCursor: string | null };

/* ───────────── Local text search ───────────── */
function matchLocalSearch(p: PostItem, q: string) {
  if (!q) return true;
  const s = q.toLowerCase();
  const pile = [
    p.text || "",
    (p.tags || []).join(" "),
    p.genre || "",
    p.authorId || "",
  ]
    .join(" ")
    .toLowerCase();
  return pile.includes(s);
}

/* ─────────── Reveal-on-Scroll ─────────── */
function useStaggerReveal(selector = "[data-reveal]") {
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (prefersReduced) {
      els.forEach((el) => el.classList.add("mm-reveal-in"));
      return;
    }

    let tick = 0;
    const seen = new WeakSet<Element>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          const el = ent.target as HTMLElement;
          if (ent.isIntersecting && !seen.has(el)) {
            seen.add(el);
            const delay = (tick++ % 6) * 50;
            el.style.setProperty("--r-delay", `${delay}ms`);
            el.classList.add("mm-reveal-in");
          }
        }
      },
      { rootMargin: "160px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector]);
}

/* ─────────── Pull-to-Refresh ─────────── */
function usePullToRefresh(onRefresh: () => void) {
  React.useEffect(() => {
    let startY = 0;
    let pulling = false;
    let moved = 0;
    let multitouch = false;

    const onTouchStart = (e: TouchEvent) => {
      multitouch = e.touches.length > 1;
      if (multitouch) return;
      if (window.scrollY > 4) return;
      startY = e.touches[0].clientY;
      pulling = true;
      moved = 0;
      document.documentElement.classList.add("mm-pull-start");
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling || multitouch) return;
      const dy = e.touches[0].clientY - startY;
      moved = Math.max(0, Math.min(100, dy));
      if (moved > 0) {
        document.documentElement.style.setProperty("--pull", `${moved}px`);
        document.documentElement.classList.toggle("mm-pull-armed", moved > 70);
      }
    };
    const end = () => {
      if (!pulling) return;
      pulling = false;
      document.documentElement.classList.remove(
        "mm-pull-start",
        "mm-pull-armed",
      );
      document.documentElement.style.removeProperty("--pull");
      if (moved > 70) onRefresh();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("touchend", end as any);
      window.removeEventListener("touchcancel", end as any);
    };
  }, [onRefresh]);
}

/* ─────────── Key helper (יציב וייחודי) ─────────── */
function postKey(p: any, i: number) {
  const id =
    p?._id ??
    p?.id ??
    p?.postId ??
    (typeof p?.toString === "function" ? p.toString() : "");
  const created = p?.createdAt ?? "";
  return `post-${String(id || "x")}-${String(created || "0")}-${i}`;
}

/* ─────────────── Main Page ─────────────── */
export default function ClubFeedPage() {
  const { filters, patch, reset } = useFeedQuery();

  const [items, setItems] = React.useState<PostItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [initial, setInitial] = React.useState(true);
  const [done, setDone] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const inlinePromos = useInlinePromos();

  useStaggerReveal();

  const load = React.useCallback(
    async (next?: string | null, replace = false) => {
      if (loading || (done && !replace)) return;
      setLoading(true);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const params = new URLSearchParams();
        params.set("limit", "12");
        if (filters.genre) params.set("genre", filters.genre);
        if (filters.tag) params.set("tag", filters.tag);
        if (filters.authorId) params.set("authorId", filters.authorId);
        if (next) params.set("cursor", next);

        const r = await fetch(`/api/club/posts?${params.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        const j: FeedResp = await r.json();
        if (!j?.ok) throw new Error("feed_error");

        setItems((prev) => (replace ? j.items : [...prev, ...j.items]));
        setCursor(j.nextCursor);
        setDone(!j.nextCursor || j.items.length === 0);

        try {
          window.dispatchEvent(
            new CustomEvent("mm:track", {
              detail: {
                kind: "club_fetch",
                count: j.items?.length ?? 0,
                replace,
              },
            }),
          );
        } catch {}
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          console.error(e);
          setDone(true);
        }
      } finally {
        setLoading(false);
        setInitial(false);
      }
    },
    [filters.genre, filters.tag, filters.authorId, loading, done],
  );

  // ריענון במשיכה למעלה (מובייל)
  usePullToRefresh(() => {
    setItems([]);
    setCursor(null);
    setDone(false);
    setInitial(true);
    load(null, true);
  });

  // טעינה ראשונית + שינוי פילטרים
  React.useEffect(() => {
    setItems([]);
    setCursor(null);
    setDone(false);
    setInitial(true);
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.genre, filters.tag, filters.authorId]);

  // אינפיניטי סקרול
  React.useEffect(() => {
    if (!sentinelRef.current || done) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && load(cursor),
      { rootMargin: "560px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, done, load]);

  const visible = React.useMemo(() => {
    const base = items.filter((p) => matchLocalSearch(p, filters.q));
    if (filters.sort === "popular") {
      return base
        .slice()
        .sort(
          (a, b) =>
            (b.likeCount ?? (b as any).likes ?? 0) -
            (a.likeCount ?? (a as any).likes ?? 0),
        );
    }
    return base;
  }, [items, filters.q, filters.sort]);

  const feedNodes = React.useMemo(() => {
    const nodes = visible.map((p, i) => (
      <div
        key={postKey(p, i)}
        data-reveal
        className="mm-will-fade mm-card-pop"
        style={{ contain: "content" }}
      >
        <PostCard post={p} />
      </div>
    ));

    const mixed = interleaveWithPromos(nodes, inlinePromos, 6);

    return mixed.map((el, i) =>
      React.isValidElement(el) ? (
        React.cloneElement(el, {
          key: el.key ?? `row-${i}`,
        })
      ) : (
        <React.Fragment key={`row-${i}`}>{el as any}</React.Fragment>
      ),
    );
  }, [visible, inlinePromos]);

  const EmptyState = (
    <div className="py-16 text-center">
      <div className="text-lg font-semibold">לא נמצאו פוסטים תואמים</div>
      <div className="opacity-70 text-sm mt-1">
        נסה להסיר חלק מהמסננים או לחפש ביטוי אחר.
      </div>
      <button
        onClick={reset}
        className="mt-4 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        אפס פילטרים
      </button>
    </div>
  );

  return (
    <main className="pb-10" dir="rtl">
      {/* ניווט עליון של MATY-CLUB */}
      <ClubNav />

      {/* פס LIVE חכם מעל כל הפיד – מחובר ל-RightSidebar דרך CustomEvent */}
      <section className="mt-2 px-4" data-reveal>
        <div className="mm-will-fade">
          <LiveFeedBar />
        </div>
      </section>

      {/* סרגל פילטרים מתחת ל-LIVE */}
      <div data-reveal className="mm-will-fade">
        <FeedToolbar value={filters} onChange={patch} onReset={reset} />
      </div>

      {/* Layout: פיד + פאנלי AI / חידון */}
      <div className="mt-3 px-4 grid gap-4 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)]">
        {/* עמודת הפיד */}
        <div>
          {/* כותרת HERO קטנה לפיד */}
          <header className="pt-1 lg:pt-2">
            <div data-reveal className="mm-will-fade">
              <h1 className="text-2xl font-extrabold">
                MATY-CLUB • פיד חכם + LIVE
              </h1>
              <p className="opacity-70 text-sm">
                גלילה אינסופית · פילטרים חכמים · פרומואים · לייק/דיווח · עוזר AI
                לכתיבת פוסטים, תמונות, חידונים – ועכשיו גם שידורים חיים בין
                המכבים 🟢.
              </p>
            </div>
          </header>

          {/* פרומואים עליונים */}
          <section className="mt-3">
            <div data-reveal className="mm-will-fade mm-pop">
              <PromotionsStrip placement="feed_top" />
            </div>
          </section>

          {/* הפיד עצמו */}
          <section className="mt-2 grid gap-3 sm:gap-4">
            {initial && items.length === 0 ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="h-44 sm:h-40 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse mm-sheen"
                  />
                ))}
              </>
            ) : visible.length === 0 ? (
              EmptyState
            ) : (
              feedNodes
            )}

            {visible.length > 0 && (
              <>
                {!done ? (
                  <div
                    ref={sentinelRef}
                    className="py-10 text-center text-sm opacity-60"
                    aria-live="polite"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2 align-middle">
                        <span className="mm-dot" />
                        <span className="mm-dot" />
                        <span className="mm-dot" />
                      </span>
                    ) : (
                      "ממשיך לטעון כשמגיעים לתחתית…"
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm opacity-60">
                    זהו. הגעת לסוף 👋
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* עמודת ה-AI + חידון (בדסקטופ) */}
        <aside className="hidden lg:flex flex-col gap-4">
          <ClubAiPanel variant="sidebar" />
          <ClubImageGenPanel />
          <QuizCreatorPanel />
        </aside>
      </div>

      {/* במובייל – AI + מחולל תמונות + חידון מתחת לפיד */}
      <section className="mt-4 px-4 lg:hidden space-y-4">
        <ClubAiPanel variant="inline" />
        <ClubImageGenPanel />
        <QuizCreatorPanel />
      </section>

      {/* צ'אט קטן של ה-CLUB */}
      <ChatDock />

      {/* ── אנימציות ו-Pull to refresh ── */}
      <style jsx global>{`
        .mm-will-fade {
          opacity: 0;
          transform: translateY(6px) scale(0.995);
          transition:
            opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .mm-reveal-in {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
          transition-delay: var(--r-delay, 0ms);
        }
        .mm-card-pop {
          animation: mmCardPop 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--r-delay, 0ms);
        }
        @keyframes mmCardPop {
          0% {
            transform: translateY(8px) scale(0.99);
            opacity: 0.02;
          }
          55% {
            transform: translateY(1px) scale(1.002);
            opacity: 0.92;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .mm-pop {
          animation: mmPop 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes mmPop {
          0% {
            transform: scale(0.985);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .mm-sheen {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .mm-sheen::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.55) 42%,
            transparent 60%
          );
          animation: mmSheen 1.4s ease-in-out infinite;
        }
        @keyframes mmSheen {
          100% {
            transform: translateX(100%);
          }
        }
        .mm-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.6;
          display: inline-block;
          animation: mmPulse 1.2s infinite ease-in-out;
        }
        .mm-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .mm-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes mmPulse {
          0%,
          80%,
          100% {
            transform: scale(0.85);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        :root.mm-pull-start::before {
          content: "משוך לריענון…";
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px));
          inset-inline: 0;
          text-align: center;
          transform: translateY(calc(var(--pull, 0px) * 0.45));
          padding: 8px 0;
          font-size: 12px;
          opacity: 0.72;
          pointer-events: none;
          z-index: 60;
          backdrop-filter: saturate(120%) blur(8px);
          color: inherit;
        }
        :root.mm-pull-armed::before {
          content: "שחרר לריענון ✨";
          opacity: 0.92;
          font-weight: 800;
        }
        @media (max-width: 480px) {
          .mm-will-fade {
            transform: translateY(4px) scale(0.997);
            transition-duration: 360ms;
          }
          .mm-card-pop {
            animation-duration: 520ms;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mm-will-fade,
          .mm-card-pop,
          .mm-pop,
          .mm-sheen::after {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}
