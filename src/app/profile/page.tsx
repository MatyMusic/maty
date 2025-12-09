// src/app/profile/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

/* ============================================================
   Types & Consts
   ============================================================ */
type Genre = "chabad" | "mizrahi" | "soft" | "fun";
type Strategy = "genre" | "gallery" | "upload" | "profile";
type Inferred = "single" | "married" | "unknown";
type MeLite = { ok: boolean; loggedIn: boolean; userId?: string | null };
type DateConsent = { ok: boolean; consented: boolean; at?: string | null };
type DateProfileStatus = {
  ok: boolean;
  profileId?: string | null;
  hasProfile?: boolean;
  optedIn?: boolean;
};

const STYLES: { key: Genre; label: string; img: string }[] = [
  { key: "chabad", label: "חסידי", img: "/assets/images/avatar-chabad.png" },
  { key: "mizrahi", label: "מזרחי", img: "/assets/images/avatar-mizrahi.png" },
  { key: "soft", label: "שקט", img: "/assets/images/avatar-soft.png" },
  { key: "fun", label: "מקפיץ", img: "/assets/images/avatar-fun.png" },
];

const isGenre = (g: any): g is Genre =>
  g === "chabad" || g === "mizrahi" || g === "soft" || g === "fun";

/* ============================================================
   Utils
   ============================================================ */
async function safeJson<T = any>(r: Response): Promise<T | null> {
  try {
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

// מסומן בלוקאל כשמבקרים ב-/maty-date
function hasVisitedMatyDate(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("matydate:visited") === "1";
}
function setVisitedMatyDate() {
  try {
    localStorage.setItem("matydate:visited", "1");
  } catch {}
}

/* ======= Avatar change announcer -> Header (event + BC + localStorage) ======= */
function announceAvatarChange(
  strategy: Strategy,
  url?: string | null,
  id?: string | null,
) {
  try {
    if (strategy === "upload" && url) {
      localStorage.setItem("mm:avatar:url", url);
    } else if (strategy !== "upload") {
      localStorage.removeItem("mm:avatar:url");
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent("mm:avatarChanged", {
        detail: { strategy, url: url ?? null, id: id ?? null },
      }),
    );
  } catch {}

  try {
    const bc = new BroadcastChannel("mm:avatar");
    bc.postMessage({
      type: "avatarChanged",
      strategy,
      url: url ?? null,
      id: id ?? null,
    });
    bc.close();
  } catch {}
}

/* ============================================================
   Tiny UI helpers
   ============================================================ */
function Toast({
  open,
  type,
  text,
  onClose,
}: {
  open: boolean;
  type: "success" | "error" | "info";
  text: string;
  onClose: () => void;
}) {
  if (!open) return null;
  const base =
    "fixed left-1/2 -translate-x-1/2 top-4 z-[4000] px-4 py-2 rounded-xl shadow-lg border text-sm animate-[mmSlideDown_.22s_ease-out]";
  const theme =
    type === "success"
      ? "bg-emerald-600 text-white border-emerald-500"
      : type === "error"
        ? "bg-rose-600 text-white border-rose-500"
        : "bg-sky-600 text-white border-sky-500";
  return (
    <button type="button" onClick={onClose} className={`${base} ${theme}`}>
      {text}
      <style jsx>{`
        @keyframes mmSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -6px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </button>
  );
}

function Section({
  title,
  children,
  hint,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 md:p-5 shadow-sm backdrop-blur">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {hint && <div className="text-xs opacity-70 mt-0.5">{hint}</div>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="grid gap-1 text-right">
      <span className="text-sm font-medium" {...(htmlFor ? { htmlFor } : {})}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({
  on,
  children,
  onClick,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-9 inline-flex items-center rounded-full border text-sm transition ${
        on
          ? "bg-black text-white border-black"
          : "border-black/10 hover:border-black/25"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <hr className="my-4 border-black/10 dark:border-white/10" />;
}

/* ============================================================
   Avatar Designer
   ============================================================ */
const BASES = ["circle", "squircle", "diamond", "hex"] as const;
const PALETTES = [
  ["#111827", "#0ea5e9", "#93c5fd", "#e5e7eb"],
  ["#1f2937", "#f59e0b", "#fde68a", "#fef3c7"],
  ["#0f172a", "#22c55e", "#86efac", "#e2e8f0"],
  ["#111827", "#ef4444", "#fca5a5", "#f3f4f6"],
];
const STICKERS = ["♪", "★", "❤", "✦", "⚡", "✿", "₪", "✺"];
type BaseKind = (typeof BASES)[number];

function AvatarDesigner({
  open,
  onClose,
  onApply,
  urlFromProfile,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
  urlFromProfile?: string | null;
}) {
  const [base, setBase] = useState<BaseKind>("circle");
  const [palette, setPalette] = useState(0);
  const [sticker, setSticker] = useState<string | null>("♪");
  const [initial, setInitial] = useState<string>("M");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = 256,
      H = 256;
    c.width = W;
    c.height = H;

    const [bg, p1, p2, fg] = PALETTES[palette];

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Base
    ctx.save();
    if (base === "circle") {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W / 2 - 8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = p1;
      ctx.fill();
    } else if (base === "squircle") {
      ctx.fillStyle = p1;
      const r = 64;
      ctx.beginPath();
      ctx.moveTo(r, 8);
      ctx.lineTo(W - r, 8);
      ctx.quadraticCurveTo(W - 8, 8, W - 8, r);
      ctx.lineTo(W - 8, H - r);
      ctx.quadraticCurveTo(W - 8, H - 8, W - r, H - 8);
      ctx.lineTo(r, H - 8);
      ctx.quadraticCurveTo(8, H - 8, 8, H - r);
      ctx.lineTo(8, r);
      ctx.quadraticCurveTo(8, 8, r, 8);
      ctx.closePath();
      ctx.fill();
    } else if (base === "diamond") {
      ctx.fillStyle = p1;
      ctx.beginPath();
      ctx.moveTo(W / 2, 8);
      ctx.lineTo(W - 8, H / 2);
      ctx.lineTo(W / 2, H - 8);
      ctx.lineTo(8, H / 2);
      ctx.closePath();
      ctx.fill();
    } else if (base === "hex") {
      ctx.fillStyle = p1;
      const r = W / 2 - 10;
      const cx = W / 2,
        cy = H / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // decoration
    ctx.strokeStyle = p2;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 3, Math.PI * 0.1, Math.PI * 1.4);
    ctx.stroke();

    // sticker
    if (sticker) {
      ctx.font = "64px system-ui, Apple Color Emoji, Segoe UI Emoji";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sticker, W * 0.78, H * 0.26);
    }

    // initial
    ctx.fillStyle = fg;
    ctx.font = "bold 100px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial.slice(0, 1).toUpperCase(), W / 2, H / 2 + 16);
  }, [open, base, palette, sticker, initial]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[5000]"
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,860px)] max-h-[88vh] overflow-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">מעצב אווטאר</h3>
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10"
          >
            ✕
          </button>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/80 dark:bg-neutral-900/70">
            <div className="text-sm font-semibold mb-1">בסיס</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {BASES.map((b) => (
                <Chip key={b} on={base === b} onClick={() => setBase(b)}>
                  {b}
                </Chip>
              ))}
            </div>

            <div className="text-sm font-semibold mb-1">צבעים</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {PALETTES.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPalette(i)}
                  className={`h-9 px-2 rounded-full border ${palette === i ? "border-black" : "border-black/10"}`}
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full mr-1"
                    style={{ background: p[1] }}
                  />
                  <span
                    className="inline-block h-3 w-3 rounded-full mr-1"
                    style={{ background: p[2] }}
                  />
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: p[3] }}
                  />
                </button>
              ))}
            </div>

            <div className="text-sm font-semibold mb-1">מדבקה</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {STICKERS.map((s) => (
                <Chip key={s} on={sticker === s} onClick={() => setSticker(s)}>
                  {s}
                </Chip>
              ))}
              <Chip on={!sticker} onClick={() => setSticker(null)}>
                ללא
              </Chip>
            </div>

            <div className="text-sm font-semibold mb-1">אות ראשונה</div>
            <input
              value={initial}
              onChange={(e) => setInitial(e.target.value.slice(0, 2))}
              className="w-full h-10 rounded-lg border px-3 bg-white/95 dark:bg-neutral-900/90"
            />
          </div>

          <div className="grid gap-3 content-start">
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-3">
              <div className="text-sm opacity-80 mb-2">תצוגה</div>
              <canvas
                ref={canvasRef}
                className="w-[256px] h-[256px] rounded-xl border mx-auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const url = canvasRef.current?.toDataURL("image/png");
                  if (url) onApply(url);
                }}
                className="h-11 px-4 rounded-xl bg-violet-600 text-white font-semibold shadow"
              >
                שמור כאווטאר
              </button>
              {urlFromProfile && (
                <button
                  onClick={onClose}
                  className="h-11 px-4 rounded-xl border border-black/10 dark:border-white/10"
                >
                  ביטול
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Dating Form (unchanged UI, improved typing)
   ============================================================ */
function DatingForm({ onSave }: { onSave: (payload: any) => void }) {
  const [about, setAbout] = useState("");
  const [gender, setGender] = useState("other");
  const [looking, setLooking] = useState("serious");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [languages, setLanguages] = useState<string>("");
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(40);
  const [hasPhoto, setHasPhoto] = useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          about,
          gender,
          looking_for: looking,
          city,
          country,
          languages: languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ageMin,
          ageMax,
          hasPhoto,
        });
      }}
      className="grid gap-3"
    >
      <Field label="קצת עליי">
        <textarea
          className="min-h-[92px] rounded-xl border px-3 py-2 bg-white/95 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="מין">
          <select
            className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
            <option value="other">אחר</option>
          </select>
        </Field>
        <Field label="מחפש/ת">
          <select
            className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            value={looking}
            onChange={(e) => setLooking(e.target.value)}
          >
            <option value="serious">קשר רציני</option>
            <option value="marriage">נישואין</option>
            <option value="friendship">חברות</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="עיר">
          <input
            className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
        <Field label="מדינה">
          <input
            className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </Field>
      </div>

      <Field label="שפות (מופרדות בפסיק)">
        <input
          className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="hebrew, english"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="גיל מינ׳">
          <input
            type="number"
            className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            value={ageMin}
            onChange={(e) => setAgeMin(parseInt(e.target.value || "0") || 18)}
          />
        </Field>
        <Field label="גיל מק׳">
          <input
            type="number"
            className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
            value={ageMax}
            onChange={(e) => setAgeMax(parseInt(e.target.value || "0") || 18)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hasPhoto}
          onChange={(e) => setHasPhoto(e.target.checked)}
        />
        <span className="text-sm">הצג התאמות עם תמונה בלבד</span>
      </label>

      <div className="pt-1 flex justify-end">
        <button className="h-10 px-4 rounded-xl bg-amber-600 text-white font-semibold">
          שמור
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Smart MATY-DATE Shortcut (only if consented)
   ============================================================ */
function SmartDateShortcut({
  consented,
  className = "",
}: {
  consented: boolean;
  className?: string;
}) {
  const [meLite, setMeLite] = useState<MeLite | null>(null);
  const [status, setStatus] = useState<DateProfileStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meR, stR] = await Promise.allSettled([
          fetch("/api/auth/me-lite", {
            cache: "no-store",
            credentials: "same-origin",
          }),
          fetch("/api/date/profile/status", { cache: "no-store" }),
        ]);
        if (!cancelled) {
          if (meR.status === "fulfilled")
            setMeLite(
              (await meR.value.json().catch(() => null)) as MeLite | null,
            );
          if (stR.status === "fulfilled")
            setStatus(
              (await stR.value
                .json()
                .catch(() => null)) as DateProfileStatus | null,
            );
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!consented) {
    return (
      <span
        className={[
          "inline-flex items-center h-9 px-3 rounded-full text-xs font-semibold border border-amber-400/40 text-amber-700/80 bg-amber-50/70",
          className,
        ].join(" ")}
        title="הקיצור מוצג רק למשתמשים שהסכימו לחשיפה ב-MATY-DATE"
        aria-label="קיצור MATY-DATE נעול עד הסכמה"
      >
        🔒 קיצור MATY-DATE זמין לאחר הסכמה
      </span>
    );
  }

  const userId = meLite?.userId || undefined;
  const profileId = status?.profileId || userId;
  const href = profileId
    ? `/date/profile/${encodeURIComponent(profileId)}`
    : "/date/matches";

  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center h-10 px-4 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600 text-white text-sm font-extrabold shadow",
        className,
      ].join(" ")}
      title="פרופיל(ים) MATY-DATE"
      aria-label="מעבר מהיר לפרופילים ב-MATY-DATE"
    >
      💞 לפרופילי MATY-DATE
    </Link>
  );
}

/* ============================================================
   Main Page
   ============================================================ */
export default function ProfilePagePro() {
  // ✅ כולל update כדי לרענן Header אחרי שינוי תמונה
  const { status, data: session, update } = useSession();

  /** ----- Hooks (אל תשנו סדר/תנאים) ----- */
  // מצב כללי
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // פרופיל משתמש
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredGenres, setPreferredGenres] = useState<Genre[]>([]);
  const [lastPlayedGenre, setLastPlayedGenre] = useState<Genre | null>(null);

  // אווטאר
  const [avatarStrategy, setStrategy] = useState<Strategy>("genre");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // מעצב אווטאר
  const [designerOpen, setDesignerOpen] = useState(false);

  // MATY-DATE Gate + אינפרנס + הסכמה
  const [dateGate, setDateGate] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [infBusy, setInfBusy] = useState(false);
  const [inferred, setInferred] = useState<{
    guess: Inferred;
    score: number;
    reasons: string[];
    updatedAt?: string;
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    open: boolean;
    type: "success" | "error" | "info";
    text: string;
  }>({ open: false, type: "success", text: "" });

  // Refs (חייבים להיות לפני כל early-return)
  const didInitRef = useRef(false);
  const infAbort = useRef<AbortController | null>(null);

  // אפקטים
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((t) => ({ ...t, open: false })), 2600);
    return () => clearTimeout(t);
  }, [toast.open]);

  // ניקוי בקשת אינפרנס תלויה בזמן יציאה מהעמוד
  useEffect(() => {
    return () => {
      try {
        infAbort.current?.abort();
      } catch {}
    };
  }, []);

  // טעינת נתוני פרופיל + סטטוס דייט/הסכמה
  useEffect(() => {
    if (status !== "authenticated") return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    const ac = new AbortController();
    (async () => {
      try {
        const [meR, consentR] = await Promise.allSettled([
          fetch("/api/me", { cache: "no-store", signal: ac.signal }),
          fetch("/api/date/consent", { cache: "no-store", signal: ac.signal }),
        ]);

        if (meR.status === "fulfilled") {
          const r = meR.value;
          const j = await safeJson<any>(r);
          if (r.ok && j?.ok && j.user) {
            setName(j.user.name || "");
            setPhone(j.user.phone || "");
            setPreferredGenres(j.user.preferredGenres || []);
            setLastPlayedGenre(j.user.lastPlayedGenre || null);
            setStrategy(j.user.avatarStrategy || "genre");
            setAvatarId(j.user.avatarId || null);
            setAvatarUrl(j.user.avatarUrl || null);
            if (typeof j.user?.dateConsent === "boolean") {
              setConsent(j.user.dateConsent);
            }
          }
        }

        if (consentR.status === "fulfilled") {
          const cj = (await safeJson<DateConsent>(consentR.value)) || {
            ok: false,
            consented: false,
          };
          if (cj?.ok) {
            setConsent(!!cj.consented);
            setConsentAt(cj.at || null);
          }
        }
      } catch {
        // swallow
      } finally {
        setLoading(false);
        setDateGate(hasVisitedMatyDate());
      }
    })();

    return () => ac.abort();
  }, [status]);

  // נגזרות
  const oauthImage = (session?.user as any)?.image || null;
  const currentGenre: Genre = useMemo(() => {
    if (lastPlayedGenre && isGenre(lastPlayedGenre)) return lastPlayedGenre;
    if (preferredGenres[0] && isGenre(preferredGenres[0]))
      return preferredGenres[0];
    return "soft";
  }, [lastPlayedGenre, preferredGenres]);

  const previewSrc = useMemo(() => {
    if (avatarStrategy === "upload" && avatarUrl) return avatarUrl;
    if (avatarStrategy === "gallery" && avatarId)
      return `/assets/images/${avatarId}.png`;
    if (avatarStrategy === "profile" && oauthImage) return oauthImage;
    return STYLES.find((s) => s.key === currentGenre)?.img || STYLES[2].img;
  }, [avatarStrategy, avatarUrl, avatarId, oauthImage, currentGenre]);

  /** ----- early-return ----- */
  if (status !== "authenticated")
    return (
      <div className="p-6 text-center" dir="rtl">
        יש להתחבר.
        <div className="mt-3 text-sm opacity-70">
          אפשר להתחבר דרך עמוד ההתחברות.
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="p-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/3 bg-black/5 dark:bg-white/10 rounded" />
          <div className="h-24 w-full bg-black/5 dark:bg-white/10 rounded" />
          <div className="grid md:grid-cols-2 gap-5">
            <div className="h-72 bg-black/5 dark:bg-white/10 rounded" />
            <div className="h-72 bg-black/5 dark:bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );

  /** ----- פעולות ----- */
  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        name,
        phone,
        preferredGenres,
        lastPlayedGenre,
        avatarStrategy,
        avatarId,
        avatarUrl,
      };
      const r = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await safeJson(r);
      if (!r.ok || !(j as any)?.ok)
        throw new Error((j as any)?.error || "שמירה נכשלה");

      // אם יש תמונה שהועלתה – לדאוג שגם ה-Header יתעדכן מיידית
      if (avatarStrategy === "upload" && avatarUrl) {
        try {
          await update({ image: avatarUrl });
        } catch {}
      }

      announceAvatarChange(avatarStrategy, avatarUrl, avatarId);
      setToast({ open: true, type: "success", text: "נשמר בהצלחה ✅" });
    } catch (e: any) {
      setToast({
        open: true,
        type: "error",
        text: e?.message || "שגיאה בשמירה",
      });
    } finally {
      setSaving(false);
    }
  }

  // ⚠️ משאיר את ה־API הקיים שלך: POST /api/user/avatar שמחזיר { ok:true, url }
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setToast({ open: true, type: "error", text: "נא לבחור קובץ תמונה" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setToast({ open: true, type: "error", text: "הקובץ גדול מ־5MB" });
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/user/avatar", { method: "POST", body: fd });
      const j = await safeJson(r);
      if (r.ok && (j as any)?.ok && (j as any)?.url) {
        const url = String((j as any).url);
        setAvatarUrl(url);
        setStrategy("upload");
        announceAvatarChange("upload", url, null);

        // ✅ רענון מיידי של תמונת המשתמש ב־Header
        try {
          await update({ image: url });
        } catch {}

        setToast({ open: true, type: "success", text: "התמונה עלתה ✓" });
      } else {
        setToast({
          open: true,
          type: "error",
          text: `העלאה נכשלה (${(j as any)?.error || r.status})`,
        });
      }
    } catch {
      setToast({ open: true, type: "error", text: "שגיאת רשת בזמן העלאה" });
    }
  }

  // אם נשאר אצלך DELETE /api/user/avatar – נשתמש בו, וגם נרענן Session
  async function resetToDefault() {
    try {
      const r = await fetch("/api/user/avatar", { method: "DELETE" });
      const j = await safeJson(r);
      if (r.ok && (j as any)?.ok) {
        setStrategy("genre");
        setAvatarUrl(null);
        setAvatarId(null);
        announceAvatarChange("genre", null, null);

        // ✅ לרוקן גם את תמונת ה־OAuth בהדר (אם הייתה בשימוש)
        try {
          await update({ image: null as any });
        } catch {}

        setToast({ open: true, type: "success", text: "חזר לברירת מחדל" });
      } else {
        setToast({
          open: true,
          type: "error",
          text: `מחיקה נכשלה (${r.status})`,
        });
      }
    } catch {
      setToast({ open: true, type: "error", text: "שגיאת רשת" });
    }
  }

  function useOAuthProfile() {
    const oi = (session?.user as any)?.image;
    if (!oi) return;
    setStrategy("profile");
    setAvatarUrl(oi);
    announceAvatarChange("profile", oi, null);
    // גם כאן – לוודא שה־Header “יודע”
    update({ image: oi }).catch(() => {});
  }
  function switchToGallery() {
    setStrategy("gallery");
    setAvatarUrl(null);
    announceAvatarChange("gallery", null, avatarId);
  }
  function selectGallery(id: string) {
    setAvatarId(id);
    setStrategy("gallery");
    announceAvatarChange("gallery", null, id);
  }

  // ✅ שיפור ניתוח פרופיל: AbortController + הודעות ברורות + תאריך עדכון
  async function inferStatus() {
    if (!consent) {
      setToast({ open: true, type: "error", text: "יש לתת הסכמה לפני בדיקה" });
      return;
    }
    try {
      infAbort.current?.abort();
    } catch {}
    const ac = new AbortController();
    infAbort.current = ac;
    setInfBusy(true);
    try {
      const r = await fetch("/api/date/infer-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
        signal: ac.signal,
      });
      const j = await safeJson<{
        ok: boolean;
        guess?: Inferred;
        score?: number;
        reasons?: string[];
        updatedAt?: string;
        error?: string;
      }>(r);

      if (!j?.ok) throw new Error(j?.error || "הניתוח נכשל");

      const guess: Inferred = j.guess || "unknown";
      const score = Number(j.score || 0);
      const reasons: string[] = Array.isArray(j.reasons) ? j.reasons : [];
      setInferred({
        guess,
        score,
        reasons,
        updatedAt: j.updatedAt || new Date().toISOString(),
      });
      setToast({ open: true, type: "info", text: "עודכן ניתוח סטטוס" });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setToast({ open: true, type: "info", text: "בוטל" });
      } else {
        setToast({
          open: true,
          type: "error",
          text: err?.message || "שגיאה בבקשת הניתוח",
        });
      }
    } finally {
      setInfBusy(false);
      infAbort.current = null;
    }
  }

  async function saveDatingProfile(payload: any) {
    try {
      const r = await fetch("/api/date/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await safeJson(r);
      if (r.ok && (j as any)?.ok)
        setToast({ open: true, type: "success", text: "פרופיל הדייט נשמר" });
      else
        setToast({
          open: true,
          type: "error",
          text: (j as any)?.error || "שמירה נכשלה",
        });
    } catch {
      setToast({ open: true, type: "error", text: "שגיאת רשת" });
    }
  }

  /* ============================================================
     UI
     ============================================================ */
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6" dir="rtl">
      <Toast
        open={toast.open}
        type={toast.type}
        text={toast.text}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-right">
          הפרופיל שלי
        </h1>

        {/* ✅ קיצור חכם ל-MATY-DATE (רק למי שהסכים בהרשמה/באפליקציה) */}
        <SmartDateShortcut consented={!!consent} />
      </div>

      {/* כרטיס סיכום עליון */}
      <div className="rounded-2xl border border-amber-400/40 dark:border-amber-300/25 bg-gradient-to-br from-amber-50/80 to-white dark:from-neutral-900 dark:to-neutral-950 p-4 md:p-5 mb-5">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="avatar"
            className="h-16 w-16 rounded-full object-cover border shadow"
          />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold truncate">
              {name || (session?.user?.name as string) || "משתמש"}
            </div>
            <div className="text-sm opacity-75 truncate">
              {session?.user?.email}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              {preferredGenres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center h-6 px-2 rounded-full border border-amber-400/40 bg-white/60 dark:bg-neutral-900/60"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setDesignerOpen(true)}
              className="h-10 px-4 rounded-xl bg-violet-600 text-white font-semibold shadow"
            >
              מעצב אווטאר
            </button>
            <button
              onClick={resetToDefault}
              className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10"
            >
              ברירת מחדל
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* פרטים כלליים + מוזיקה */}
        <Section title="פרטים כלליים" hint="עדכון פרטים אישיים וסגנונות">
          <div className="grid gap-3">
            <Field label="שם" htmlFor="name">
              <input
                id="name"
                className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="טלפון" htmlFor="phone">
              <input
                id="phone"
                className="h-11 rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </div>

          <Divider />

          <div className="text-right">
            <div className="font-semibold mb-2">סגנונות מועדפים</div>
            <div className="grid grid-cols-4 gap-2">
              {STYLES.map((s) => {
                const on = preferredGenres.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      const now = new Set(preferredGenres);
                      if (now.has(s.key)) now.delete(s.key);
                      else now.add(s.key);
                      setPreferredGenres(Array.from(now));
                      if (!lastPlayedGenre) setLastPlayedGenre(s.key);
                    }}
                    className={`rounded-xl border p-2 transition ${on ? "border-violet-500 ring-1 ring-violet-500" : "border-black/10 hover:border-black/25"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt="" className="h-10 w-10 mx-auto" />
                    <div className="text-xs mt-1">{s.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-right mt-3">
            <div className="font-semibold mb-1">ז׳אנר אחרון שהתנגן</div>
            <div className="flex gap-2 flex-wrap">
              {STYLES.map((s) => (
                <Chip
                  key={s.key}
                  on={lastPlayedGenre === s.key}
                  onClick={() => setLastPlayedGenre(s.key)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>
        </Section>

        {/* תמונת פרופיל */}
        <Section title="תמונת פרופיל" hint="בחר מקור/העלה או עצב בעצמך">
          <div className="flex items-center gap-3 justify-end flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="strategy"
                checked={avatarStrategy === "genre"}
                onChange={() => {
                  setStrategy("genre");
                  announceAvatarChange("genre", null, null);
                }}
              />
              <span>לפי ז׳אנר</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="strategy"
                checked={avatarStrategy === "gallery"}
                onChange={switchToGallery}
              />
              <span>מהגלריה</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="strategy"
                checked={avatarStrategy === "upload"}
                onChange={() => {
                  setStrategy("upload");
                  if (avatarUrl)
                    announceAvatarChange("upload", avatarUrl, null);
                }}
              />
              <span>העלאה</span>
            </label>
            {(session?.user as any)?.image && (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="strategy"
                  checked={avatarStrategy === "profile"}
                  onChange={useOAuthProfile}
                />
                <span>תמונת הפרופיל</span>
              </label>
            )}
          </div>

          {avatarStrategy === "gallery" && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                "avatar-chabad",
                "avatar-mizrahi",
                "avatar-soft",
                "avatar-fun",
              ].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectGallery(id)}
                  className={`rounded-xl border p-2 ${avatarId === id ? "border-violet-500 ring-1 ring-violet-500" : "border-black/10"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/images/${id}.png`}
                    alt=""
                    className="h-10 w-10 mx-auto"
                  />
                  <div className="text-[10px] mt-1 text-center">{id}</div>
                </button>
              ))}
            </div>
          )}

          {avatarStrategy === "upload" && (
            <div className="text-right space-y-2 mt-3">
              <input type="file" accept="image/*" onChange={onUpload} />
              <div className="text-xs opacity-70">מקסימום 5MB.</div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="text-right">
              <div className="opacity-70 text-sm mb-1">תצוגה מקדימה</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="h-16 w-16 rounded-full object-cover border"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDesignerOpen(true)}
                className="h-10 px-4 rounded-xl bg-violet-600 text-white font-semibold shadow"
              >
                מעצב אווטאר
              </button>
              <button
                onClick={resetToDefault}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10"
              >
                ברירת מחדל
              </button>
            </div>
          </div>
        </Section>
      </div>

      {/* MATY-DATE Gate */}
      <div className="mt-6">
        <Section
          title="MATY-DATE — התאמות חכמות"
          hint={dateGate ? "זמין לאחר ביקור ב־MATY-DATE" : "נדרש ביקור מקדים"}
          actions={
            consent ? (
              <span className="inline-flex items-center gap-2 text-xs px-2.5 h-7 rounded-full bg-emerald-600/10 text-emerald-700 border border-emerald-600/20">
                ✅ קיים אישור לחשיפה{" "}
                {consentAt
                  ? `• ${new Date(consentAt).toLocaleDateString("he-IL")}`
                  : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-xs px-2.5 h-7 rounded-full bg-slate-500/10 text-slate-700 border border-slate-500/20">
                ⚠ ללא אישור לחשיפה
              </span>
            )
          }
        >
          {!dateGate ? (
            <div className="text-right">
              <p className="mb-2">
                כדי לפתוח את מודול הדייטים בפרופיל, יש להיכנס פעם אחת לעמוד{" "}
                <Link href="/maty-date" className="underline text-amber-700">
                  MATY-DATE
                </Link>
                .
              </p>
              <button
                onClick={() => {
                  setVisitedMatyDate();
                  setDateGate(true);
                }}
                className="h-10 px-4 rounded-xl bg-amber-600 text-white font-semibold"
              >
                סימון ניסיוני: ביקרתי ב־MATY-DATE
              </button>
              <div className="text-xs opacity-70 mt-1">
                בפרודקשן זה יתבצע אוטומטית בעת כניסה ל־“/maty-date”.
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {/* אינפרנס בהסכמה */}
              <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
                <div className="flex items-center justify-between">
                  <div className="font-semibold mb-2">סטטוס זוגי (חכם)</div>
                  <SmartDateShortcut consented={!!consent} />
                </div>
                <p className="text-sm opacity-80 mb-2">
                  בהסכמה בלבד, ננתח אותות ציבוריים (API ייעודי) כדי לשער אם את/ה
                  רווק/ה או נשוי/אה. אין משיכת נתונים בלי הסכמה.
                </p>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span className="text-sm">
                    אני מסכים/ה לחשיפה לצורך התאמות ולהרצת ניתוח סטטוס.
                  </span>
                </label>
                <button
                  disabled={!consent || infBusy}
                  onClick={inferStatus}
                  className="h-10 px-4 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50"
                >
                  {infBusy ? "מנתח…" : "בצע ניתוח"}
                </button>
                {inferred && (
                  <div className="mt-3 text-sm">
                    <div className="mb-1">
                      ניחוש:&nbsp;
                      <b>
                        {inferred.guess === "single"
                          ? "רווק/ה"
                          : inferred.guess === "married"
                            ? "נשוי/אה"
                            : "לא ידוע"}
                      </b>{" "}
                      ({Math.round((inferred.score ?? 0) * 100)}%)
                    </div>
                    {inferred.updatedAt && (
                      <div className="text-xs opacity-70 mb-1">
                        עודכן:{" "}
                        {new Date(inferred.updatedAt).toLocaleString("he-IL")}
                      </div>
                    )}
                    {!!inferred.reasons?.length && (
                      <ul className="list-disc pr-5 mt-1 opacity-80">
                        {inferred.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* טופס דייטינג */}
              <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-900/70">
                <div className="flex items-center justify-between">
                  <div className="font-semibold mb-2">פרופיל דייט</div>
                  <Link
                    href="/date/matches"
                    className="text-sm underline opacity-80 hover:opacity-100"
                  >
                    לראות התאמות
                  </Link>
                </div>
                <DatingForm onSave={saveDatingProfile} />
              </div>
            </div>
          )}
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="btn bg-black text-white disabled:opacity-60 h-11 px-6 rounded-xl"
          disabled={saving}
          onClick={saveProfile}
        >
          {saving ? "שומר…" : "שמור"}
        </button>
      </div>

      {/* Designer Modal */}
      <AvatarDesigner
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        urlFromProfile={avatarUrl}
        onApply={(url) => {
          setDesignerOpen(false);
          setAvatarUrl(url);
          setStrategy("upload");
          announceAvatarChange("upload", url, null);
          // אם שמרת dataURL בצד שרת – אפשר גם כאן update({ image: url })
          setToast({ open: true, type: "success", text: "אווטאר נשמר ✓" });
        }}
      />
    </div>
  );
}
