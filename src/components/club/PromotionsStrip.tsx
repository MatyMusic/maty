// src/components/club/PromotionsStrip.tsx
"use client";

import { useI18n } from "@/components/common/LocaleProvider";
import { normalizeLocale } from "@/lib/i18n/locale";
import * as React from "react";

/* ───────────────── Types ───────────────── */

type KnownPlacement =
  | "feed_top"
  | "feed_inline"
  | "feed_side"
  | "rail_left"
  | "rail_right"
  | "home_top"
  | "home_inline"
  | "music_top"
  | "music_inline";

type Promo = {
  _id?: string;
  id?: string;
  key?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaText?: string;
  link?: string;
  linkUrl?: string;
  couponCode?: string;
  placement?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  order?: number;
  tags?: string[];
  locales?: string[]; // ← חשוב לסינון
};

type Props = {
  placement?: KnownPlacement | string; // לשמור תאימות לקוד שלך
  limit?: number;
  className?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  /** האם להציג כותרת קטנה מעל הרצועה (למשל "מבצעים חמים") */
  showHeader?: boolean;
  headerLabel?: string;
};

/* ───────────────── Utils ───────────────── */

function cls(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

/**
 * מסנן לפי שפה + placement.
 * גם אם השרת לא סינן – כאן זה הביטוח.
 */
function filterByLocaleAndPlacement(
  items: Promo[],
  locale: string,
  placement?: string,
) {
  const want = normalizeLocale(locale);
  return items.filter((p) => {
    // אם יש placement במסמך והוא לא תואם – לדלג (הקשחה בצד לקוח)
    if (placement && p.placement && p.placement !== placement) return false;

    // אם אין locales בכלל → הפרומו לכל השפות
    const locs = Array.isArray(p.locales) ? p.locales : [];
    if (!locs.length) return true;

    // השוואה סלחנית: "he" ≡ "he-IL"
    return locs.map(normalizeLocale).includes(want);
  });
}

/**
 * יצירת key יציב כדי להימנע מאזהרות React.
 */
function getPromoKey(p: Promo, index: number): string {
  return (
    (p._id as string) ||
    (p.id as string) ||
    (p.key as string) ||
    `${index}-${p.title || "promo"}`
  );
}

/**
 * הוספת UTM בצורה בטוחה.
 */
function withUtm(
  url: string | undefined,
  placement: string | undefined,
  utm: Props["utm"],
) {
  if (!url) return undefined;
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://maty.music";
    const u = new URL(url, base);
    if (utm?.source) u.searchParams.set("utm_source", utm.source);
    if (utm?.medium) u.searchParams.set("utm_medium", utm.medium);
    if (utm?.campaign) u.searchParams.set("utm_campaign", utm.campaign);
    if (placement) u.searchParams.set("utm_content", placement);
    return u.toString();
  } catch {
    return url;
  }
}

async function copyCoupon(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    alert("הקופון הועתק");
  } catch {
    alert(code);
  }
}

/* ───────────────── Hook לטעינת הנתונים ───────────────── */

function usePromosData(
  placement: string | undefined,
  limit: number,
  locale: string,
) {
  const [items, setItems] = React.useState<Promo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        const qs = new URLSearchParams();
        if (placement) qs.set("placement", placement);
        qs.set("active", "1");
        qs.set("limit", String(limit));
        qs.set("locale", locale); // שולחים שפה לשרת (אם מסנן)

        const r = await fetch(`/api/club/promotions?${qs.toString()}`, {
          cache: "no-store",
          headers: { "x-app-locale": locale },
          signal: ac.signal,
        });

        const json: any = await r.json().catch(() => ({}));
        if (!mountedRef.current) return;

        if (r.ok && json?.ok) {
          const raw: Promo[] = Array.isArray(json.items) ? json.items : [];
          // ביטוח ברזל: גם אם השרת לא סינן, נסנן כאן לפי שפה + placement
          const byLocale = filterByLocaleAndPlacement(raw, locale, placement);
          setItems(byLocale.slice(0, Math.max(1, limit)));
        } else {
          setErr(`HTTP ${r.status}`);
          setItems([]);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "fetch_failed");
        setItems([]);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [placement, limit, locale]);

  return { items, loading, err };
}

/* ───────────────── UI: Skeleton ───────────────── */

function PromosSkeleton({
  limit,
  className,
}: {
  limit: number;
  className?: string;
}) {
  return (
    <div className={cls("mb-4 grid gap-3", className)}>
      {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
        <div
          key={`promo-skel-${i}`}
          className="flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 p-3"
        >
          <div className="size-14 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="ms-auto h-6 w-16 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ───────────────── UI: כרטיס פרומו בודד ───────────────── */

function PromoCard({
  promo,
  placement,
  utm,
  emphasis = "normal",
}: {
  promo: Promo;
  placement?: string;
  utm: Props["utm"];
  emphasis?: "normal" | "hero";
}) {
  const href = withUtm(promo.linkUrl || promo.link || "#", placement, utm);
  const clickable = href && href !== "#";

  const hasCoupon = Boolean(promo.couponCode);
  const hasTags = Array.isArray(promo.tags) && promo.tags.length > 0;

  const baseClass =
    "flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-r p-3 hover:brightness-105 transition";

  const gradientClass =
    emphasis === "hero"
      ? "from-fuchsia-100 to-violet-100 dark:from-fuchsia-950/50 dark:to-violet-900/50"
      : "from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40";

  return (
    <a
      href={href}
      target={clickable ? "_blank" : undefined}
      rel={clickable ? "noopener noreferrer" : undefined}
      className={cls(baseClass, gradientClass)}
    >
      {promo.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={promo.imageUrl}
          alt=""
          className={cls(
            "rounded-xl object-cover",
            emphasis === "hero" ? "size-16 sm:size-18" : "size-14",
          )}
          loading="lazy"
        />
      ) : (
        <div
          className={cls(
            "rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-black/80 dark:text-white/80",
            emphasis === "hero" ? "size-16 sm:size-18" : "size-14",
          )}
        >
          AD
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div
          className={cls(
            "truncate",
            emphasis === "hero"
              ? "font-extrabold text-[14px]"
              : "font-bold text-[13px]",
          )}
        >
          {promo.title}
        </div>

        {promo.body && (
          <div
            className={cls(
              "opacity-80 line-clamp-2",
              emphasis === "hero" ? "text-[12px]" : "text-[12px]",
            )}
          >
            {promo.body}
          </div>
        )}

        {/* Tags / Coupon */}
        {(hasTags || hasCoupon) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {hasTags &&
              promo.tags!.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px]"
                >
                  #{t}
                </span>
              ))}

            {hasCoupon && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  copyCoupon(promo.couponCode!);
                }}
                className="rounded-full border border-black/15 dark:border-white/20 px-2 py-0.5 text-[10px] hover:bg-black/5 dark:hover:bg-white/10"
              >
                קופון: {promo.couponCode}
              </button>
            )}
          </div>
        )}
      </div>

      {promo.ctaText && (
        <span
          className={cls(
            "ms-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
            emphasis === "hero"
              ? "bg-violet-700 text-white"
              : "bg-violet-600 text-white",
          )}
        >
          {promo.ctaText}
        </span>
      )}
    </a>
  );
}

/* ───────────────── קומפוננטה ראשית ───────────────── */

export default function PromotionsStrip({
  placement = "feed_top",
  limit = 6,
  className = "",
  utm = { source: "maty-club", medium: "promo", campaign: "feed" },
  showHeader = false,
  headerLabel,
}: Props) {
  const { locale } = useI18n(); // "he" | "en" | "ru" | ...
  const { items, loading, err } = usePromosData(placement, limit, locale);

  if (loading) {
    return <PromosSkeleton limit={limit} className={className} />;
  }

  if (err || !items.length) return null;

  const hero = items[0];
  const rest = items.slice(1);

  const isFeedTop = placement === "feed_top" || placement === "home_top";

  return (
    <section className={cls("mb-4", className)}>
      {showHeader && (
        <header className="mb-1 flex items-baseline justify-between px-1">
          <div className="text-[13px] font-semibold">
            {headerLabel || "מבצעים מומלצים בשבילך"}
          </div>
          <div className="text-[11px] opacity-60">
            ממומן · מותאם ל־MATY-CLUB
          </div>
        </header>
      )}

      {isFeedTop ? (
        // לייאאוט עשיר יותר ל-top של הפיד
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          {/* הירו */}
          <PromoCard
            promo={hero}
            placement={placement}
            utm={utm}
            emphasis="hero"
          />

          {/* השאר בטור או רשת */}
          {rest.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-1">
              {rest.map((p, i) => (
                <PromoCard
                  key={getPromoKey(p, i)}
                  promo={p}
                  placement={placement}
                  utm={utm}
                  emphasis="normal"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // לייאאוט רגיל/צידי
        <div className="grid gap-3">
          {items.map((p, i) => (
            <PromoCard
              key={getPromoKey(p, i)}
              promo={p}
              placement={placement}
              utm={utm}
              emphasis="normal"
            />
          ))}
        </div>
      )}
    </section>
  );
}
