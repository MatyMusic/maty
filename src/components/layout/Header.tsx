// src/components/layout/Header.tsx
"use client";

import AdminBypassButton from "@/components/AdminBypassButton";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ╭─────────────────────────────────────────────────────────╮
   │ Utils – Scroll Lock (ref-count, iOS-safe)               │
   ╰─────────────────────────────────────────────────────────╯ */
const SCROLL_LOCK_KEY = "__mmScrollLock" as const;
type LockState = { count: number; y: number };
function getLockState(): LockState {
  const w = window as any;
  if (!w[SCROLL_LOCK_KEY]) w[SCROLL_LOCK_KEY] = { count: 0, y: 0 } as LockState;
  return w[SCROLL_LOCK_KEY] as LockState;
}
function lockScroll() {
  const st = getLockState();
  if (st.count === 0) {
    st.y = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    const html = document.documentElement;
    html.style.scrollBehavior = "auto";
    body.style.position = "fixed";
    body.style.top = `-${st.y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
  }
  st.count++;
}
function unlockScroll() {
  const st = getLockState();
  st.count = Math.max(0, st.count - 1);
  if (st.count === 0) {
    const y = st.y || 0;
    const body = document.body;
    const html = document.documentElement;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    html.style.scrollBehavior = "";
    window.scrollTo(0, y);
  }
}
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (active) lockScroll();
    return () => {
      if (active) unlockScroll();
    };
  }, [active]);
}

/* ╭─────────────────────────────────────────────────────────╮
   │ i18n – שפות                                            │
   ╰─────────────────────────────────────────────────────────╯ */
type LocaleCode = "he" | "en" | "fr" | "ru";
const LOCALES: LocaleCode[] = ["he", "en", "fr", "ru"];
const NEXT_LOCALE: Record<LocaleCode, LocaleCode> = {
  he: "en",
  en: "fr",
  fr: "ru",
  ru: "he",
};
const LABEL: Record<LocaleCode, string> = {
  he: "HE",
  en: "EN",
  fr: "FR",
  ru: "RU",
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([$?*|{}\]\\^\\[\\])/g, "\\$1") + "=([^;]*)",
    ),
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function LanguageToggleInline({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [lc, setLc] = useState<LocaleCode>("he");

  useEffect(() => {
    try {
      const stored =
        (typeof localStorage !== "undefined" &&
          (localStorage.getItem("mm_locale") as LocaleCode | null)) ||
        (getCookie("mm_locale") as LocaleCode | null) ||
        (document.documentElement.lang as LocaleCode | null) ||
        "he";

      const fallback: LocaleCode = LOCALES.includes(stored as LocaleCode)
        ? (stored as LocaleCode)
        : "he";

      setLc(fallback);
      document.documentElement.lang = fallback;
      document.documentElement.dir = fallback === "he" ? "rtl" : "ltr";
    } catch {
      setLc("he");
    }
  }, []);

  function setLangAttrs(code: LocaleCode) {
    try {
      document.documentElement.lang = code;
      document.documentElement.dir = code === "he" ? "rtl" : "ltr";
      document.cookie = `mm_locale=${code}; path=/; max-age=31536000; samesite=lax`;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("mm_locale", code);
      }
    } catch {}
  }

  function go(next: LocaleCode) {
    setLangAttrs(next);
    setLc(next);

    const parts = (pathname || "/").split("/");
    const hasPrefix = LOCALES.includes((parts[1] || "").toLowerCase() as any);
    const url = new URL(window.location.href);

    if (hasPrefix) {
      parts[1] = next;
      url.pathname = parts.join("/");
    } else {
      url.searchParams.set("lang", next);
      url.searchParams.set("_ts", String(Date.now()));
    }
    window.location.href = url.toString();
  }

  return (
    <button
      type="button"
      onClick={() => go(NEXT_LOCALE[lc])}
      className={[
        "inline-flex h-10 items-center justify-center rounded-full px-3 text-xs font-bold",
        "border border-black/10 dark:border-white/10",
        "bg-white/90 dark:bg-neutral-900/85 hover:bg-white dark:hover:bg-neutral-800",
        "mm-glow-soft transition",
        className,
      ].join(" ")}
      title="החלף שפה"
      aria-label="החלף שפה"
    >
      {LABEL[lc]}
    </button>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ Presence – מי סביבי                                    │
   ╰─────────────────────────────────────────────────────────╯ */
type NearbyUser = {
  id: string;
  name?: string;
  city?: string;
  sinceSec?: number;
  avatar?: string;
};
function usePresenceCount(pollMs = 15000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let dead = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/presence/count", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!dead && j && typeof j.count === "number") setCount(j.count);
      } catch {}
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      dead = true;
      clearInterval(id);
    };
  }, [pollMs]);
  return count;
}
function useNearby(open: boolean) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<NearbyUser[]>([]);
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/presence/nearby?limit=24", {
          cache: "no-store",
          signal: ac.signal,
        });
        const j = await r.json().catch(() => null);
        setList(Array.isArray(j?.items) ? j.items : []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open]);
  return { loading, list };
}
function PresenceBadge({ onOpen }: { onOpen: () => void }) {
  const count = usePresenceCount();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-9 md:h-10 items-center gap-2 rounded-full px-3 border border-emerald-500/30 bg-white/85 dark:bg-neutral-900/75 hover:bg-white dark:hover:bg-neutral-800/80 shadow-sm mm-glow-green"
      title="מי סביבי"
    >
      <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500">
        <span
          aria-hidden
          className="absolute inset-[-4px] rounded-full border border-emerald-500/40 animate-ping"
        />
      </span>
      <span className="text-xs md:text-sm font-semibold">מי סביבי</span>
      <span className="text-xs md:text-sm font-bold tabular-nums">{count}</span>
    </button>
  );
}
function AroundMePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { loading, list } = useNearby(open);
  useScrollLock(open);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[230]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div
        dir="rtl"
        className="absolute right-3 top-[88px] w-[min(96vw,560px)] rounded-2xl border border-emerald-400/30 dark:border-emerald-300/20 bg-white/97 dark:bg-neutral-950/95 shadow-2xl p-4 mm-glow-card"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-sm md:text-base">מי סביבי עכשיו</div>
          <button className="mm-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        {loading ? (
          <div className="text-sm opacity-70">טוען…</div>
        ) : list.length ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 p-2"
              >
                <img
                  src={u.avatar || "/assets/images/avatar-soft.png"}
                  alt={u.name || ""}
                  className="h-9 w-9 rounded-full object-cover border border-black/10 dark:border-white/10"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src =
                      "/assets/images/avatar-soft.png")
                  }
                />
                <div className="min-w-0 text-right">
                  <div className="truncate text-sm font-semibold">
                    {u.name || "אורח"}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {u.city ? `עיר: ${u.city}` : "מיקום לא ידוע"} •{" "}
                    {u.sinceSec ? `${u.sinceSec}s מחובר` : "מחובר"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm opacity-70">אין נתונים כרגע.</div>
        )}
      </div>
    </div>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ הודעות משתמש – באדג' למעלה (רק למי שמחובר)            │
   ╰─────────────────────────────────────────────────────────╯ */
function useUserMessageCount(enabled: boolean, pollMs = 20000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let dead = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/user/messages/unread", {
          cache: "no-store",
        });
        const j = await r.json().catch(() => null);
        if (!dead && j && typeof j.count === "number") {
          setCount(j.count);
        }
      } catch {
        // ignore
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      dead = true;
      clearInterval(id);
    };
  }, [enabled, pollMs]);
  return count;
}
function MessagesBadge({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  const count = useUserMessageCount(enabled);
  if (!enabled || count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 md:h-10 items-center gap-2 rounded-full px-3 border border-sky-500/40 bg-white/85 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800/80 shadow-sm mm-glow-soft"
      title="הודעות חדשות"
    >
      <span aria-hidden>✉️</span>
      <span className="text-xs md:text-sm font-semibold">הודעות</span>
      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-sky-500 text-white text-[11px] font-bold">
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ Admin – זיהוי                                          │
   ╰─────────────────────────────────────────────────────────╯ */
function adminAllowlist(): string[] {
  const raw = (process?.env?.NEXT_PUBLIC_ADMIN_EMAILS || "").toLowerCase();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function isAdminFromSession(session: any): boolean {
  const role = session?.user?.role;
  const flag = session?.user?.isAdmin === true;
  const email = (session?.user?.email || "").toLowerCase();
  const allowed = email && adminAllowlist().includes(email);
  return !!(role === "admin" || role === "superadmin" || flag || allowed);
}
function getLocalAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("mm:admin") === "1";
}

/* ╭─────────────────────────────────────────────────────────╮
   │ AdminPanelDrawer – בעברית + באדג'ים                    │
   ╰─────────────────────────────────────────────────────────╯ */
function CountBadge({ n }: { n?: number }) {
  if (!n || n <= 0) return null;
  return (
    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold">
      {n > 99 ? "99+" : n}
    </span>
  );
}
function AdminPanelDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [counts, setCounts] = useState<{
    notifications?: number;
    messages?: number;
    reports?: number;
  }>({});

  useScrollLock(open);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    let dead = false;
    (async () => {
      try {
        const [nR, mR, rR] = await Promise.allSettled([
          fetch("/api/admin/notifications/unread", { cache: "no-store" }),
          fetch("/api/admin/messages/unread", { cache: "no-store" }),
          fetch("/api/admin/reports/pending", { cache: "no-store" }),
        ]);
        const notifications =
          nR.status === "fulfilled"
            ? (await nR.value.json().catch(() => null))?.count
            : undefined;
        const messages =
          mR.status === "fulfilled"
            ? (await mR.value.json().catch(() => null))?.count
            : undefined;
        const reports =
          rR.status === "fulfilled"
            ? (await rR.value.json().catch(() => null))?.count
            : undefined;
        if (!dead) setCounts({ notifications, messages, reports });
      } catch {}
    })();
    return () => {
      dead = true;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[240]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div
        dir="rtl"
        className="absolute inset-y-0 left-0 w-[min(92vw,540px)] bg-white dark:bg-neutral-950 border-r border-black/10 dark:border-white/10 shadow-2xl p-4 overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold">פאנל ניהול</div>
          <button className="mm-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-3 grid gap-2 text-right">
          <Link href="/admin" className="mm-btn">
            🛠 לוח ניהול
          </Link>
          <Link href="/admin/users" className="mm-btn">
            👥 משתמשים
          </Link>
          <Link href="/admin/content" className="mm-btn">
            📝 תכנים
          </Link>
          <Link href="/admin/events" className="mm-btn">
            📅 אירועים
          </Link>
          <Link href="/admin/metrics" className="mm-btn">
            📈 מדדים
          </Link>
          <Link href="/admin/broadcast" className="mm-btn">
            📣 שידור הודעה
          </Link>
        </div>

        <div className="mt-4 grid gap-2 text-right">
          <Link href="/admin/notifications" className="mm-btn">
            🔔 התראות חדשות <CountBadge n={counts.notifications} />
          </Link>
          <Link href="/admin/messages" className="mm-btn">
            ✉️ הודעות חדשות <CountBadge n={counts.messages} />
          </Link>
          <Link href="/admin/reports" className="mm-btn">
            🚩 דיווחים ממתינים <CountBadge n={counts.reports} />
          </Link>
        </div>

        <div className="mt-4 grid gap-2">
          <AdminBypassButton />
          <Link
            href="/api/admin/status"
            className="mm-btn"
            target="_blank"
            rel="noreferrer"
          >
            🔎 בדוק סטטוס
          </Link>
          <Link
            href="/api/admin/unbypass"
            className="mm-btn"
            target="_blank"
            rel="noreferrer"
          >
            🚫 נקה Bypass
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ Assistant floating – שמאלה, מוסתר מובייל               │
   ╰─────────────────────────────────────────────────────────╯ */
const ASSISTANT_IMG = "/assets/images/assistant-gamer.png";
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function AssistantFloatingAvatar({ onOpen }: { onOpen: () => void }) {
  const [greet, setGreet] = useState(false);
  const [y, setY] = useState(88);

  useEffect(() => {
    if (!sessionStorage.getItem("mm:assistant:greeted")) {
      setGreet(true);
      sessionStorage.setItem("mm:assistant:greeted", "1");
      const t = setTimeout(() => setGreet(false), 1400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const move = () => {
      const vh = Math.max(520, window.innerHeight);
      const ny = clamp(76 + Math.round(Math.random() * 14), 56, vh - 160);
      setY(ny);
    };
    move();
    const id = setInterval(move, 16000);
    const onResize = () => {
      const vh = Math.max(520, window.innerHeight);
      setY((prev) => clamp(prev, 56, vh - 160));
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="fixed left-3 z-[200] pointer-events-auto will-change-transform transition-[top] duration-700 ease-out hidden md:block"
      style={{ top: y }}
    >
      {greet && (
        <div
          dir="rtl"
          className="absolute -top-2 left-[3.5rem] -translate-y-full rounded-2xl px-3 py-1 text-xs font-semibold bg-white/95 dark:bg-neutral-900/95 border border-black/10 dark:border-white/10 shadow"
        >
          איך אפשר לעזור? 🙂
        </div>
      )}
      <button
        onClick={onOpen}
        title="שאלו את העוזר"
        aria-label="שאלו את העוזר"
        className="relative h-12 w-12 rounded-full border border-amber-400/50 dark:border-amber-300/30 bg-white/95 dark:bg-neutral-900/90 shadow-lg overflow-hidden hover:scale-[1.03] transition mm-glow-amber"
      >
        <img
          src={ASSISTANT_IMG}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).src =
              "/assets/images/avatar-soft.png")
          }
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-300/40"
        />
      </button>
    </div>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ BroadcastChannel – Avatar חי + עדכון פרופיל            │
   ╰─────────────────────────────────────────────────────────╯ */
type NavHoverTag = "club" | "jam" | "fit" | "date";
const BC_NAV = "mm-nav";
const BC_AVATARS = "mm-home-avatars";
const BC_AVATAR = "mm:avatar";
const AVATAR_BY_TAG: Record<NavHoverTag, string> = {
  club: "/assets/avatars/club.png",
  jam: "/assets/avatars/jam.png",
  fit: "/assets/avatars/fit.png",
  date: "/assets/avatars/date.png",
};
const DEFAULT_AVATAR = "/assets/images/avatar-soft.png";

/* ╭─────────────────────────────────────────────────────────╮
   │ Geo/Clock – עיר, דגל ושעה מקומית                      │
   ╰─────────────────────────────────────────────────────────╯ */
function countryCodeToFlag(code?: string): string {
  if (!code) return "";
  const cc = code.toUpperCase();
  return cc.replace(/./g, (c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0)),
  );
}
function useLocalPlaceAndTime() {
  const [label, setLabel] = useState<string>("");
  const [flag, setFlag] = useState<string>("");

  useEffect(() => {
    let cancel = false;
    const timeStr = () =>
      new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    const apply = (city: string, countryCode?: string) => {
      if (cancel) return;
      const f = countryCodeToFlag(countryCode);
      setFlag(f);
      setLabel(city ? `${city} • ${timeStr()}` : timeStr());
    };

    const tick = setInterval(
      () =>
        setLabel((p) => {
          const city = p.includes("•") ? p.split("•")[0].trim() : "";
          return city ? `${city} • ${timeStr()}` : timeStr();
        }),
      30_000,
    );

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const r = await fetch(
              `/api/geo/reverse?lat=${latitude}&lon=${longitude}`,
              {
                cache: "no-store",
              },
            );
            const j = await r.json().catch(() => null);
            const city =
              j?.city ||
              j?.locality ||
              j?.name ||
              `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
            const cc =
              j?.countryCode ||
              j?.country?.code ||
              j?.country_code ||
              undefined;
            apply(city, cc);
          } catch {
            apply(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
          }
        },
        async () => {
          try {
            const r = await fetch("/api/geo/ip", { cache: "no-store" });
            const j = await r.json().catch(() => null);
            const city = j?.city || j?.locality || j?.name || "";
            const cc =
              j?.countryCode ||
              j?.country?.code ||
              j?.country_code ||
              undefined;
            apply(city, cc);
          } catch {
            apply("");
          }
        },
        { maximumAge: 600000, timeout: 8000, enableHighAccuracy: false },
      );
    } else {
      (async () => {
        try {
          const r = await fetch("/api/geo/ip", { cache: "no-store" });
          const j = await r.json().catch(() => null);
          const city = j?.city || j?.locality || j?.name || "";
          const cc =
            j?.countryCode || j?.country?.code || j?.country_code || undefined;
          apply(city, cc);
        } catch {
          apply("");
        }
      })();
    }

    return () => {
      cancel = true;
      clearInterval(tick);
    };
  }, []);

  return { label, flag };
}

/* ╭─────────────────────────────────────────────────────────╮
   │ AI Quick Search – חיפוש חכם בכל האתר                   │
   ╰─────────────────────────────────────────────────────────╯ */
function AiQuickSearch() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v || busy) return;
    setBusy(true);
    const url = new URL("/ai", window.location.origin);
    url.searchParams.set("mode", "search");
    url.searchParams.set("q", v);
    window.location.href = url.toString();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="hidden lg:flex items-center ml-2 min-w-[260px] max-w-[340px]"
      dir="rtl"
    >
      <div className="flex w-full items-center rounded-full bg-gradient-to-r from-violet-500/70 via-emerald-500/70 to-sky-500/70 p-[1px] shadow-[0_8px_24px_rgba(15,23,42,0.25)]">
        <div className="flex w-full items-center gap-2 rounded-full bg-white/95 dark:bg-neutral-900/95 px-3 py-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/50 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-200">
            <span aria-hidden>✨</span>
            <span>AI</span>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש חכם בכל MATY…"
            className="flex-1 bg-transparent text-xs md:text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-transparent" />
            ) : (
              <span aria-hidden>🔍</span>
            )}
            <span>חפש</span>
          </button>
        </div>
      </div>
    </form>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ Header                                                  │
   ╰─────────────────────────────────────────────────────────╯ */
type PageArea =
  | "home"
  | "club"
  | "fit"
  | "jam"
  | "date"
  | "about"
  | "contact"
  | "book"
  | "admin";

type MeLite = {
  ok: boolean;
  loggedIn: boolean;
  userId?: string | null;
  isAdmin?: boolean;
  dateHasConsents?: boolean;
  dateHasProfile?: boolean;
};

const DATE_BASE = "/maty-date";
const DATE_AGREEMENTS = `${DATE_BASE}/agreements`;

export default function Header() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { data: session, status } = useSession();

  const displayName =
    (session?.user?.name as string) ||
    (session?.user?.email as string) ||
    "החשבון שלי";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [meLite, setMeLite] = useState<MeLite>({ ok: true, loggedIn: false });

  const [liveAvatar, setLiveAvatar] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const baseAvatar = (session?.user as any)?.image || null;
  const myAvatar = liveAvatar || customAvatar || baseAvatar || DEFAULT_AVATAR;

  useEffect(() => {
    let navBC: BroadcastChannel | null = null;
    let homeBC: BroadcastChannel | null = null;
    try {
      navBC = new BroadcastChannel(BC_NAV);
      navBC.onmessage = (ev) => {
        const data = ev?.data || {};
        if (
          data?.kind === "hover" &&
          data?.tag &&
          AVATAR_BY_TAG[data.tag as NavHoverTag]
        ) {
          setLiveAvatar(AVATAR_BY_TAG[data.tag as NavHoverTag]);
        }
        if (data?.kind === "hover-end") setLiveAvatar(null);
      };
    } catch {}
    try {
      homeBC = new BroadcastChannel(BC_AVATARS);
      homeBC.onmessage = (ev) => {
        const data = ev?.data || {};
        if (
          data?.kind === "hover" &&
          typeof data?.avatar === "string" &&
          data.avatar
        )
          setLiveAvatar(data.avatar);
        if (data?.kind === "hover-end") setLiveAvatar(null);
      };
    } catch {}
    return () => {
      try {
        navBC?.close();
      } catch {}
      try {
        homeBC?.close();
      } catch {}
    };
  }, []);

  const handleAvatarChange = React.useCallback(
    (data: any) => {
      const s = data?.strategy;
      if (s === "upload" && typeof data?.url === "string" && data.url) {
        setCustomAvatar(data.url);
        try {
          localStorage.setItem("mm:avatar:url", data.url);
        } catch {}
        return;
      }
      if (s === "gallery" && typeof data?.id === "string" && data.id) {
        const url = `/assets/images/${data.id}.png`;
        setCustomAvatar(url);
        try {
          localStorage.setItem("mm:avatar:url", url);
        } catch {}
        return;
      }
      if (s === "profile") {
        const v = (session?.user as any)?.image || null;
        setCustomAvatar(v);
        try {
          if (v) localStorage.setItem("mm:avatar:url", v);
          else localStorage.removeItem("mm:avatar:url");
        } catch {}
        return;
      }
      setCustomAvatar(null);
      try {
        localStorage.removeItem("mm:avatar:url");
      } catch {}
    },
    [session],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mm:avatar:url");
      setCustomAvatar(saved && saved !== "null" ? saved : null);
    } catch {}

    const onLocal = (ev: any) => handleAvatarChange(ev?.detail || {});
    window.addEventListener("mm:avatarChanged" as any, onLocal as any);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BC_AVATAR);
      bc.onmessage = (ev) => handleAvatarChange(ev?.data || {});
    } catch {}

    return () => {
      window.removeEventListener("mm:avatarChanged" as any, onLocal as any);
      try {
        bc?.close();
      } catch {}
    };
  }, [handleAvatarChange]);

  const emitHover = (tag: NavHoverTag | null) => {
    try {
      const bc = new BroadcastChannel(BC_NAV);
      bc.postMessage(tag ? { kind: "hover", tag } : { kind: "hover-end" });
      setTimeout(() => bc.close(), 0);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/status", {
          cache: "no-store",
          credentials: "include",
        });
        const j = await r.json().catch(() => null);
        const fromServer = !!j?.isAdmin;
        const fromLocal = getLocalAdmin();
        const fromSession = isAdminFromSession(session);
        if (!cancelled) setIsAdmin(fromServer || fromLocal || fromSession);
        if (fromServer || fromLocal) localStorage.setItem("mm:admin", "1");
      } catch {
        const fromLocal = getLocalAdmin();
        const fromSession = isAdminFromSession(session);
        if (!cancelled) setIsAdmin(fromLocal || fromSession);
      }
    })();
    (async () => {
      try {
        const r = await fetch("/api/auth/me-lite", { cache: "no-store" });
        const j = (await r.json().catch(() => null)) as MeLite | null;
        if (!cancelled && j && j.ok) setMeLite(j);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!mounted) return;
    const area: PageArea = pathname?.startsWith("/club")
      ? "club"
      : pathname?.startsWith("/fit")
        ? "fit"
        : pathname?.startsWith("/jam")
          ? "jam"
          : pathname?.startsWith("/date/matches") ||
              pathname?.startsWith("/date") ||
              pathname?.startsWith("/maty-date")
            ? "date"
            : pathname?.startsWith("/about")
              ? "about"
              : pathname?.startsWith("/contact")
                ? "contact"
                : pathname?.startsWith("/book")
                  ? "book"
                  : pathname?.startsWith("/admin")
                    ? "admin"
                    : "home";
    window.dispatchEvent(
      new CustomEvent("mm:track", { detail: { kind: "page", area } }),
    );
  }, [mounted, pathname]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [pagesOpen, setPagesOpen] = useState(false);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: KeyboardEvent) =>
      e.key === "Escape" && setPagesOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!pagesRef.current) return;
      if (!pagesRef.current.contains(e.target as Node)) setPagesOpen(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [aroundOpen, setAroundOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const starts = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const BTN_W = "min-w-[90px] lg:min-w-[108px] max-w-[180px]";
  const chip = `inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 ${BTN_W}
    text-sm font-medium whitespace-nowrap truncate
    border bg-white/85 dark:bg-neutral-900/75
    border-amber-400/45 dark:border-amber-300/30
    hover:bg-white dark:hover:bg-neutral-800/80
    shadow-[inset_0_0_0_1px_rgba(245,158,11,.18)]
    relative overflow-visible mm-glow-soft mm-rattle`;
  const primary = `inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 ${BTN_W}
    text-sm font-extrabold whitespace-nowrap truncate bg-brand text-white border-0
    shadow-lg shadow-brand/30 hover:opacity-95 mm-glow-brand`;

  const clubChip = [chip, "mm-chip mm-chip-club"].join(" ");
  const jamChip = [chip, "mm-chip mm-chip-jam"].join(" ");
  const fitChip = [
    chip,
    "mm-chip mm-chip-fit text-emerald-600 dark:text-emerald-400",
  ].join(" ");
  const datePrimary = `inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 ${BTN_W}
    text-sm font-extrabold whitespace-nowrap truncate text-white border-0 relative overflow-visible
    bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 ring-1 ring-rose-300/50 shadow-[0_8px_22px_rgba(244,114,182,.28)]
    mm-glow-date mm-chip mm-chip-date mm-rattle`;

  const smartDateHref = useMemo(() => {
    const meIsAdmin = isAdmin || meLite.isAdmin === true;

    if (!meLite.loggedIn) {
      return DATE_AGREEMENTS;
    }

    if (meIsAdmin) {
      return `${DATE_BASE}/matches`;
    }

    if (meLite.dateHasConsents === false) {
      return DATE_AGREEMENTS;
    }
    if (meLite.dateHasConsents === true) {
      return `${DATE_BASE}/matches`;
    }

    return `${DATE_BASE}/matches`;
  }, [isAdmin, meLite.loggedIn, meLite.isAdmin, meLite.dateHasConsents]);

  const { label: placeTime, flag: countryFlag } = useLocalPlaceAndTime();
  const flagToShow = countryFlag;

  const isLoggedIn = status === "authenticated" && !!session;

  return (
    <header
      role="banner"
      className={[
        "sticky top-0 z-[100] isolation-isolate",
        "border-b border-slate-200/60 dark:border-white/10",
        "bg-white dark:bg-neutral-950",
        scrolled ? "shadow-sm" : "",
        "overflow-visible",
      ].join(" ")}
      dir="rtl"
    >
      {/* עוזר צף – רק בדסקטופ */}
      <div className="hidden md:block">
        <AssistantFloatingAvatar onOpen={() => setAssistantOpen(true)} />
      </div>

      {/* שורה #1: פס סטטוס עליון */}
      <div className="bg-amber-50/70 dark:bg-amber-900/15 border-b border-amber-400/30 dark:border-amber-300/20">
        <div className="mx-auto max-w-6xl px-4 py-1 text-[12px] flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={myAvatar}
              alt="avatar"
              className="h-6 w-6 rounded-full object-cover border border-black/10 dark:border-white/10"
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR)
              }
            />
            <div className="opacity-80 truncate flex items-center gap-1">
              {flagToShow && (
                <span aria-hidden className="text-[14px] leading-none">
                  {flagToShow}
                </span>
              )}
              <span>
                {placeTime ||
                  (mounted && resolvedTheme === "dark"
                    ? "מצב כהה"
                    : "מצב בהיר")}
              </span>
            </div>
          </div>

          <PresenceBadge onOpen={() => setAroundOpen(true)} />

          <MessagesBadge
            enabled={meLite.loggedIn}
            onClick={() => {
              window.location.href = "/messages";
            }}
          />

          {isAdmin && (
            <>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/70 dark:bg-amber-300/30 border border-amber-500/30">
                ⭐ אדמין פעיל
              </span>
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="inline-flex h-8 items-center gap-2 rounded-full px-3 border border-amber-500/40 dark:border-amber-300/40 bg-white/90 dark:bg-neutral-900/85 hover:bg-white dark:hover:bg-neutral-800 text-[12px] font-bold mm-glow-amber ml-auto"
                title="פתח פאנל אדמין"
              >
                🛠 פאנל ניהול
              </button>
            </>
          )}
        </div>
      </div>

      {/* שורה #2: לוגו + ניווט ראשי */}
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-6 py-2">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          {/* לוגו */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="MATY MUSIC – דף הבית"
          >
            <picture>
              <source
                srcSet="/assets/logo/maty-music-wordmark.svg"
                type="image/svg+xml"
              />
              <img
                src="/assets/logo/maty-music-wordmark.svg"
                alt="MATY MUSIC"
                width={176}
                height={36}
                className="h-8 w-auto"
                onError={(e) => {
                  const el = e.currentTarget;
                  const wrap = document.createElement("span");
                  wrap.innerHTML = `
                    <svg viewBox="0 0 320 40" xmlns="http://www.w3.org/2000/svg" aria-label="MATY MUSIC">
                      <defs><linearGradient id="mmGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d4aff"/><stop offset="1" stop-color="#b794f4"/></linearGradient></defs>
                      <rect x="0" y="6" width="320" height="28" rx="6" fill="url(#mmGrad)" opacity=".12"/>
                      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                        font-family="system-ui,-apple-system,Segoe UI,Roboto,Heebo,Arial" font-weight="800" font-size="18" fill="url(#mmGrad)">
                        MATY MUSIC
                      </text>
                    </svg>`;
                  el.replaceWith(wrap);
                }}
              />
            </picture>
          </Link>

          {/* ניווט דסקטופ */}
          <nav
            aria-label="ניווט ראשי"
            className="hidden md:flex flex-wrap items-center content-start justify-end gap-2 min-h-[52px]"
          >
            <Link
              href="/club"
              className={[
                clubChip,
                starts("/club") ? "ring-1 ring-yellow-400/60" : "",
              ].join(" ")}
              title="MATY-CLUB"
              onMouseEnter={() => emitHover("club")}
              onMouseLeave={() => emitHover(null)}
            >
              <span className="relative z-[1] bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent font-extrabold">
                MATY-CLUB
              </span>
              <span aria-hidden className="mm-bubbles mm-bubbles-gold" />
            </Link>

            <Link
              href="/jam"
              className={[
                jamChip,
                starts("/jam") ? "ring-1 ring-violet-400/60" : "",
              ].join(" ")}
              title="MATY-JAM"
              onMouseEnter={() => emitHover("jam")}
              onMouseLeave={() => emitHover(null)}
            >
              <span className="relative z-[1] bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent font-extrabold">
                MATY-JAM
              </span>
              <span aria-hidden className="mm-bubbles mm-bubbles-violet" />
              <span aria-hidden className="mm-center-icon">
                🎸
              </span>
            </Link>

            <Link
              href="/fit"
              className={[
                fitChip,
                starts("/fit") ? "ring-1 ring-emerald-400/60" : "",
              ].join(" ")}
              title="MATY-FIT"
              onMouseEnter={() => emitHover("fit")}
              onMouseLeave={() => emitHover(null)}
            >
              <span className="relative z-[1] bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent font-extrabold">
                MATY-FIT
              </span>
              <span aria-hidden className="mm-bubbles mm-bubbles-green" />
              <span aria-hidden className="mm-center-icon">
                <svg viewBox="0 0 64 24" className="h-4 w-7">
                  <rect
                    x="0"
                    y="6"
                    width="10"
                    height="12"
                    rx="2"
                    fill="currentColor"
                  />
                  <rect
                    x="54"
                    y="6"
                    width="10"
                    height="12"
                    rx="2"
                    fill="currentColor"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="44"
                    height="4"
                    rx="2"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </Link>

            {/* דפים נוספים */}
            <div className="relative" ref={pagesRef}>
              <button
                type="button"
                onClick={() => setPagesOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={pagesOpen}
                className={[
                  chip,
                  pagesOpen ? "ring-1 ring-amber-400/60" : "",
                ].join(" ")}
                title="דפים נוספים"
              >
                <span className="relative z-[1]">דפים</span>
                <span aria-hidden className="ml-1">
                  ▾
                </span>
                <span aria-hidden className="mm-bubbles mm-bubbles-amber" />
              </button>
              {pagesOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-[min(92vw,560px)] rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 shadow-2xl p-3 z-[160] text-right mm-glow-card"
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <MenuLink icon="📅" anim="mm-pop-mini" href="/events">
                      אירועים
                    </MenuLink>
                    <MenuLink icon="🖼" anim="mm-pop-mini" href="/gallery">
                      גלריה
                    </MenuLink>
                    <MenuLink icon="💳" anim="mm-pop-mini" href="/pricing">
                      מחירון
                    </MenuLink>
                    <MenuLink icon="🎬" anim="mm-pop-mini" href="/shorts">
                      Shorts
                    </MenuLink>
                    <MenuLink icon="ℹ️" anim="mm-pop-mini" href="/about">
                      אודות
                    </MenuLink>
                    <MenuLink icon="✉️" anim="mm-pop-mini" href="/contact">
                      צור קשר
                    </MenuLink>
                    <MenuLink icon="📨" anim="mm-pop-mini" href="/messages">
                      ההודעות שלי
                    </MenuLink>
                    {isAdmin && (
                      <MenuLink icon="🛠" anim="mm-pop-mini" href="/admin">
                        אדמין
                      </MenuLink>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* חיפוש AI אונליין בכל האתר – מעוצב */}
            <AiQuickSearch />

            {/* CTA MATY-DATE – שידוכים */}
            <Link
              href={smartDateHref}
              className={datePrimary}
              title="שידוכים חכמים לקהילות יהודיות"
              onMouseEnter={() => emitHover("date")}
              onMouseLeave={() => emitHover(null)}
            >
              <span className="relative z-[2] bg-clip-text text-transparent bg-gradient-to-r from-rose-50 via-white to-rose-50">
                MATY-DATE
              </span>
              <span aria-hidden className="mm-bubbles mm-bubbles-rose" />
              <span aria-hidden className="mm-center-icon">
                ❤
              </span>
            </Link>

            {/* CTA הופעה */}
            <Link href="/book" className={primary} aria-label="הזמן הופעה">
              הזמן הופעה
            </Link>

            {/* Theme + Lang */}
            <button
              className={chip}
              onClick={() =>
                setTheme(
                  (resolvedTheme ?? "system") === "dark" ? "light" : "dark",
                )
              }
              type="button"
              title="החלף מצב תצוגה"
            >
              {!mounted
                ? "מצב תצוגה"
                : resolvedTheme === "dark"
                  ? "☀️ בהיר"
                  : "🌙 כהה"}
              <span aria-hidden className="mm-bubbles mm-bubbles-slate" />
            </button>
            <LanguageToggleInline />

            {/* Admin + User + Auth */}
            {isAdmin && (
              <button
                onClick={() => setAdminOpen(true)}
                className={[chip, "ring-1 ring-amber-400/60"].join(" ")}
                title="פאנל ניהול"
              >
                🛠 אדמין
              </button>
            )}

            {mounted && isLoggedIn && session ? (
              <>
                <AdminBypassButton />
                <UserMenu
                  name={displayName}
                  image={myAvatar}
                  onSignOut={() => signOut({ callbackUrl: "/" })}
                />
              </>
            ) : (
              <>
                <AdminBypassButton />
                <Link href="/auth?mode=login" className={chip}>
                  כניסה
                </Link>
                <Link href="/auth?mode=register" className={chip}>
                  הרשמה
                </Link>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 ${BTN_W} text-sm font-semibold bg-emerald-600 text-white hover:opacity-95 shadow-sm whitespace-nowrap mm-glow-green`}
                  title="התחברות עם Google"
                  type="button"
                >
                  Google
                </button>
              </>
            )}
          </nav>

          {/* מובייל: תפריט צד */}
          <div className="md:hidden flex items-center justify-end gap-2">
            {isAdmin && (
              <button
                onClick={() => setAdminOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 border border-amber-500/40 dark:border-amber-300/40 bg-white/90 dark:bg-neutral-900/85 hover:bg-white dark:hover:bg-neutral-800 text-[12px] font-bold mm-glow-amber"
                title="פאנל ניהול"
              >
                🛠 אדמין
              </button>
            )}
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 shadow-sm mm-glow-soft"
              onClick={() => setDrawerOpen(true)}
              aria-label="פתח תפריט"
              type="button"
              title="תפריט"
            >
              <span className="relative inline-flex items-center justify-center h-7 w-7 rounded-full border border-amber-300/40">
                <span aria-hidden className="mm-burger-icon">
                  ☰
                </span>
              </span>
              <span className="text-sm font-semibold">תפריט</span>
            </button>
          </div>
        </div>
      </div>

      {/* פורטלים */}
      {drawerOpen && (
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          isAdmin={isAdmin}
          user={{
            name: (session?.user?.name as string) ?? null,
            email: (session?.user?.email as string) ?? null,
            image: myAvatar,
            loggedIn: isLoggedIn,
          }}
          dateHref={smartDateHref}
          onThemeToggle={() =>
            setTheme((resolvedTheme ?? "system") === "dark" ? "light" : "dark")
          }
          onAssistant={() => setAssistantOpen(true)}
          onSignOut={() => signOut({ callbackUrl: "/" })}
          onGoogleSignIn={() => signIn("google", { callbackUrl: "/" })}
        />
      )}
      {assistantOpen && (
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
        />
      )}
      <AroundMePanel open={aroundOpen} onClose={() => setAroundOpen(false)} />
      <AdminPanelDrawer open={adminOpen} onClose={() => setAdminOpen(false)} />

      {/* ── Glow + Animations ── */}
      <style jsx global>{`
        .mm-glow-soft {
          box-shadow:
            0 0 0 0 rgba(0, 0, 0, 0),
            0 8px 24px rgba(0, 0, 0, 0.06);
        }
        .mm-glow-green {
          box-shadow:
            0 0 0 2px rgba(16, 185, 129, 0.18),
            0 10px 24px rgba(16, 185, 129, 0.18);
        }
        .mm-glow-amber {
          box-shadow:
            0 0 0 2px rgba(245, 158, 11, 0.18),
            0 10px 24px rgba(245, 158, 11, 0.18);
        }
        .mm-glow-brand {
          box-shadow:
            0 0 0 2px rgba(109, 74, 255, 0.18),
            0 10px 28px rgba(109, 74, 255, 0.26);
        }
        .mm-glow-date {
          box-shadow:
            0 0 0 2px rgba(244, 114, 182, 0.22),
            0 10px 30px rgba(244, 114, 182, 0.3);
        }
        .mm-glow-card {
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
        }

        .mm-rattle:hover {
          animation: mmRattle 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          transform: translateZ(0);
        }
        @keyframes mmRattle {
          10%,
          90% {
            transform: translate3d(-1px, 0, 0) rotate(-0.2deg);
          }
          20%,
          80% {
            transform: translate3d(2px, 0, 0) rotate(0.2deg);
          }
          30%,
          50%,
          70% {
            transform: translate3d(-4px, 0, 0) rotate(-0.4deg);
          }
          40%,
          60% {
            transform: translate3d(4px, 0, 0) rotate(0.4deg);
          }
        }

        .mm-chip {
          position: relative;
          overflow: visible;
        }

        .mm-bubbles {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -4px;
          height: 0;
          pointer-events: none;
        }
        .mm-bubbles::before,
        .mm-bubbles::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          opacity: 0;
          animation: mmBubble 2.4s ease-in-out infinite;
        }
        .mm-bubbles::after {
          animation-delay: 0.8s;
        }

        .mm-bubbles-gold::before,
        .mm-bubbles-gold::after {
          background: #fbbf24;
          box-shadow: 0 0 10px #fbbf24aa;
        }
        .mm-bubbles-violet::before,
        .mm-bubbles-violet::after {
          background: #8b5cf6;
          box-shadow: 0 0 10px #8b5cf6aa;
        }
        .mm-bubbles-green::before,
        .mm-bubbles-green::after {
          background: #10b981;
          box-shadow: 0 0 10px #10b981aa;
        }
        .mm-bubbles-rose::before,
        .mm-bubbles-rose::after {
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444aa;
        }
        .mm-bubbles-amber::before,
        .mm-bubbles-amber::after {
          background: #f59e0b;
          box-shadow: 0 0 10px #f59e0baa;
        }
        .mm-bubbles-slate::before,
        .mm-bubbles-slate::after {
          background: #64748b;
          box-shadow: 0 0 10px #64748baa;
        }

        @keyframes mmBubble {
          0% {
            opacity: 0;
            transform: translate(-50%, 4px) scale(0.6);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          60% {
            opacity: 0.9;
            transform: translate(-50%, -10px) scale(1.05);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -18px) scale(0.9);
          }
        }

        .mm-center-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 26px;
          font-size: 14px;
          pointer-events: none;
          opacity: 0.9;
        }

        .mm-burger-icon {
          display: inline-block;
          font-size: 14px;
          transform-origin: center;
          transition: transform 0.18s ease-out;
        }
        button:hover .mm-burger-icon {
          transform: translateY(-1px) scale(1.03);
        }

        .mm-pop-mini {
          transition:
            transform 0.16s ease-out,
            background-color 0.16s ease-out,
            box-shadow 0.16s ease-out,
            border-color 0.16s ease-out;
        }
        .mm-pop-mini:hover {
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.18);
        }
      `}</style>
    </header>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ MenuLink – כפתור בתפריט "דפים"                        │
   ╰─────────────────────────────────────────────────────────╯ */
type MenuLinkProps = {
  href: string;
  icon?: string;
  anim?: string;
  children: React.ReactNode;
};

function MenuLink({ href, icon, anim, children }: MenuLinkProps) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm",
        "border border-transparent hover:border-amber-300/60",
        "bg-white/90 dark:bg-neutral-900/90 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80",
        "cursor-pointer",
        anim || "",
        active
          ? "ring-1 ring-amber-400/70 bg-amber-50/80 dark:bg-amber-900/40"
          : "",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        {icon && <span aria-hidden>{icon}</span>}
        <span className="font-medium truncate">{children}</span>
      </span>
      {active && (
        <span
          aria-hidden
          className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.35)]"
        />
      )}
    </Link>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ UserMenu – תפריט חשבון משתמש בדסקטופ                   │
   ╰─────────────────────────────────────────────────────────╯ */
type UserMenuProps = {
  name: string;
  image: string;
  onSignOut: () => void;
};

function UserMenu({ name, image, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full px-3 border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 shadow-sm mm-glow-soft max-w-[220px]"
        aria-haspopup="menu"
        aria-expanded={open}
        title={name}
      >
        <img
          src={image}
          alt=""
          className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/10"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR)
          }
        />
        <span className="text-xs md:text-sm font-semibold truncate">
          {name}
        </span>
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 mt-2 w-56 z-[500] rounded-2xl border border-black/20 dark:border-white/20 bg-white dark:bg-neutral-900 shadow-[0_8px_25px_rgba(0,0,0,0.35)] p-2"
        >
          <Link
            href="/profile"
            // href="/me"
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
          >
            <span>הפרופיל שלי</span>
            <span aria-hidden>👤</span>
          </Link>
          <Link
            href="/messages"
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
          >
            <span>ההודעות שלי</span>
            <span aria-hidden>✉️</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
          >
            <span>הגדרות</span>
            <span aria-hidden>⚙️</span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
          >
            <span>התנתק</span>
            <span aria-hidden>🚪</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ╭─────────────────────────────────────────────────────────╮
   │ MobileDrawer – ניווט מלא במובייל                        │
   ╰─────────────────────────────────────────────────────────╯ */
type MobileDrawerUser = {
  name: string | null;
  email: string | null;
  image: string | null;
  loggedIn: boolean;
};

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  user: MobileDrawerUser;
  dateHref: string;
  onThemeToggle: () => void;
  onAssistant: () => void;
  onSignOut: () => void;
  onGoogleSignIn: () => void;
};

function MobileDrawer({
  open,
  onClose,
  isAdmin,
  user,
  dateHref,
  onThemeToggle,
  onAssistant,
  onSignOut,
  onGoogleSignIn,
}: MobileDrawerProps) {
  useScrollLock(open);

  if (!open) return null;

  const displayName = user.name || user.email || "אורח MATY";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[220] md:hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div
        dir="rtl"
        className="absolute inset-y-0 right-0 w-[min(92vw,420px)] bg-white dark:bg-neutral-900 border-l border-black/20 dark:border-white/20 shadow-[0_5px_40px_rgba(0,0,0,0.45)] flex flex-col z-[500]"
      >
        {/* כותרת + משתמש */}
        <div className="px-4 pt-3 pb-2 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.image || DEFAULT_AVATAR}
              alt=""
              className="h-9 w-9 rounded-full object-cover border border-black/10 dark:border-white/10"
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR)
              }
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {displayName}
              </div>
              <div className="text-[11px] opacity-70 truncate">
                {user.loggedIn ? "מחובר" : "אורח – התחבר ליהנות יותר"}
              </div>
            </div>
          </div>
          <button className="mm-btn text-sm" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ניווט ראשי */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="grid gap-2">
            <Link
              href="/club"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-amber-50/70 dark:bg-amber-900/20 border border-amber-300/60"
            >
              <span className="font-semibold">MATY-CLUB</span>
              <span aria-hidden>🎧</span>
            </Link>
            <Link
              href="/jam"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-violet-50/70 dark:bg-violet-900/25 border border-violet-300/60"
            >
              <span className="font-semibold">MATY-JAM</span>
              <span aria-hidden>🎸</span>
            </Link>
            <Link
              href="/fit"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-300/60"
            >
              <span className="font-semibold">MATY-FIT</span>
              <span aria-hidden>💪</span>
            </Link>
            <Link
              href={dateHref}
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white border border-rose-300/60"
            >
              <span className="font-semibold">MATY-DATE – שידוכים</span>
              <span aria-hidden>❤</span>
            </Link>
            <Link
              href="/book"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-brand text-white border border-brand/80"
            >
              <span className="font-semibold">הזמן הופעה</span>
              <span aria-hidden>🎤</span>
            </Link>
          </div>

          {/* דפים נוספים */}
          <div className="mt-2 border-t border-black/5 dark:border-white/10 pt-3">
            <div className="text-xs font-semibold mb-2 opacity-70">
              דפים נוספים
            </div>
            <div className="grid gap-1.5 text-sm">
              <Link
                href="/events"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>אירועים</span>
                <span aria-hidden>📅</span>
              </Link>
              <Link
                href="/gallery"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>גלריה</span>
                <span aria-hidden>🖼</span>
              </Link>
              <Link
                href="/pricing"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>מחירון</span>
                <span aria-hidden>💳</span>
              </Link>
              <Link
                href="/shorts"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>Shorts</span>
                <span aria-hidden>🎬</span>
              </Link>
              <Link
                href="/messages"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>ההודעות שלי</span>
                <span aria-hidden>✉️</span>
              </Link>
              <Link
                href="/about"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>אודות</span>
                <span aria-hidden>ℹ️</span>
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80"
              >
                <span>צור קשר</span>
                <span aria-hidden>✉️</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3 py-1.5 hover:bg-amber-50/70 dark:hover:bg-neutral-800/80 text-amber-700 dark:text-amber-300"
                >
                  <span>אדמין</span>
                  <span aria-hidden>🛠</span>
                </Link>
              )}
            </div>
          </div>

          {/* כלים מהירים */}
          <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                onAssistant();
                onClose();
              }}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-sky-50/80 dark:bg-sky-900/25 border border-sky-300/60"
            >
              <span>שאל את העוזר החכם</span>
              <span aria-hidden>✨</span>
            </button>
            <button
              type="button"
              onClick={onThemeToggle}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95"
            >
              <span>החלף מצב תצוגה</span>
              <span aria-hidden>☀️ / 🌙</span>
            </button>
          </div>

          {/* התחברות / התנתקות */}
          <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-3 space-y-2">
            {user.loggedIn ? (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50"
              >
                התנתק
              </button>
            ) : (
              <>
                <Link
                  href="/auth?mode=login"
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95"
                >
                  כניסה
                </Link>
                <Link
                  href="/auth?mode=register"
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-200"
                >
                  הרשמה
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onGoogleSignIn();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  התחברות עם Google
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
