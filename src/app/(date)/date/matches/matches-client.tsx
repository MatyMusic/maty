// src/app/(date)/date/matches/matches-client.tsx
"use client";

import ExplainMatchModal from "@/components/maty-date/ExplainMatchModal";
import MatchCard, {
  type MatchItem,
  type SubStatus,
  type Tier,
} from "@/components/maty-date/MatchCard";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** =========================================================
 *  טיפוסי אלגוריתם V2 (matchMeta) – אופציונלי, לא חובה מהשרת
 * ========================================================= */
type MatchMeta = {
  finalScore?: number; // ציון סופי 0–100
  profileScore?: number; // פרופיל: גיל/דתיות/שפה/מיקום
  musicScore?: number; // מוזיקה: ז'אנרים/אמנים
  distanceScore?: number; // מרחק: 0–100 (כמה נוח)
};

/** =========================================================
 *  ENTITLEMENTS (client-safe) + helpers
 * ========================================================= */
type MyTier = Tier; // אותו דבר כמו מה שמגיע מהשרת
type MyStatus = "active" | "inactive";

const canUse = (
  feature: "chat" | "video" | "superlike" | "wink",
  tier: MyTier,
  status: MyStatus,
) => {
  if (status !== "active") return false;

  const paid = tier === "pro" || tier === "vip";

  if (feature === "wink") return true;
  if (feature === "superlike") return paid;
  if (feature === "chat" || feature === "video") return paid;

  return false;
};

async function jsonSafe(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

const debounce = <T extends (...a: any[]) => void>(fn: T, ms: number) => {
  let id: any;
  return (...a: Parameters<T>) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...a), ms);
  };
};

const paramsToUrl = (p: URLSearchParams) => {
  const u = new URL(window.location.href);
  [...u.searchParams.keys()].forEach((k) => u.searchParams.delete(k));
  p.forEach((v, k) => {
    if (v !== "") u.searchParams.set(k, v);
  });
  history.replaceState(null, "", u.toString());
};

const DIR_LABEL = {
  orthodox: "אורתודוקסי",
  haredi: "חרדי",
  chasidic: "חסידי",
  modern: "אורתודוקסי מודרני",
  conservative: "קונסרבטיבי",
  reform: "רפורמי",
  reconstructionist: "רקונסטרוקטיבי",
  secular: "חילוני/תרבותי",
} as const;

type Direction = keyof typeof DIR_LABEL;
type Goal = "serious" | "marriage" | "friendship" | "";

/** מיקרו־קומפוננטות */
const Chip: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="px-2 py-1 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/80 text-[11px]">
    {children}
  </span>
);

const Title: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="text-center">
    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
      {title}
    </h1>
    {subtitle && <p className="mt-1 opacity-80">{subtitle}</p>}
  </div>
);

const ShadchanCTA: React.FC = () => (
  <a
    href="/matchmakers/miriam-portnoy"
    className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-900/85 px-4 py-3 grid grid-cols-[auto,1fr,auto] gap-3 items-center shadow-card hover:shadow-[0_10px_30px_rgba(0,0,0,.12)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,.45)] transition blink-soft"
  >
    <div
      aria-hidden
      className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition blur-2xl"
      style={{
        background:
          "conic-gradient(from 0deg, rgba(236,72,153,.28), rgba(99,102,241,.35), rgba(236,72,153,.28))",
      }}
    />
    <div className="avatar-ring h-10 w-10 grid place-items-center bg-gradient-to-br from-pink-200 to-violet-200 dark:from-pink-900/30 dark:to-violet-900/30 text-lg">
      💌
    </div>
    <div className="text-right">
      <div className="text-sm font-extrabold leading-tight">
        שדכנית · מרים פורטנוי
      </div>
      <div className="text-xs opacity-80 leading-tight clamp-1">
        ליווי אישי ושידוכים חכמים
      </div>
    </div>
    <div className="inline-flex items-center gap-1 text-xs font-semibold rounded-full h-8 px-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 neon-pulse">
      כניסה לכרטיסייה →
    </div>
  </a>
);

/** =========================================================
 *  Explain AI – state
 * ========================================================= */
type ExplainState = {
  open: boolean;
  loading: boolean;
  error: string | null;
  summary: string | null;
  bullets: string[] | null;
  targetName: string | null;
  score: number | null;
};

/** =========================================================
 *  העמוד הראשי – MATCHES CLIENT
 * ========================================================= */
export default function MatchesClient() {
  const router = useRouter();

  /** ===== מצב מנוי (entitlement) ===== */
  const [myTier, setMyTier] = useState<MyTier>("free");
  const [myStatus, setMyStatus] = useState<MyStatus>("inactive");
  const [meProfile, setMeProfile] = useState<any | null>(null); // פרופיל שלי ל-AI (אם יגיע מהשרת)

  /** ===== DATA STATE ===== */
  const [items, setItems] = useState<MatchItem[]>([]);
  const [matchMetaMap, setMatchMetaMap] = useState<Record<string, MatchMeta>>(
    {},
  ); // userId -> meta
  const [nextCursor, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** ===== VIEW & SORT ===== */
  const [view, setView] = useState<"grid" | "stack">("grid");
  type Sort = "" | "score" | "recency";
  const [sort, setSort] = useState<Sort>("");

  /** ===== FILTERS ===== */
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [direction, setDirection] = useState<Direction | "">("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [lookingFor, setLookingFor] = useState<Goal>("");
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(40);
  const [subStatus, setSubStatus] = useState<"" | SubStatus>("");
  const [tier, setTier] = useState<"" | Tier>("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  /** ===== PRESETS / MODALS / TOAST ===== */
  type Preset = { id: string; name: string; payload: any; createdAt: number };
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [upsell, setUpsell] = useState<null | {
    feature: "chat" | "video";
    to?: string;
  }>(null);
  const [reportUser, setReportUser] = useState<string | null>(null);
  const [blockUser, setBlockUser] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** ===== ExplainMatch Modal ===== */
  const [explain, setExplain] = useState<ExplainState>({
    open: false,
    loading: false,
    error: null,
    summary: null,
    bullets: null,
    targetName: null,
    score: null,
  });

  /** ===== MISC ===== */
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [focusIdx, setFocusIdx] = useState(-1);

  /** ===== CSS קטן לאפקטים ===== */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .blink-soft { animation: blinkSoft 2.1s ease-in-out infinite }
      @keyframes blinkSoft { 0%,100%{ filter:none } 50%{ filter:brightness(1.06) saturate(1.06) } }
      .neon-pulse { position:relative }
      .neon-pulse::after {
        content:"";
        position:absolute;
        inset:-2px;
        border-radius:999px;
        box-shadow:0 0 0 0 rgba(236,72,153,.55);
        animation: neonPulse 1.8s ease-out infinite;
      }
      @keyframes neonPulse {
        0%{ box-shadow:0 0 0 0 rgba(236,72,153,.45); }
        70%{ box-shadow:0 0 0 14px rgba(236,72,153,0); }
        100%{ box-shadow:0 0 0 0 rgba(236,72,153,0); }
      }
      .mm-range { accent-color: #ec4899; }
      .mm-btn:active { filter: brightness(0.96); }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  /** ===== HELPERS ===== */
  const clampAges = useCallback((mi: number, ma: number) => {
    const lo = Math.max(18, Math.min(mi, 99));
    const hi = Math.max(lo, Math.min(ma, 99));
    return [lo, hi] as const;
  }, []);

  const resetFilters = () => {
    setCity("");
    setCountry("");
    setDirection("");
    setGender("");
    setLookingFor("");
    setMinAge(20);
    setMaxAge(40);
    setSubStatus("");
    setTier("");
    setOnlineOnly(false);
    setHasPhoto(false);
    setSort("");
  };

  const payload = () => ({
    city,
    country,
    direction,
    gender,
    lookingFor,
    minAge,
    maxAge,
    subStatus,
    tier,
    onlineOnly,
    hasPhoto,
    sort,
    view,
  });

  const applyPayload = (p: any) => {
    setCity(p.city || "");
    setCountry(p.country || "");
    setDirection((p.direction || "") as any);
    setGender((p.gender || "") as any);
    setLookingFor((p.lookingFor || "") as Goal);
    const [lo, hi] = clampAges(Number(p.minAge || 20), Number(p.maxAge || 40));
    setMinAge(lo);
    setMaxAge(hi);
    setSubStatus((p.subStatus || "") as SubStatus | "");
    setTier((p.tier || "") as Tier | "");
    setOnlineOnly(!!p.onlineOnly);
    setHasPhoto(!!p.hasPhoto);
    setSort((p.sort || "") as any);
    setView(p.view === "stack" ? "stack" : "grid");
  };

  /** ===== PRESETS LOCALSTORAGE ===== */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("matydate:presets");
      if (raw) setPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const savePresets = (d: Preset[]) => {
    setPresets(d);
    try {
      localStorage.setItem("matydate:presets", JSON.stringify(d));
    } catch {}
  };

  const savePreset = () => {
    const name = (presetName || "").trim();
    if (!name) {
      setToast("תן שם לפריסט 🙂");
      return;
    }
    const id = crypto.randomUUID();
    const next = [
      { id, name, payload: payload(), createdAt: Date.now() },
      ...presets,
    ].slice(0, 30);
    savePresets(next);
    setPresetName("");
    setToast("הפריסט נשמר!");
  };

  const loadPreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    applyPayload(p.payload);
    setNext(null);
    debouncedLoad(true);
  };

  const deletePreset = (id: string) =>
    savePresets(presets.filter((x) => x.id !== id));

  /** ===== FILTERS LOCAL + URL ===== */
  const saveFiltersLocal = () => {
    try {
      localStorage.setItem("matydate:filters", JSON.stringify(payload()));
    } catch {}
  };

  const loadFiltersLocal = () => {
    try {
      const raw = localStorage.getItem("matydate:filters");
      if (raw) applyPayload(JSON.parse(raw));
    } catch {}
  };

  const syncUrl = () => {
    const p = new URLSearchParams();
    const o = payload();
    Object.entries(o).forEach(([k, v]) => {
      if (typeof v === "boolean") {
        if (v) p.set(k, "1");
      } else if (
        v !== "" &&
        !(k === "minAge" && v === 20) &&
        !(k === "maxAge" && v === 40)
      ) {
        p.set(k, String(v));
      }
    });
    paramsToUrl(p);
  };

  /** ===== ENTITLEMENTS מהשרת ===== */
  async function loadMe() {
    try {
      const r = await fetch("/api/date/me", { cache: "no-store" });
      const j = await jsonSafe(r);
      if (j?.ok) {
        setMyTier(j.tier || "free");
        setMyStatus(j.status || "inactive");
        // ננסה לשמור פרופיל עשיר יותר ל-AI (אם ה-API מחזיר)
        setMeProfile(j.profile || j.me || j.user || null);
      }
    } catch {}
  }

  /** ===== FETCH MATCHES ===== */
  const doLoad = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        const p = new URLSearchParams();
        p.set("limit", "18");
        if (!reset && nextCursor) p.set("cursor", nextCursor);
        if (city) p.set("city", city);
        if (country) p.set("country", country);
        if (direction) p.set("direction", direction);
        if (gender) p.set("gender", gender);
        if (lookingFor) p.set("looking_for", lookingFor);
        p.set("minAge", String(minAge));
        p.set("maxAge", String(maxAge));
        if (subStatus) p.set("sub_status", subStatus);
        if (tier) p.set("tier", tier);
        if (onlineOnly) p.set("online", "1");
        if (hasPhoto) p.set("hasPhoto", "1");
        if (sort === "score") p.set("sort", "score");

        const r = await fetch(`/api/date/matches?${p.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        });

        if (r.status === 401) {
          window.location.href = "/auth?mode=login";
          return;
        }

        const j = await jsonSafe(r);
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);

        const rawItems: any[] = j.items || [];
        const newMeta: Record<string, MatchMeta> = {};
        const baseItems: MatchItem[] = [];

        for (const raw of rawItems) {
          if (!raw) continue;
          const { matchMeta, meta, match_meta, ...rest } = raw;
          const item = rest as MatchItem;
          if (!item.userId) continue;

          const m: MatchMeta | undefined =
            (matchMeta as MatchMeta) ||
            (meta as MatchMeta) ||
            (match_meta as MatchMeta);

          if (m) newMeta[item.userId] = m;
          baseItems.push(item);
        }

        const fetched: MatchItem[] = baseItems;
        const adjusted =
          sort === "recency"
            ? [...fetched].sort(
                (a, b) =>
                  new Date(String(b.updatedAt || 0)).getTime() -
                  new Date(String(a.updatedAt || 0)).getTime(),
              )
            : fetched;

        setItems((prev) => (reset ? adjusted : [...prev, ...adjusted]));
        setMatchMetaMap((prev) => (reset ? newMeta : { ...prev, ...newMeta }));
        setNext(j.nextCursor || null);
        saveFiltersLocal();
        syncUrl();
        setFirst(true);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          setError(e?.message || "שגיאה בטעינת התאמות");
        }
        setFirst(true);
      } finally {
        setLoading(false);
      }
    },
    [
      city,
      country,
      direction,
      gender,
      lookingFor,
      minAge,
      maxAge,
      subStatus,
      tier,
      onlineOnly,
      hasPhoto,
      sort,
      nextCursor,
    ],
  );

  const debouncedLoad = useMemo(
    () => debounce((reset: boolean) => doLoad(reset), 250),
    [doLoad],
  );

  const applyAndReload = (reset = true) => {
    setNext(null);
    debouncedLoad(reset);
  };

  /** ===== INFINITE SCROLL ===== */
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const ob = new IntersectionObserver(
      (es) => {
        const e = es[0];
        if (e?.isIntersecting && !loading && nextCursor) doLoad(false);
      },
      { rootMargin: "600px 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [doLoad, loading, nextCursor]);

  /** ===== FIRST LOAD ===== */
  useEffect(() => {
    loadFiltersLocal();
    loadMe();

    try {
      const u = new URL(window.location.href);
      const q = u.searchParams;
      if (q && [...q.keys()].length > 0) {
        const p: any = {};
        q.forEach((v, k) => {
          if (["onlineOnly", "hasPhoto"].includes(k)) p[k] = v === "1";
          else if (k === "minAge" || k === "maxAge") p[k] = Number(v || "0");
          else p[k] = v;
        });
        applyPayload(p);
      }
    } catch {}

    setTimeout(() => doLoad(true), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ===== KEYBOARD NAV (ימין=LIKE, שמאל=SKIP וכו') ===== */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tag)) return;

      if (e.key === "ArrowRight") {
        const i = Math.max(0, focusIdx);
        const id = items[i]?.userId;
        if (id) like(id);
        setFocusIdx((x) => Math.min(items.length - 1, x + 1));
      } else if (e.key === "ArrowLeft") {
        const i = Math.max(0, focusIdx);
        const id = items[i]?.userId;
        if (id) skip(id);
        setFocusIdx((x) => Math.min(items.length - 1, x + 1));
      } else if (e.key.toLowerCase() === "c") {
        const id = items[Math.max(0, focusIdx)]?.userId;
        if (id) chat(id);
      } else if (e.key.toLowerCase() === "v") {
        const id = items[Math.max(0, focusIdx)]?.userId;
        if (id) video(id);
      } else if (e.key.toLowerCase() === "s") {
        const id = items[Math.max(0, focusIdx)]?.userId;
        if (id) superLike(id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusIdx, items]);

  /** ===== ACTIONS ===== */
  async function like(userId: string) {
    try {
      await fetch("/api/date/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: userId, action: "like" }),
      });
      setToast("❤ שלחת לייק");
    } catch {}
  }

  async function wink(userId: string) {
    if (!canUse("wink", myTier, myStatus)) {
      setUpsell({ feature: "chat", to: userId });
      return;
    }
    try {
      await fetch("/api/date/wink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setToast("😉 נשלחה קריצה");
    } catch {}
  }

  function skip(userId: string) {
    setItems((prev) => prev.filter((x) => x.userId !== userId));
  }

  function goUpgrade(feature: "chat" | "video", to?: string) {
    const u = new URL(window.location.origin + "/date/upgrade");
    u.searchParams.set("src", "matches");
    u.searchParams.set("feature", feature);
    if (to) u.searchParams.set("to", to);
    u.searchParams.set("demo", "1");
    window.location.href = u.toString();
  }

  function chat(userId: string) {
    if (!canUse("chat", myTier, myStatus)) {
      setUpsell({ feature: "chat", to: userId });
      return;
    }
    window.location.href = `/date/chat/${encodeURIComponent(userId)}`;
  }

  function video(userId: string) {
    if (!canUse("video", myTier, myStatus)) {
      setUpsell({ feature: "video", to: userId });
      return;
    }
    window.location.href = `/date/video?to=${encodeURIComponent(userId)}`;
  }

  function upgrade(_userId: string, target: Tier) {
    const u = new URL(window.location.origin + "/date/upgrade");
    u.searchParams.set("src", "matches");
    u.searchParams.set("target", target);
    u.searchParams.set("demo", "1");
    window.location.href = u.toString();
  }

  function superLike(userId: string) {
    if (!canUse("superlike", myTier, myStatus)) {
      setUpsell({ feature: "chat", to: userId });
      return;
    }
    setToast("💥 סופר־לייק נשלח!");
  }

  function save(_userId: string) {
    setToast("⭐ נשמר למועדפים");
  }

  function report(userId: string) {
    setReportUser(userId);
  }

  function block(userId: string) {
    setBlockUser(userId);
  }

  async function confirmReport(reason: string) {
    if (!reportUser) return;
    try {
      await fetch("/api/date/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: reportUser, reason }),
      });
      setToast("הדיווח התקבל. תודה!");
    } catch {}
    setReportUser(null);
  }

  async function confirmBlock() {
    if (!blockUser) return;
    try {
      await fetch("/api/date/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: blockUser }),
      });
      setToast("המשתמש נחסם");
      setItems((prev) => prev.filter((x) => x.userId !== blockUser));
    } catch {}
    setBlockUser(null);
  }

  /** ===== Explain Match (AI) ===== */
  async function handleExplainMatch(userId: string) {
    const item = items.find((x) => x.userId === userId);
    if (!item) return;

    const meta = matchMetaMap[userId];
    const finalScore =
      typeof meta?.finalScore === "number"
        ? meta.finalScore
        : typeof item.score === "number"
          ? item.score
          : null;

    // אם אין לנו בכלל פרופיל עצמי – לא ננסה לירות ל-API, רק הודעת שגיאה עדינה
    if (!meProfile) {
      setExplain({
        open: true,
        loading: false,
        error: "no-data",
        summary: null,
        bullets: null,
        targetName: item.displayName || null,
        score: finalScore,
      });
      return;
    }

    setExplain({
      open: true,
      loading: true,
      error: null,
      summary: null,
      bullets: null,
      targetName: item.displayName || null,
      score: finalScore,
    });

    try {
      const res = await fetch("/api/date/match/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          me: meProfile,
          other: item,
          match: {
            finalScore: finalScore ?? 0,
            factors: {
              baseProfileScore: meta?.profileScore ?? finalScore ?? 0,
              musicAffinity: meta?.musicScore ?? 0,
              distancePenalty:
                meta?.distanceScore != null ? 1 - meta.distanceScore / 100 : 0,
            },
            affinity: {},
          },
        }),
      });

      if (!res.ok) {
        throw new Error("bad_status");
      }

      const data = await res.json();
      if (!data?.ok) {
        throw new Error(data?.error || "api_error");
      }

      setExplain((prev) => ({
        ...prev,
        loading: false,
        error: null,
        summary: data.summary || null,
        bullets: data.bullets || null,
      }));
    } catch (err) {
      console.error("explain match error", err);
      setExplain((prev) => ({
        ...prev,
        loading: false,
        error: "failed",
      }));
    }
  }

  /** ===== פתיחת פרופיל על קליק כרטיס (לא על כפתור) ===== */
  function openProfile(userId: string) {
    router.push(`/date/profile/${encodeURIComponent(userId)}`);
  }

  function isInteractive(el: HTMLElement | null): boolean {
    if (!el) return false;
    const tag = el.tagName;
    if (
      [
        "BUTTON",
        "A",
        "SELECT",
        "INPUT",
        "TEXTAREA",
        "LABEL",
        "SUMMARY",
      ].includes(tag)
    )
      return true;
    if (
      el.getAttribute("role") === "button" ||
      el.getAttribute("role") === "link"
    )
      return true;
    return el.parentElement ? isInteractive(el.parentElement) : false;
  }

  function onCardClick(e: React.MouseEvent<HTMLDivElement>) {
    const uid = (e.currentTarget.getAttribute("data-uid") || "").trim();
    if (!uid) return;
    const target = e.target as HTMLElement;
    if (isInteractive(target)) return;
    openProfile(uid);
  }

  /** ===== CHIPS ACTIVE FILTERS ===== */
  const chips = useMemo(() => {
    const arr: React.ReactNode[] = [];
    if (city) arr.push(<Chip key="city">עיר: {city}</Chip>);
    if (country) arr.push(<Chip key="country">מדינה: {country}</Chip>);
    if (direction)
      arr.push(<Chip key="dir">זרם: {DIR_LABEL[direction as Direction]}</Chip>);
    if (gender)
      arr.push(
        <Chip key="g">
          מין:{" "}
          {gender === "male" ? "זכר" : gender === "female" ? "נקבה" : "אחר"}
        </Chip>,
      );
    if (lookingFor)
      arr.push(
        <Chip key="goal">
          מטרה:{" "}
          {lookingFor === "serious"
            ? "קשר רציני"
            : lookingFor === "marriage"
              ? "נישואין"
              : "חברות"}
        </Chip>,
      );
    arr.push(
      <Chip key="age">
        גיל: {minAge}–{maxAge}
      </Chip>,
    );
    if (subStatus)
      arr.push(
        <Chip key="sub">
          מינוי: {subStatus === "active" ? "פעיל" : "לא פעיל"}
        </Chip>,
      );
    if (tier) arr.push(<Chip key="tier">דרגה: {tier.toUpperCase()}</Chip>);
    if (onlineOnly) arr.push(<Chip key="on">מחוברים</Chip>);
    if (hasPhoto) arr.push(<Chip key="hp">עם תמונה</Chip>);
    if (sort)
      arr.push(
        <Chip key="sort">
          מיון: {sort === "score" ? "ציון התאמה" : "עדכניות"}
        </Chip>,
      );
    if (view !== "grid") arr.push(<Chip key="view">תצוגה: רשימה</Chip>);
    return arr;
  }, [
    city,
    country,
    direction,
    gender,
    lookingFor,
    minAge,
    maxAge,
    subStatus,
    tier,
    onlineOnly,
    hasPhoto,
    sort,
    view,
  ]);

  /** ===== UI ===== */
  return (
    <div dir="rtl">
      <Title
        title="MATY-DATE · התאמות חכמות"
        subtitle="מצא/י פרופילים שמתאימים לערכים ולהעדפות שלך."
      />

      {/* מצב מנוי + שדכנית */}
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto] items-center">
        <div className="text-center md:text-right text-xs opacity-75">
          המנוי שלך:{" "}
          <b>{myStatus === "active" ? myTier.toUpperCase() : "FREE"}</b>
          {myStatus !== "active" && " (לא פעיל)"}
        </div>
        <ShadchanCTA />
      </div>

      {/* TOOLBAR עליון */}
      <section className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/75 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`h-10 px-4 text-sm font-semibold ${
                view === "grid" ? "bg-black/5 dark:bg-white/10" : ""
              }`}
            >
              גריד
            </button>
            <button
              onClick={() => setView("stack")}
              className={`h-10 px-4 text-sm font-semibold ${
                view === "stack" ? "bg-black/5 dark:bg-white/10" : ""
              }`}
            >
              רשימה
            </button>
          </div>

          <label className="ms-1 text-sm">
            מיון{" "}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as any);
                setNext(null);
                debouncedLoad(true);
              }}
              className="h-10 ms-1 rounded-full border px-3 bg-white/90 dark:bg-neutral-900/90"
            >
              <option value="">ברירת מחדל</option>
              <option value="score">ציון התאמה</option>
              <option value="recency">עדכניות</option>
            </select>
          </label>

          <button
            onClick={() => {
              setNext(null);
              debouncedLoad(true);
            }}
            className="h-10 px-4 rounded-full text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700"
          >
            החל סינון
          </button>

          <button
            onClick={() => {
              resetFilters();
              setNext(null);
              debouncedLoad(true);
            }}
            className="h-10 px-4 rounded-full text-sm border bg-white/85 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
          >
            איפוס
          </button>
        </div>

        {/* PRESETS */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="שם פריסט…"
            className="h-10 w-40 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
          />
          <button
            onClick={savePreset}
            className="h-10 px-4 rounded-full text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
          >
            שמור פריסט
          </button>
          {presets.length > 0 && (
            <div className="inline-flex items-center gap-1 text-sm">
              <span className="opacity-70">טעינה:</span>
              <select
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) loadPreset(id);
                }}
                className="h-10 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
              >
                <option value="">—</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const id = prompt("מחק פריסט לפי ID:", presets[0]?.id || "");
                  if (id) deletePreset(id);
                }}
                className="h-10 px-3 rounded-full text-sm border"
              >
                מחיקה
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FILTERS */}
      <section className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4 md:p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm">עיר</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => applyAndReload(true)}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
              placeholder="למשל: ירושלים"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">מדינה</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              onBlur={() => applyAndReload(true)}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
              placeholder="ישראל"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">זרם ביהדות</span>
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as any);
                applyAndReload(true);
              }}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            >
              <option value="">—</option>
              {Object.entries(DIR_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">מין</span>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as any);
                applyAndReload(true);
              }}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            >
              <option value="">—</option>
              <option value="male">זכר</option>
              <option value="female">נקבה</option>
              <option value="other">אחר</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">מטרה</span>
            <select
              value={lookingFor}
              onChange={(e) => {
                setLookingFor(e.target.value as Goal);
                applyAndReload(true);
              }}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            >
              <option value="">—</option>
              <option value="serious">קשר רציני</option>
              <option value="marriage">נישואין</option>
              <option value="friendship">חברות</option>
            </select>
          </label>

          {/* גיל */}
          <div className="grid gap-2">
            <span className="text-sm">גיל</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={18}
                max={maxAge}
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                onMouseUp={() => applyAndReload(true)}
                onTouchEnd={() => applyAndReload(true)}
                className="flex-1 mm-range"
              />
              <input
                type="range"
                min={minAge}
                max={99}
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                onMouseUp={() => applyAndReload(true)}
                onTouchEnd={() => applyAndReload(true)}
                className="flex-1 mm-range"
              />
            </div>
            <div className="flex items-center justify-between text-xs opacity-70">
              <div className="flex items-center gap-2">
                <span>מינימום</span>
                <input
                  type="number"
                  min={18}
                  max={maxAge}
                  value={minAge}
                  onChange={(e) => {
                    const [lo] = clampAges(
                      Number(e.target.value || 18),
                      maxAge,
                    );
                    setMinAge(lo);
                  }}
                  onBlur={() => applyAndReload(true)}
                  className="h-8 w-16 rounded-lg border px-2 bg-white/95 dark:bg-neutral-900/90"
                />
              </div>
              <div className="rounded-full px-2 py-1 border border-black/10 dark:border-white/10">
                {minAge}–{maxAge}
              </div>
              <div className="flex items-center gap-2">
                <span>מקסימום</span>
                <input
                  type="number"
                  min={minAge}
                  max={99}
                  value={maxAge}
                  onChange={(e) => {
                    const [, hi] = clampAges(
                      minAge,
                      Number(e.target.value || 99),
                    );
                    setMaxAge(hi);
                  }}
                  onBlur={() => applyAndReload(true)}
                  className="h-8 w-16 rounded-lg border px-2 bg-white/95 dark:bg-neutral-900/90"
                />
              </div>
            </div>
          </div>

          {/* סטטוס מנוי / דרגה / טוגלים */}
          <label className="grid gap-1">
            <span className="text-sm">סטטוס מינוי</span>
            <select
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value as SubStatus | "");
                applyAndReload(true);
              }}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            >
              <option value="">הכול</option>
              <option value="active">פעיל</option>
              <option value="inactive">לא פעיל</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">דרגת חברות</span>
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value as Tier | "");
                applyAndReload(true);
              }}
              className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            >
              <option value="">הכול</option>
              <option value="free">FREE</option>
              <option value="plus">PLUS</option>
              <option value="pro">PRO</option>
              <option value="vip">VIP</option>
            </select>
          </label>

          <label className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => {
                setOnlineOnly(e.target.checked);
                applyAndReload(true);
              }}
              className="accent-emerald-600 h-4 w-4"
            />
            <span className="text-sm">מחוברים בלבד</span>
          </label>

          <label className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              checked={hasPhoto}
              onChange={(e) => {
                setHasPhoto(e.target.checked);
                applyAndReload(true);
              }}
              className="accent-violet-600 h-4 w-4"
            />
            <span className="text-sm">עם תמונה</span>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-right">{chips}</div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200/40 bg-red-50/70 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-300">
          {error}
          <div className="mt-2">
            <button
              onClick={() => doLoad(true)}
              className="rounded-full h-9 px-4 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
            >
              נסו שוב
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      <div
        className={
          view === "grid"
            ? "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "mt-8 grid gap-4"
        }
      >
        {loading && !first
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 p-4 animate-pulse"
              >
                <div className="h-4 w-28 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-3 h-24 rounded bg-black/10 dark:bg-white/10" />
              </div>
            ))
          : items.map((it, idx) => {
              const key =
                it._id ?? `${(it as any).userId ?? "u"}-${it.updatedAt ?? idx}`;

              const item: MatchItem = {
                ...it,
                displayName: it.displayName || "—",
              };

              const meta = matchMetaMap[item.userId];

              const card = (
                <MatchCard
                  key={key}
                  item={item}
                  matchMeta={meta}
                  onLike={like}
                  onWink={wink}
                  onSkip={skip}
                  onChat={(id) => chat(id)}
                  onVideo={(id) => video(id)}
                  onUpgrade={(id, t) => upgrade(id, t)}
                  onSuperLike={(id) => superLike(id)}
                  onSave={(id) => save(id)}
                  onReport={(id) => report(id)}
                  onBlock={(id) => block(id)}
                  onExplainMatch={() => handleExplainMatch(item.userId)}
                  chatClass="btn-glow btn-wiggle"
                  videoClass="btn-glow btn-wiggle"
                />
              );

              const wrapper =
                view === "grid" ? (
                  <div
                    key={key}
                    data-uid={item.userId}
                    className="cursor-pointer"
                    onClick={onCardClick}
                  >
                    {card}
                  </div>
                ) : (
                  <div
                    key={key}
                    data-uid={item.userId}
                    className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-2 cursor-pointer"
                    tabIndex={0}
                    onFocus={() => setFocusIdx(idx)}
                    onClick={onCardClick}
                  >
                    {card}
                  </div>
                );

              return wrapper;
            })}
      </div>

      {/* EMPTY */}
      {!loading && items.length === 0 && !error && (
        <div className="text-center py-10">
          <div className="text-xl font-extrabold">לא נמצאו התאמות</div>
          <div className="mt-1 opacity-70 text-sm">
            נסו להרחיב טווח גיל או להקל בסינונים.
          </div>
        </div>
      )}

      {/* LOAD MORE / SENTINEL */}
      <div className="mt-6 flex justify-center">
        {nextCursor ? (
          <button
            onClick={() => doLoad(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "טוען…" : "טען עוד"}
          </button>
        ) : (
          items.length > 0 && (
            <div className="text-sm opacity-60">הצגת כל ההתאמות</div>
          )
        )}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-1" />

      {/* UPSELL MODAL */}
      {upsell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50">
          <div className="w-[min(96vw,560px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">שדרוג נדרש</div>
              <button
                onClick={() => setUpsell(null)}
                className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 opacity-80 text-sm leading-6">
              {upsell.feature === "chat"
                ? "כדי לפתוח צ׳אט צריך מסלול PRO או VIP."
                : "כדי לפתוח שיחת וידאו צריך מסלול VIP (מומלץ)."}
            </p>
            <div className="mt-4 grid gap-2 sm:flex sm:justify-end">
              <button
                onClick={() => goUpgrade(upsell.feature, upsell.to)}
                className="h-10 px-5 rounded-full bg-rose-600 text-white inline-flex items-center justify-center btn-glow btn-wiggle"
              >
                לשדרוג עכשיו
              </button>
              <a
                href={`/date/upgrade?src=matches&feature=${upsell.feature}&demo=1`}
                className="h-10 px-5 rounded-full border bg-white/90 dark:bg-neutral-900/90 inline-flex items-center justify-center"
              >
                מצב דמו
              </a>
              <button
                onClick={() => setUpsell(null)}
                className="h-10 px-5 rounded-full border bg-white/80 dark:bg-neutral-900/80"
              >
                לא עכשיו
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-50">
          <div className="w-[min(96vw,520px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right">
            <div className="text-lg font-bold">דיווח על משתמש</div>
            <p className="mt-2 text-sm opacity-80">ספר/י לנו בקצרה מה הבעיה.</p>
            <textarea
              id="report-text"
              className="mt-3 w-full rounded-xl border px-3 py-2 bg-white/90 dark:bg-neutral-900/90"
              rows={4}
              placeholder="תוכן לא הולם / התחזות / הטרדה / אחר…"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => {
                  const el = document.getElementById(
                    "report-text",
                  ) as HTMLTextAreaElement | null;
                  confirmReport(el?.value || "");
                }}
                className="h-10 px-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                שלח דיווח
              </button>
              <button
                onClick={() => setReportUser(null)}
                className="h-10 px-5 rounded-full border"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK MODAL */}
      {blockUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-50">
          <div className="w-[min(96vw,460px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right">
            <div className="text-lg font-bold">לחסום משתמש?</div>
            <p className="mt-2 text-sm opacity-80">
              לא תראה/י יותר את המשתמש הזה, והוא לא יוכל לפנות אליך.
            </p>
            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={confirmBlock}
                className="h-10 px-5 rounded-full bg-rose-600 text-white"
              >
                חסימה
              </button>
              <button
                onClick={() => setBlockUser(null)}
                className="h-10 px-5 rounded-full border"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ExplainMatchModal (AI) */}
      <ExplainMatchModal
        open={explain.open}
        onClose={() =>
          setExplain((prev) => ({ ...prev, open: false, error: null }))
        }
        loading={explain.loading}
        error={explain.error || undefined}
        summary={explain.summary || undefined}
        bullets={explain.bullets || undefined}
        targetName={explain.targetName || undefined}
        score={explain.score ?? undefined}
      />

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 rounded-xl bg-black text-white/95 dark:bg-white dark:text-black px-4 py-2 text-sm shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
