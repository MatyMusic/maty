// src/app/(date)/date/chat/page.tsx
"use client";

/**
 * MATY-DATE · צ'אט חכם
 *
 * מסך כניסה לצ'אט 1-על-1:
 *  - טאבים: צ'אטים פתוחים / התאמות / חיפוש
 *  - בחירה אינטואיטיבית של בן/בת שיחה (ללא המונח peerId למשתמש)
 *  - אינטגרציית AI (מצב סיכום שיחה, מצב "Ice-breakers", מצב "מצב שדכן")
 *  - רספונסיבי מלא + Tailwind
 *  - תמיכה במצב אדמין (גישה לחסומים, דיבאג, קפיצה מהירה)
 */

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BadgeHelp,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Globe2,
  Heart,
  History,
  Info,
  Loader2,
  MessageCircle,
  MessageSquare,
  Moon,
  RadioTower,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  SunMedium,
  UserCircle,
  Users,
  Wand2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
 * Types
 * ======================================================= */

type ChatTab = "open-chats" | "matches" | "search";

type AiMode = "off" | "icebreakers" | "summaries" | "coach";

type PresenceState = "online" | "recent" | "offline";

type Tier = "free" | "plus" | "pro" | "vip";
type SubStatus = "active" | "inactive";

type BaseUser = {
  userId: string;
  displayName: string;
  age?: number;
  city?: string;
  country?: string;
  avatarUrl?: string | null;
  verified?: boolean;
  presence?: PresenceState;
  lastActiveAt?: string | null;
  distanceKm?: number | null;
  shortBio?: string | null;
};

type ChatSummary = {
  chatId: string;
  peer: BaseUser;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  aiSummaryShort?: string;
  aiSummaryUpdatedAt?: string;
};

type MatchItem = {
  matchId: string;
  peer: BaseUser;
  compatibilityScore?: number | null;
  goals?: string[];
  shard?: string | null;
  subscription?: {
    tier: Tier;
    status: SubStatus;
  } | null;
};

type SearchResult = BaseUser & {
  commonTags?: string[];
  mutualFriends?: number;
};

type AiSuggestion = {
  id: string;
  label: string;
  text: string;
  tone: "קליל" | "רציני" | "מחמיא" | "שאלה פתוחה";
};

/* =========================================================
 * Helpers
 * ======================================================= */

const fromNow = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "לפני רגע";
  if (m < 60) return `לפני ${m} דק'`;
  const h = Math.round(m / 60);
  if (h < 24) return `לפני ${h} שע'`;
  const days = Math.round(h / 24);
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return d.toLocaleDateString("he-IL");
};

const presenceLabel = (p?: PresenceState) =>
  p === "online"
    ? "מחובר/ת עכשיו"
    : p === "recent"
      ? "נראה/תה לאחרונה"
      : "לא מחובר/ת כרגע";

const presenceDotClass = (p?: PresenceState) =>
  p === "online"
    ? "bg-emerald-500 ring-emerald-300/40"
    : p === "recent"
      ? "bg-amber-400 ring-amber-300/40"
      : "bg-neutral-400 ring-transparent";

const clampScore = (v?: number | null) => {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
};

const kmLabel = (v?: number | null) =>
  typeof v === "number" && isFinite(v)
    ? `${v.toFixed(v < 10 ? 1 : 0)} ק"מ`
    : "";

const fallbackInitial = (name?: string | null) =>
  (name?.trim?.() || "?").charAt(0).toUpperCase();

/* ---------------------------------------------------------
 * Admin detection (client-side, תואם מה שעשינו במקומות אחרים)
 * ------------------------------------------------------- */

function readIsAdminClient(): boolean {
  try {
    // window flag
    if ((window as any).__MM_IS_ADMIN__ === true) return true;

    // html attribute
    const html = document.documentElement;
    if (html?.dataset?.admin === "1") return true;

    // localStorage
    if (localStorage.getItem("mm:admin") === "1") return true;

    // cookie
    const role = (
      document.cookie.match(/(?:^|;)\s*mm_role=([^;]+)/)?.[1] || ""
    ).toLowerCase();
    if (role === "admin" || role === "superadmin") return true;

    // dev unsafe
    if (process.env.NEXT_PUBLIC_ALLOW_UNSAFE_ADMIN === "1") return true;
  } catch {
    // ignore
  }
  return false;
}

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(readIsAdminClient());
  }, []);
  return isAdmin;
}

/* =========================================================
 * Small UI atoms
 * ======================================================= */

function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 px-2 py-0.5 text-[11px]" +
        (className ? " " + className : "")
      }
    >
      {children}
    </span>
  );
}

function SoftBadge({ icon, text }: { icon?: ReactNode; text: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px]">
      {icon}
      {text}
    </span>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 text-white grid place-items-center shadow-sm">
            {icon}
          </div>
        )}
        <div className="text-right">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-[11px] opacity-70 leading-tight">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 dark:border-white/5 bg-white/70 dark:bg-neutral-900/60 px-3 py-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-2.5 w-40 rounded bg-black/10 dark:bg-white/10" />
      </div>
      <div className="h-7 w-20 rounded-full bg-black/10 dark:bg-white/10" />
    </div>
  );
}

/* =========================================================
 * AI control bar
 * ======================================================= */

function AiModeBar({
  mode,
  onModeChange,
  compact,
}: {
  mode: AiMode;
  onModeChange: (m: AiMode) => void;
  compact?: boolean;
}) {
  const modes: { id: AiMode; label: string; desc: string }[] = [
    {
      id: "off",
      label: "כבוי",
      desc: "ללא התערבות AI",
    },
    {
      id: "icebreakers",
      label: "פתיחות שיחה",
      desc: "הצעות למשפטי פתיחה ושאלות",
    },
    {
      id: "summaries",
      label: "סיכומים חכמים",
      desc: "סיכום שיחות בעברית פשוטה",
    },
    {
      id: "coach",
      label: "מאמן אישי",
      desc: "טיפים בזמן אמת (respectful)",
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-dashed border-violet-400/60 bg-violet-50/70 dark:bg-violet-950/40 px-3 py-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
          <span className="font-semibold">מצב AI:</span>
          <span>
            {mode === "off"
              ? "כבוי"
              : mode === "icebreakers"
                ? "פתיחות שיחה"
                : mode === "summaries"
                  ? "סיכומי שיחה"
                  : "מאמן אישי"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={[
                "h-7 rounded-full px-2",
                "transition text-[10px]",
                m.id === mode
                  ? "bg-violet-600 text-white"
                  : "bg-white/80 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-100",
              ].join(" ")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-400/70 bg-violet-50/80 dark:bg-violet-950/50 px-3 py-3 mt-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
          <div className="text-xs">
            <div className="font-semibold">מנוע AI חכם לצ'אט</div>
            <div className="opacity-70">
              בחר/י איך ה-AI ילווה אותך במהלך השיחות.
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-1 sm:grid-cols-4">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={[
              "text-right rounded-xl px-2.5 py-2 border text-[11px] transition",
              m.id === mode
                ? "border-violet-500 bg-white shadow-sm dark:bg-neutral-900"
                : "border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-950/40",
            ].join(" ")}
          >
            <div className="font-semibold flex items-center gap-1">
              {m.id === "off" && <EyeOff className="h-3.5 w-3.5" />}
              {m.id === "icebreakers" && <Bot className="h-3.5 w-3.5" />}
              {m.id === "summaries" && <Brain className="h-3.5 w-3.5" />}
              {m.id === "coach" && <BadgeHelp className="h-3.5 w-3.5" />}
              {m.label}
            </div>
            <div className="opacity-70 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
 * AI suggestions panel (פתיחות שיחה / רעיונות)
 * ======================================================= */

function AiSuggestionsPanel({
  mode,
  currentPeer,
  onApply,
}: {
  mode: AiMode;
  currentPeer?: BaseUser | null;
  onApply?: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [expanded, setExpanded] = useState(true);

  const name = currentPeer?.displayName || "הצד השני";

  const loadSuggestions = useCallback(async () => {
    if (mode === "off") return;
    setLoading(true);
    try {
      // כאן אפשר להחליף ב־fetch ל־/api/date/ai/suggestions
      await new Promise((r) => setTimeout(r, 350));

      const base: AiSuggestion[] = [
        {
          id: "1",
          label: "פתיח קליל",
          tone: "קליל",
          text: `היי ${name}, שמח/ה שהמערכת חיברה בינינו 😊 איך עובר עליך היום?`,
        },
        {
          id: "2",
          label: "שאלה פתוחה",
          tone: "שאלה פתוחה",
          text: `אם היית יכול/ה לבחור מקום בעולם לדייט ראשון – מה היית בוחר/ת ולמה דווקא שם?`,
        },
        {
          id: "3",
          label: "מחמאה עדינה",
          tone: "מחמיא",
          text: `נראה מהפרופיל שלך שיש לך וייב מאוד נעים. מה הדבר שהכי חשוב לך בקשר?`,
        },
        {
          id: "4",
          label: "פתיח רציני",
          tone: "רציני",
          text: `היי ${name}, אני כאן לחפש קשר אמיתי ומשמעותי. מעניין אותי לשמוע מה את/ה מחפש/ת ומה חשוב לך ביל/בת זוג.`,
        },
      ];

      if (mode === "coach") {
        base.push({
          id: "5",
          label: "מאמן אישי",
          tone: "רציני",
          text: `טיפ: שמור/י על שאלות פתוחות, הקשבה אמיתית ולא להציף את הצד השני. אפשר להתחיל במשפט פשוט כמו: "מה נותן לך הכי הרבה אנרגיה טובה בשגרה?"`,
        });
      }

      setSuggestions(base);
    } finally {
      setLoading(false);
    }
  }, [mode, name]);

  useEffect(() => {
    if (mode === "off") {
      setSuggestions([]);
      return;
    }
    // טוען כל פעם שמחליפים מצב או בן שיחה
    loadSuggestions();
  }, [mode, currentPeer?.userId, loadSuggestions]);

  if (mode === "off") return null;

  return (
    <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 p-3">
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center justify-between text-xs"
      >
        <div className="flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
          <span className="font-semibold">
            רעיונות שיחה מ־AI {currentPeer ? `עבור ${name}` : ""}
          </span>
          {loading && (
            <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-70">
          <span>{expanded ? "הסתר" : "הצג"}</span>
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 h-12 animate-pulse"
                />
              ))
            : suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onApply?.(s.text)}
                  className="text-right rounded-xl border border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/5 px-2.5 py-2 text-[11px] hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-[10px] opacity-70">· {s.tone}</span>
                  </div>
                  <div className="opacity-90">{s.text}</div>
                </button>
              ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * Open chats list
 * ======================================================= */

function OpenChatsList({
  items,
  loading,
  error,
  onRefresh,
  onOpenChat,
}: {
  items: ChatSummary[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenChat: (chatId: string, peerId: string) => void;
}) {
  return (
    <section>
      <SectionTitle
        icon={<History className="h-4 w-4" />}
        title="צ׳אטים פתוחים"
        subtitle="שיחות שכבר התחלת בעבר – המשך בדיוק מאיפה שהפסקת."
      />

      {error && (
        <div className="mb-3 rounded-xl border border-red-300/60 bg-red-50/80 dark:bg-red-950/40 px-3 py-2 text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>לא ניתן לטעון צ'אטים פתוחים כרגע.</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full border border-red-300/60 bg-white/80 dark:bg-red-900/40 text-[11px]"
          >
            <RefreshCw className="h-3 w-3" />
            נסו שוב
          </button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-4 text-xs flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 opacity-70" />
          <div>
            <div className="font-semibold mb-0.5">אין עדיין צ'אטים פתוחים</div>
            <div className="opacity-80">
              התחילו עם התאמות חדשות או בחיפוש משתמש, והצ'אטים יופיעו כאן.
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 space-y-2">
        {items.map((chat) => {
          const score = clampScore(chat.aiSummaryShort ? 82 : undefined); // סתם דקורציה :)
          const p = chat.peer;
          return (
            <button
              key={chat.chatId}
              type="button"
              onClick={() => onOpenChat(chat.chatId, p.userId)}
              className="w-full text-right rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/85 px-3 py-3 flex items-center gap-3 hover:shadow-sm transition"
            >
              <div className="relative shrink-0">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.displayName}
                    className="h-10 w-10 rounded-full object-cover border border-black/10 dark:border-white/10"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 grid place-items-center text-white font-bold">
                    {fallbackInitial(p.displayName)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ${presenceDotClass(
                    p.presence,
                  )}`}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">
                    {p.displayName}
                  </span>
                  {p.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-sky-500" />
                  )}
                  {p.city && (
                    <SoftBadge
                      icon={<Globe2 className="h-3 w-3" />}
                      text={`${p.city}${p.country ? `, ${p.country}` : ""}`}
                    />
                  )}
                  {score !== null && (
                    <SoftBadge
                      icon={<Heart className="h-3 w-3 text-pink-500" />}
                      text={`התאמה ~${score}%`}
                    />
                  )}
                </div>

                <div className="text-[11px] opacity-80 truncate">
                  {chat.lastMessagePreview || "טרם נשלחו הודעות בצ'אט זה."}
                </div>

                <div className="flex items-center gap-2 text-[10px] opacity-70">
                  <span>{fromNow(chat.lastMessageAt)}</span>
                  <span>·</span>
                  <span>{presenceLabel(p.presence)}</span>
                  {p.distanceKm != null && (
                    <>
                      <span>·</span>
                      <span>{kmLabel(p.distanceKm)}</span>
                    </>
                  )}
                </div>

                {chat.aiSummaryShort && (
                  <div className="mt-1 rounded-xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-700/60 px-2 py-1 text-[10px] flex items-start gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300 mt-0.5 shrink-0" />
                    <div className="truncate">{chat.aiSummaryShort}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0 ps-1">
                {chat.unreadCount > 0 && (
                  <span className="min-w-[1.4rem] text-center rounded-full bg-rose-500 text-white text-[10px] px-1 py-0.5">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 text-[11px] text-violet-700 dark:text-violet-300">
                  המשך צ'אט
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
 * Matches pick list
 * ======================================================= */

function MatchesList({
  items,
  loading,
  error,
  onRefresh,
  onOpenChatFromMatch,
}: {
  items: MatchItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenChatFromMatch: (matchId: string, peerId: string) => void;
}) {
  return (
    <section className="mt-5">
      <SectionTitle
        icon={<Users className="h-4 w-4" />}
        title="התאמות חדשות"
        subtitle="בחר/י התאמה כדי לפתוח צ׳אט 1-על-1."
      />

      {error && (
        <div className="mb-3 rounded-xl border border-red-300/60 bg-red-50/80 dark:bg-red-950/40 px-3 py-2 text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>לא ניתן לטעון התאמות כרגע.</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full border border-red-300/60 bg-white/80 dark:bg-red-900/40 text-[11px]"
          >
            <RefreshCw className="h-3 w-3" />
            נסו שוב
          </button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-4 text-xs flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 opacity-70" />
          <div>
            <div className="font-semibold mb-0.5">אין כרגע התאמות חדשות</div>
            <div className="opacity-80">
              המשיכו לעדכן פרטים ולבקר בדף "התאמות" כדי לקבל חיבורים נוספים.
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((m) => {
          const p = m.peer;
          const score = clampScore(m.compatibilityScore ?? null);
          const tier = m.subscription?.tier || "free";
          const active = m.subscription?.status === "active";

          const tierLabel =
            tier === "vip"
              ? "VIP"
              : tier === "pro"
                ? "PRO"
                : tier === "plus"
                  ? "PLUS"
                  : "FREE";

          const tierClass =
            tier === "vip"
              ? "border-fuchsia-500 text-fuchsia-700 bg-fuchsia-50/80 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
              : tier === "pro"
                ? "border-violet-500 text-violet-700 bg-violet-50/80 dark:bg-violet-950/30 dark:text-violet-300"
                : tier === "plus"
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-neutral-300 text-neutral-700 bg-white/70 dark:bg-neutral-950/40 dark:text-neutral-200";

          return (
            <button
              key={m.matchId}
              type="button"
              onClick={() => onOpenChatFromMatch(m.matchId, p.userId)}
              className="text-right rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/90 px-3 py-3 flex items-center gap-3 hover:shadow-sm transition"
            >
              <div className="relative shrink-0">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.displayName}
                    className="h-10 w-10 rounded-full object-cover border border-black/10 dark:border-white/10"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-amber-500 grid place-items-center text-white font-bold">
                    {fallbackInitial(p.displayName)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ${presenceDotClass(
                    p.presence,
                  )}`}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">
                    {p.displayName}
                  </span>
                  {p.age && (
                    <SoftBadge text={`${p.age} · ${p.city ?? "לא צויין"}`} />
                  )}
                  {p.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-sky-500" />
                  )}
                </div>
                {p.shortBio && (
                  <div className="text-[11px] opacity-80 truncate">
                    {p.shortBio}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1 text-[10px] opacity-80">
                  {score !== null && (
                    <Chip className="border-amber-300/70 text-amber-700 dark:border-amber-500/70 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40">
                      <Heart className="h-3 w-3 text-pink-500" />
                      <span>ציון התאמה {score}%</span>
                    </Chip>
                  )}
                  <Chip className={tierClass + " border text-[10px]"}>
                    <Crown className="h-3 w-3" />
                    <span>{tierLabel}</span>
                    {!active && <span>· לא פעיל</span>}
                  </Chip>
                  {m.goals && m.goals.length > 0 && (
                    <Chip className="text-[10px]">
                      🎯 {m.goals.slice(0, 2).join(" · ")}
                    </Chip>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0 ps-1">
                <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  פתח צ׳אט
                  <MessageSquare className="h-3 w-3" />
                </span>
                {p.distanceKm != null && (
                  <span className="text-[10px] opacity-70">
                    {kmLabel(p.distanceKm)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
 * Search users block
 * ======================================================= */

function SearchUsersBlock({
  query,
  onQueryChange,
  searching,
  results,
  onSearch,
  onOpenChat,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  searching: boolean;
  results: SearchResult[];
  onSearch: () => void;
  onOpenChat: (userId: string) => void;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <section className="mt-5">
      <SectionTitle
        icon={<Search className="h-4 w-4" />}
        title="חיפוש משתמש"
        subtitle="חיפוש לפי שם, כינוי, עיר או מזהה שידוך."
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full h-11 rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 ps-10 pe-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/60"
            placeholder="הקלידו שם פרטי, משפחה, כינוי או מזהה שידוך…"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          disabled={!query.trim() || searching}
          className="h-11 px-5 rounded-2xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 text-sm font-semibold inline-flex items-center justify-center gap-1"
        >
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              מחפש…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              חפש/י
            </>
          )}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {searching && results.length === 0 && (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!searching && results.length === 0 && !query && (
          <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-4 text-xs flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 opacity-70" />
            <div>
              <div className="font-semibold mb-0.5">
                טיפ: חיפוש ידני למשתמשים
              </div>
              <div className="opacity-80">
                כאן אפשר לפתוח צ'אט גם עם משתמש שלא נראה כרגע ברשימת ההתאמות –
                באמצעות שם, כינוי או קוד שידוך שמסרתם אחד לשני.
              </div>
            </div>
          </div>
        )}

        {!searching &&
          results.map((u) => (
            <button
              key={u.userId}
              type="button"
              onClick={() => onOpenChat(u.userId)}
              className="w-full text-right rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/90 px-3 py-3 flex items-center gap-3 hover:shadow-sm transition"
            >
              <div className="relative shrink-0">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.displayName}
                    className="h-10 w-10 rounded-full object-cover border border-black/10 dark:border-white/10"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 grid place-items-center text-white font-bold">
                    {fallbackInitial(u.displayName)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ${presenceDotClass(
                    u.presence,
                  )}`}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">
                    {u.displayName}
                  </span>
                  {u.age && (
                    <span className="text-[11px] opacity-80">
                      · {u.age} שנה
                    </span>
                  )}
                  {u.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-sky-500" />
                  )}
                </div>
                <div className="text-[11px] opacity-80 truncate">
                  {[u.city, u.country].filter(Boolean).join(", ")}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] opacity-80">
                  {u.commonTags &&
                    u.commonTags
                      .slice(0, 3)
                      .map((t) => <Chip key={t}>{t}</Chip>)}
                  {typeof u.mutualFriends === "number" &&
                    u.mutualFriends > 0 && (
                      <Chip>🤝 {u.mutualFriends} חברים משותפים</Chip>
                    )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0 ps-1">
                <span className="inline-flex items-center gap-0.5 text-[11px] text-violet-700 dark:text-violet-300">
                  פתח צ׳אט
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
      </div>
    </section>
  );
}

/* =========================================================
 * Root Page Component
 * ======================================================= */

export default function ChatIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = useIsAdmin();

  // state
  const [tab, setTab] = useState<ChatTab>(() => {
    const t = searchParams?.get("tab");
    if (t === "matches" || t === "search") return t;
    return "open-chats";
  });

  const [aiMode, setAiMode] = useState<AiMode>("icebreakers");

  const [openChats, setOpenChats] = useState<ChatSummary[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [errChats, setErrChats] = useState<string | null>(null);
  const [errMatches, setErrMatches] = useState<string | null>(null);

  const [hasConnection, setHasConnection] = useState(true);

  // למילוי הודעה מה־AI ללחיצה – כאן רק סימולציה
  const lastSelectedPeerRef = useRef<BaseUser | null>(null);

  // theme קטנטן (ברמת העמוד) – לא חובה, אבל מגניב
  const [localDark, setLocalDark] = useState<null | boolean>(null);
  useEffect(() => {
    const m =
      typeof window !== "undefined"
        ? window.matchMedia?.("(prefers-color-scheme: dark)")
        : null;
    if (m?.matches) setLocalDark(true);
  }, []);
  const toggleLocalTheme = () => setLocalDark((x) => !x);

  // סנכרון טאב ל־URL
  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("tab", tab);
    window.history.replaceState(null, "", u.toString());
  }, [tab]);

  // דמו: טעינת צ'אטים פתוחים
  const loadOpenChats = useCallback(async () => {
    setLoadingChats(true);
    setErrChats(null);
    try {
      // כאן במקום דמו – fetch ל־/api/date/chats
      await new Promise((r) => setTimeout(r, 400));

      const demo: ChatSummary[] = [
        {
          chatId: "chat_1",
          peer: {
            userId: "user_uria",
            displayName: "אוריה מסעוד לוי",
            age: 27,
            city: "מודיעין",
            country: "ישראל",
            avatarUrl: null,
            verified: true,
            presence: "online",
            lastActiveAt: new Date().toISOString(),
            distanceKm: 12.3,
            shortBio: "לוחם, אוהב מוזיקה חיה וטיולים.",
          },
          lastMessagePreview:
            "יאללה, נלך על קפה בשבוע הבא או שננסה משהו יותר מיוחד? ☕✨",
          lastMessageAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          unreadCount: 2,
          aiSummaryShort:
            "השיחה מתקדמת לכיוון מפגש ראשון; יש וייב קליל וטוב, עם דיבור על תחומי עניין משותפים.",
          aiSummaryUpdatedAt: new Date().toISOString(),
        },
        {
          chatId: "chat_2",
          peer: {
            userId: "user_sharona",
            displayName: "שרונה ח.",
            age: 29,
            city: "ירושלים",
            country: "ישראל",
            avatarUrl: null,
            verified: false,
            presence: "recent",
            lastActiveAt: new Date(
              Date.now() - 2 * 60 * 60 * 1000,
            ).toISOString(),
            distanceKm: 32,
            shortBio: "חינוך מיוחד, אוהבת שקט ורגעים עמוקים.",
          },
          lastMessagePreview:
            "אני מרגישה שחשוב שנדבר על מה מחזיק קשר לאורך זמן…",
          lastMessageAt: new Date(
            Date.now() - 4 * 60 * 60 * 1000,
          ).toISOString(),
          unreadCount: 0,
        },
      ];

      setOpenChats(demo);
    } catch (e: any) {
      console.error(e);
      setErrChats("שגיאה בטעינת הצ'אטים.");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // דמו: טעינת התאמות
  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    setErrMatches(null);
    try {
      // כאן במקום דמו – fetch ל־/api/date/matches?limit=...
      await new Promise((r) => setTimeout(r, 420));

      const demo: MatchItem[] = [
        {
          matchId: "match_443",
          peer: {
            userId: "user_443_match",
            displayName: "חני מ. 443",
            age: 25,
            city: "בני ברק",
            country: "ישראל",
            avatarUrl: null,
            verified: true,
            presence: "online",
            lastActiveAt: new Date().toISOString(),
            distanceKm: 7.8,
            shortBio: "חב״דית, אוהבת נגינה, חינוך ונסיעה למבצעים.",
          },
          compatibilityScore: 93,
          goals: ["קשר רציני", "נישואין"],
          shard: "443",
          subscription: {
            tier: "pro",
            status: "active",
          },
        },
        {
          matchId: "match_vip",
          peer: {
            userId: "user_vip_maty",
            displayName: "VIP שידוך",
            age: 30,
            city: "תל אביב",
            country: "ישראל",
            avatarUrl: null,
            verified: true,
            presence: "recent",
            lastActiveAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            distanceKm: 18.9,
            shortBio: "מאמינה בחיבור דרך שיחות עמוקות והומור.",
          },
          compatibilityScore: 88,
          goals: ["קשר רציני"],
          shard: null,
          subscription: {
            tier: "vip",
            status: "active",
          },
        },
      ];

      setMatches(demo);
    } catch (e: any) {
      console.error(e);
      setErrMatches("שגיאה בטעינת ההתאמות.");
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // חיפוש משתמשים – דמו
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setLoadingSearch(true);
    setSearchResults([]);
    try {
      // כאן בפועל:
      // const res = await fetch(`/api/date/search-user?q=${encodeURIComponent(q)}`)
      // ...
      await new Promise((r) => setTimeout(r, 500));

      const demo: SearchResult[] = [
        {
          userId: "user_search_1",
          displayName: "משתמש דמו · " + q,
          age: 28,
          city: "רמת גן",
          country: "ישראל",
          avatarUrl: null,
          verified: false,
          presence: "online",
          lastActiveAt: new Date().toISOString(),
          distanceKm: 5.4,
          shortBio: "הגעתי דרך חיפוש ידני – אפשר לחבר לצ'אט.",
          commonTags: ["מוזיקה", "התפתחות אישית"],
          mutualFriends: 2,
        },
      ];

      setSearchResults(demo);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchQuery]);

  // זיהוי חיבור אינטרנט (רק UI קטן)
  useEffect(() => {
    function updateOnline() {
      setHasConnection(navigator.onLine);
    }
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  // טעינת נתונים ראשונית
  useEffect(() => {
    loadOpenChats();
    loadMatches();
  }, [loadOpenChats, loadMatches]);

  // מעבר לצ'אט לפי chatId+peerId
  const goToChat = (
    peerId: string,
    fromChatId?: string,
    fromMatchId?: string,
  ) => {
    // אפשר להעביר גם פרמטרים ב-query
    const u = new URL(
      window.location.origin + `/date/chat/${encodeURIComponent(peerId)}`,
    );
    if (fromChatId) u.searchParams.set("chat", fromChatId);
    if (fromMatchId) u.searchParams.set("match", fromMatchId);
    if (aiMode !== "off") u.searchParams.set("ai", aiMode);
    router.push(u.toString().replace(window.location.origin, ""));
  };

  // אפליקציית AI מציעה טקסט – לדוגמה, אפשר לשמור ב-sessionStorage או בקונטקסט
  const applyAiText = (text: string) => {
    try {
      sessionStorage.setItem("matydate:ai:prefill", text);
    } catch {
      // ignore
    }
    // אפשר להציג toast כלשהו, או פשוט לא לעשות כלום כאן
  };

  // peer הנוכחי (משוער) – לפי טאב ועל מה לוחצים
  const currentPeer = useMemo<BaseUser | null>(() => {
    if (tab === "open-chats" && openChats.length > 0) return openChats[0].peer;
    if (tab === "matches" && matches.length > 0) return matches[0].peer;
    if (tab === "search" && searchResults.length > 0) return searchResults[0];
    return lastSelectedPeerRef.current;
  }, [tab, openChats, matches, searchResults]);

  useEffect(() => {
    if (currentPeer) lastSelectedPeerRef.current = currentPeer;
  }, [currentPeer]);

  const wrapperThemeClasses =
    localDark === true
      ? "dark bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-white"
      : localDark === false
        ? "bg-gradient-to-b from-violet-50 via-pink-50 to-amber-50 text-neutral-900"
        : "bg-gradient-to-b from-violet-50 via-pink-50 to-amber-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white";

  return (
    <main
      dir="rtl"
      className={
        "min-h-dvh px-3 sm:px-4 py-5 sm:py-8 grid place-items-start " +
        wrapperThemeClasses
      }
    >
      <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
        {/* כותרת עליונה */}
        <header className="relative rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl px-4 sm:px-6 py-4 sm:py-5 shadow-lg overflow-hidden">
          {/* הילה */}
          <div className="pointer-events-none absolute -inset-1 opacity-40 dark:opacity-60 blur-3xl bg-gradient-to-tr from-fuchsia-500/30 via-violet-500/20 to-cyan-400/30" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-3xl bg-gradient-to-br from-violet-600 to-pink-500 text-white grid place-items-center shadow-md">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold leading-tight">
                    MATY-DATE · צ׳אט חכם
                  </h1>
                  <span className="rounded-full bg-black/5 dark:bg-white/10 text-[10px] px-2 py-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI LIVE
                  </span>
                  {isAdmin && (
                    <span className="rounded-full bg-amber-500/15 text-[10px] px-2 py-0.5 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] opacity-80 mt-0.5">
                  חיבור ישיר לשיחה פרטית עם בן/בת התאמה – בלי לדבר בשפה טכנית.
                  הכל בעברית ברורה, עם סיוע חי של AI.
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] opacity-80">
                  <SoftBadge
                    icon={<Bot className="h-3 w-3" />}
                    text="הצעות פתיחה חכמות"
                  />
                  <SoftBadge
                    icon={<Brain className="h-3 w-3" />}
                    text="סיכומי שיחה אוטומטיים"
                  />
                  <SoftBadge
                    icon={<RadioTower className="h-3 w-3" />}
                    text="מוכן לצ'אט וידאו"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <div className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5">
                  {hasConnection ? (
                    <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span>
                    {hasConnection ? "מקוון" : "מצב לא מקוון – נפעל כשיתחבר"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleLocalTheme}
                  className="h-8 w-8 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 grid place-items-center"
                  title="החלפת מצב בהירות רק למסך זה"
                >
                  {localDark ? (
                    <SunMedium className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1 text-[10px] opacity-80">
                <Info className="h-3 w-3" />
                <span>
                  אפשר לפתוח צ׳אט דרך צ׳אטים פתוחים, התאמות חדשות או חיפוש ידני.
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* טאבים ראשיים */}
        <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl px-3 sm:px-5 py-3 sm:py-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setTab("open-chats")}
                className={[
                  "flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] sm:text-[13px] transition",
                  tab === "open-chats"
                    ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-700 dark:text-neutral-200",
                ].join(" ")}
              >
                <History className="h-3.5 w-3.5" />
                צ׳אטים פתוחים
              </button>
              <button
                type="button"
                onClick={() => setTab("matches")}
                className={[
                  "flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] sm:text-[13px] transition",
                  tab === "matches"
                    ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-700 dark:text-neutral-200",
                ].join(" ")}
              >
                <Users className="h-3.5 w-3.5" />
                התאמות
              </button>
              <button
                type="button"
                onClick={() => setTab("search")}
                className={[
                  "flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] sm:text-[13px] transition",
                  tab === "search"
                    ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-700 dark:text-neutral-200",
                ].join(" ")}
              >
                <Search className="h-3.5 w-3.5" />
                חיפוש
              </button>
            </div>

            {/* מצב AI קומפקטי */}
            <AiModeBar mode={aiMode} onModeChange={setAiMode} compact />
          </div>

          {/* תוכן הטאב */}
          <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,2.2fr),minmax(260px,1.4fr)]">
            {/* צד ימין: רשימות (צ׳אטים/התאמות/חיפוש) */}
            <div className="space-y-4">
              {tab === "open-chats" && (
                <OpenChatsList
                  items={openChats}
                  loading={loadingChats}
                  error={errChats}
                  onRefresh={loadOpenChats}
                  onOpenChat={(chatId, peerId) => {
                    const c = openChats.find((x) => x.chatId === chatId);
                    if (c) lastSelectedPeerRef.current = c.peer;
                    goToChat(peerId, chatId, undefined);
                  }}
                />
              )}

              {tab === "matches" && (
                <MatchesList
                  items={matches}
                  loading={loadingMatches}
                  error={errMatches}
                  onRefresh={loadMatches}
                  onOpenChatFromMatch={(matchId, peerId) => {
                    const m = matches.find((x) => x.matchId === matchId);
                    if (m) lastSelectedPeerRef.current = m.peer;
                    goToChat(peerId, undefined, matchId);
                  }}
                />
              )}

              {tab === "search" && (
                <SearchUsersBlock
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  searching={loadingSearch}
                  results={searchResults}
                  onSearch={handleSearch}
                  onOpenChat={(peerId) => {
                    const u = searchResults.find((x) => x.userId === peerId);
                    if (u) lastSelectedPeerRef.current = u;
                    goToChat(peerId);
                  }}
                />
              )}
            </div>

            {/* צד שמאל: פאנל AI + טיפים + דמו מצב שיחה */}
            <aside className="space-y-3">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/3 dark:bg-white/3 px-3 py-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    <div className="text-xs">
                      <div className="font-semibold">
                        מרכז השליטה של ה-AI בצ'אט
                      </div>
                      <div className="opacity-70">
                        ה-AI לא כותב במקומך – הוא מציע רעיונות, שומר על כבוד
                        הדדי ומתריע על דגלים אדומים.
                      </div>
                    </div>
                  </div>
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>

                <AiModeBar mode={aiMode} onModeChange={setAiMode} />

                <AiSuggestionsPanel
                  mode={aiMode}
                  currentPeer={currentPeer || undefined}
                  onApply={applyAiText}
                />
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 px-3 py-3 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <div className="font-semibold">טיפים לצ'אט מכבד</div>
                </div>
                <ul className="list-disc ms-5 space-y-1 opacity-85">
                  <li>
                    כתבו כמו שהייתם מדברים פנים אל פנים – אמיתי, לא רובוטי.
                  </li>
                  <li>הימנעו מלחץ – תנו לצד השני זמן לענות, במיוחד בהתחלה.</li>
                  <li>
                    שאלות פתוחות יוצרות עומק: "מה הכי חשוב לך", "מה נותן לך
                    כוח".
                  </li>
                  <li>
                    ה-AI יכול להציע רעיון, אבל אתם מחליטים מה לשלוח בפועל.
                  </li>
                </ul>
              </div>

              {isAdmin && (
                <div className="rounded-2xl border border-amber-400/70 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-3 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div className="font-semibold">
                      אזור אדמין · בדיקות / דיבאג
                    </div>
                  </div>
                  <div className="space-y-1 opacity-85">
                    <div>
                      <span className="font-semibold">סטטוס:</span> אדמין פעיל
                      (bypass gating לצ'אט/וידאו/סיכומים).
                    </div>
                    <div>
                      <span className="font-semibold">אזהרה:</span> במצב פרודקשן
                      ודאו שה-bypass מוגבל למנהלים בלבד.
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => loadOpenChats()}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-black/15 bg-white/80 dark:bg-neutral-900/80"
                      >
                        <RefreshCw className="h-3 w-3" />
                        רענון צ'אטים
                      </button>
                      <button
                        type="button"
                        onClick={() => loadMatches()}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-black/15 bg-white/80 dark:bg-neutral-900/80"
                      >
                        <RefreshCw className="h-3 w-3" />
                        רענון התאמות
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* פוטר קטן */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] opacity-70">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>
                לחיצה על התאמה או על משתמש בחיפוש – פותחת צ'אט 1-על-1. אין צורך
                לדעת מה זה peerId או מזהה פנימי.
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>מסך זה מוכן להרחבה לצ'אט וידאו / שיחות קול.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
