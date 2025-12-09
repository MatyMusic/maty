"use client";

/* =============================================================================
   MATY-DATE — DateProfileForm (שדרוג העלאות: פרוגרס, D&D, Paste, מצלמה, ביטול)
   - RTL + עברית
   - Stepper + Progress + Toast
   - אימותים חיים
   - אוטו־סייב עם דיבאונס, מניעת לולאות רנדר
   - העלאת קבצים מרובים עם פס התקדמות, גרירה ושחרור, הדבקה (Paste), מצלמה, ביטול
   - תצוגת “ממתינים”, מחיקה והגדרת Avatar
   - נקודת העלאה: POST /api/date/upload  ->  { url: string }
   ============================================================================= */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================ Types ============================ */
type Level = "strict" | "partial" | "none";
type Gender = "male" | "female" | "other" | null;
type Goal = "serious" | "marriage" | "friendship" | null;

export type ProfilePatch = {
  displayName: string | null;
  birthDate: string | null; // YYYY-MM-DD
  gender: Gender;
  country: string | null;
  city: string | null;
  languages: string[];
  judaism_direction?: string | null;
  kashrut_level?: Level | null;
  shabbat_level?: Level | null;
  goals?: Goal;
  about_me?: string | null;
  avatarUrl?: string | null;
  photos?: string[]; // גלריה (URLs)
};

type Props = {
  initialProfile?: Partial<ProfilePatch>;
  onChange?: (patch: Partial<ProfilePatch>) => void;
  onSaved?: (full: ProfilePatch) => void;
};

type PendingUpload = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0-100
  previewUrl?: string; // URL.createObjectURL
};

/* ============================ Utils ============================ */
const cx = (...a: Array<string | false | null | undefined>) =>
  a.filter(Boolean).join(" ");

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const isDOB = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

const calcAge = (dob?: string | null) => {
  if (!isDOB(dob)) return null;
  const [y, m, d] = (dob as string).split("-").map((x) => parseInt(x));
  const now = new Date();
  let age = now.getFullYear() - y;
  const mNow = now.getMonth() + 1;
  const dNow = now.getDate();
  if (mNow < m || (mNow === m && dNow < d)) age--;
  return age;
};

const capWords = (s: string) =>
  s.replace(/\S+/g, (w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w));

/* הצעות ערים */
const CITIES_IL = [
  "ירושלים",
  "תל אביב",
  "בני ברק",
  "פתח תקווה",
  "ביתר עילית",
  "בית שמש",
  "אלעד",
  "מודיעין עילית",
  "נתניה",
  "חיפה",
];
const CITIES_US = ["New York", "Los Angeles", "Chicago", "Miami", "Brooklyn"];

/* מגבלות תמונות */
const MAX_PHOTOS = 12;
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/* ============================ Toast מינימלי ============================ */
function Toast({
  open,
  kind,
  text,
  onClose,
}: {
  open: boolean;
  kind: "ok" | "err" | "info";
  text: string;
  onClose: () => void;
}) {
  if (!open) return null;
  const palette =
    kind === "ok"
      ? "bg-emerald-600 border-emerald-500"
      : kind === "err"
      ? "bg-rose-600 border-rose-500"
      : "bg-violet-600 border-violet-500";

  return (
    <button
      type="button"
      onClick={onClose}
      className={cx(
        "fixed left-1/2 -translate-x-1/2 top-4 z-[4000] px-4 py-2 rounded-xl shadow-lg border text-sm text-white",
        palette
      )}
      title="סגור"
    >
      {text}
    </button>
  );
}

/* ============================ Stepper + Progress ============================ */
const STEPS = [
  { key: "info", title: "פרטים אישיים", sub: "שם, תאריך לידה, מיקום" },
  { key: "values", title: "ערכים ומטרות", sub: "זרם/שבת/כשרות/מטרה" },
  { key: "bio", title: "עליי ותמונות", sub: "העלאה, הדבקה, גרירה ובחירה" },
] as const;

function Stepper({
  current,
  doneFlags,
  percent,
  onJump,
}: {
  current: number;
  doneFlags: boolean[];
  percent: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="mx-auto max-w-5xl px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <ul className="flex items-stretch gap-2 overflow-x-auto pr-1">
            {STEPS.map((s, i) => {
              const active = i === current;
              const done = !!doneFlags[i];
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => onJump(i)}
                    className={cx(
                      "rounded-2xl border px-4 py-3 text-right",
                      "bg-white/80 dark:bg-neutral-900/70",
                      "border-black/10 dark:border-white/10",
                      active &&
                        "ring-2 ring-pink-500/30 border-pink-500/50 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cx(
                          "grid place-items-center size-6 rounded-full text-xs font-semibold",
                          done
                            ? "bg-emerald-600 text-white"
                            : active
                            ? "bg-pink-600 text-white"
                            : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        )}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <div className="grid">
                        <span className="text-sm font-semibold">{s.title}</span>
                        <span className="text-xs text-neutral-500">
                          {s.sub}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* טבעת התקדמות */}
          <div className="shrink-0 grid place-items-center">
            <div className="relative size-12">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#ec4899 ${Math.max(
                    3,
                    percent
                  )}%, #e5e7eb 0)`,
                }}
                aria-hidden
              />
              <div className="absolute inset-1 bg-white dark:bg-neutral-950 rounded-full grid place-items-center text-xs font-semibold">
                {percent}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-l from-transparent via-black/10 dark:via-white/10 to-transparent" />
    </div>
  );
}

function ProgressPanel({
  percent,
  missing,
  minOK = 60,
}: {
  percent: number;
  missing: string[];
  minOK?: number;
}) {
  const ok = percent >= minOK;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">
          התקדמות פרופיל: <span className="text-pink-600">{percent}%</span>
        </div>
        <div
          className={cx(
            "text-xs rounded-full px-3 py-1 border",
            ok
              ? "bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40"
              : "bg-amber-50/70 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40"
          )}
        >
          {ok ? "במסלול הירוק להתאמות" : `נדרשים לפחות ${minOK}%`}
        </div>
      </div>

      <div className="relative w-full h-3 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 overflow-hidden">
        <div
          className="h-full bg-pink-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      {missing.length > 0 && (
        <details className="mt-1">
          <summary className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
            חסר/ים ({missing.length}) — לחץ/י להצגה
          </summary>
          <ul className="mt-1 list-disc pr-6 text-xs text-neutral-600 dark:text-neutral-400">
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* ============================ Controls ============================ */
function Field({
  label,
  required,
  hint,
  error,
  success,
  id,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  success?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        <span>{label}</span>
        {required && (
          <span className="text-pink-600 dark:text-pink-400" aria-hidden>
            *
          </span>
        )}
        {success && !error && (
          <span
            className="ml-1 inline-flex items-center text-emerald-600 text-xs"
            aria-label="תקין"
            title="תקין"
          >
            ✓
          </span>
        )}
      </label>
      {hint && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
      )}
      <div>{children}</div>
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cx(
        "w-full h-11 rounded-xl px-3 bg-white/90 dark:bg-neutral-900/90",
        "border border-black/10 dark:border-white/10",
        "outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50",
        "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
        "text-neutral-900 dark:text-neutral-100",
        className
      )}
    />
  );
}

function Select<T extends string | null>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: NonNullable<T>; label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={(value ?? "") as string}
        onChange={(e) => onChange((e.target.value || null) as T)}
        className={cx(
          "w-full h-11 appearance-none rounded-xl px-3 bg-white/90 dark:bg-neutral-900/90",
          "border border-black/10 dark:border-white/10",
          "outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50",
          "text-neutral-900 dark:text-neutral-100"
        )}
      >
        <option value="">{placeholder || "בחר/י"}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400"
      >
        ▾
      </span>
    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cx(
        "w-full min-h-[120px] rounded-xl px-3 py-2 bg-white/90 dark:bg-neutral-900/90",
        "border border-black/10 dark:border-white/10",
        "outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50",
        "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
        "text-neutral-900 dark:text-neutral-100 resize-vertical",
        className
      )}
    />
  );
}

/* ============================ Uploader ============================ */
/** העלאה עם XHR כדי לקבל התקדמות (onprogress). מחזיר Promise ל-URL, ואת ה-XHR לביטול. */
function startUploadWithProgress(
  file: File,
  onProgress: (pct: number) => void
): { xhr: XMLHttpRequest; done: Promise<string> } {
  const xhr = new XMLHttpRequest();
  const done = new Promise<string>((resolve, reject) => {
    xhr.open("POST", "/api/date/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          const text = xhr.responseText || "";
          const j = JSON.parse(text);
          if (xhr.status >= 200 && xhr.status < 300 && j?.url) {
            resolve(j.url as string);
          } else {
            reject(new Error(j?.error || `שגיאה בהעלאה (HTTP ${xhr.status})`));
          }
        } catch {
          reject(new Error(`שגיאה בהעלאה (HTTP ${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("שגיאת רשת בהעלאה"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });

  return { xhr, done };
}

function PendingGrid({
  items,
  onCancel,
}: {
  items: PendingUpload[];
  onCancel: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((u) => (
        <div
          key={u.id}
          className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-2"
        >
          {u.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={u.previewUrl}
              alt={u.name}
              className="aspect-square w-full object-cover rounded-lg"
            />
          ) : (
            <div className="aspect-square w-full rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center text-xs">
              {u.name}
            </div>
          )}
          <div className="mt-2 h-2 rounded bg-neutral-200/80 dark:bg-neutral-800/80 overflow-hidden">
            <div
              className="h-full bg-pink-500 transition-[width]"
              style={{ width: `${u.progress}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="opacity-70">{u.progress}%</span>
            <button
              type="button"
              onClick={() => onCancel(u.id)}
              className="px-2 py-0.5 rounded-lg border bg-white/90 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:text-rose-600"
            >
              ביטול
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Gallery({
  photos,
  avatarUrl,
  onSetAvatar,
  onRemove,
  onReorder,
}: {
  photos: string[];
  avatarUrl?: string | null;
  onSetAvatar: (url: string) => void;
  onRemove: (url: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const dragIndexRef = React.useRef<number | null>(null);

  function onDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
    dragIndexRef.current = i;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>, i: number) {
    e.preventDefault();
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from == null || from === i) return;
    onReorder(from, i);
  }

  if (!photos?.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((url, i) => {
        const isAvatar = avatarUrl === url;
        return (
          <div
            key={url}
            className={cx(
              "group relative overflow-hidden rounded-xl border p-1",
              "bg-white/90 dark:bg-neutral-900/70",
              isAvatar
                ? "border-emerald-400 ring-2 ring-emerald-300/50"
                : "border-black/10 dark:border-white/10"
            )}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, i)}
            title="גרור/י כדי לשנות סדר"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="photo"
              className="aspect-square w-full object-cover rounded-lg"
            />
            <div className="absolute inset-x-0 bottom-0 p-1.5 flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition">
              <button
                type="button"
                onClick={() => onSetAvatar(url)}
                className={cx(
                  "text-[11px] px-2 py-1 rounded-lg border",
                  isAvatar
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-white/90 dark:bg-neutral-900/80 border-black/10 dark:border-white/10"
                )}
                title="קבע כתמונת פרופיל"
              >
                {isAvatar ? "Avatar ✓" : "קבע Avatar"}
              </button>
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="text-[11px] px-2 py-1 rounded-lg border bg-white/90 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:text-rose-600"
                title="מחק"
              >
                מחק
              </button>
            </div>
            <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* תגיות שפה */
function LangTags({
  value,
  onChange,
}: {
  value: string[];
  onChange: (langs: string[]) => void;
}) {
  const [input, setInput] = React.useState("");
  const suggestions = React.useMemo(
    () =>
      ["עברית", "אנגלית", "רוסית", "ספרדית", "צרפתית", "ערבית"].filter(
        (x) =>
          input &&
          x.toLowerCase().includes(input.trim().toLowerCase()) &&
          !value.includes(x)
      ),
    [input, value]
  );

  function add(raw: string) {
    const t = raw.trim();
    if (!t) return;
    const norm = t.replace(/\s+/g, " ");
    if (value.includes(norm)) return;
    onChange([...value, norm]);
    setInput("");
  }
  function remove(v: string) {
    onChange(value.filter((x) => x !== v));
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 px-3 h-8 text-sm"
          >
            <span className="font-medium">{t}</span>
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-neutral-400 hover:text-rose-600"
              title="הסר"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            value.length ? "הוספת שפה…" : "לדוגמה: עברית, אנגלית (Enter)"
          }
          className="flex-1 min-w-[160px] h-8 bg-transparent outline-none placeholder:text-neutral-400 text-sm"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 h-8 px-3 text-xs hover:bg-white dark:hover:bg-neutral-800"
          title="הוסף שפה"
        >
          הוסף
        </button>
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex flex-wrap gap-2"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 h-7 px-3 text-xs hover:bg-white dark:hover:bg-neutral-800"
              >
                + {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================ Options ============================ */
const GENDERS = [
  { v: "male", label: "זכר" },
  { v: "female", label: "נקבה" },
  { v: "other", label: "אחר" },
] as const;

const LEVELS: Array<{ v: Level; label: string }> = [
  { v: "strict", label: "קפדני" },
  { v: "partial", label: "חלקי" },
  { v: "none", label: "לא שומר/ת" },
];

const GOALS: Array<{ v: NonNullable<Goal>; label: string }> = [
  { v: "serious", label: "קשר רציני" },
  { v: "marriage", label: "נישואין" },
  { v: "friendship", label: "חברות" },
];

/* ============================ Main ============================ */
export default function DateProfileForm({
  initialProfile = {},
  onChange,
  onSaved,
}: Props) {
  const [form, setForm] = React.useState<ProfilePatch>({
    displayName: null,
    birthDate: null,
    gender: null,
    country: null,
    city: null,
    languages: [],
    judaism_direction: null,
    kashrut_level: null,
    shabbat_level: null,
    goals: null,
    about_me: null,
    avatarUrl: null,
    photos: [],
    ...initialProfile,
  });

  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [pending, setPending] = React.useState<PendingUpload[]>([]);
  const uploadsRef = React.useRef<Map<string, XMLHttpRequest>>(new Map());

  const [toast, setToast] = React.useState<{
    open: boolean;
    kind: "ok" | "err" | "info";
    text: string;
  }>({ open: false, kind: "ok", text: "" });

  const isHydratingRef = React.useRef(true);
  const lastInitialJsonRef = React.useRef(JSON.stringify(initialProfile ?? {}));
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);

  /* ---------- סנכרון initialProfile ללא לולאות ---------- */
  React.useEffect(() => {
    const nextJson = JSON.stringify(initialProfile ?? {});
    if (nextJson !== lastInitialJsonRef.current) {
      lastInitialJsonRef.current = nextJson;
      setForm((p) => ({ ...p, ...JSON.parse(nextJson) }));
    }
    if (isHydratingRef.current) isHydratingRef.current = false;
  }, [initialProfile]);

  /* ---------- עזרי סטייט ---------- */
  function set<K extends keyof ProfilePatch>(k: K, v: ProfilePatch[K]) {
    setForm((p) => {
      const next = { ...p, [k]: v };
      onChange?.({ [k]: v } as Partial<ProfilePatch>);
      return next;
    });
  }

  function capOnBlur(k: "country" | "city") {
    const v = form[k]?.toString() ?? "";
    if (!v) return;
    const next = k === "city" && /[א-ת]/.test(v) ? v : capWords(v);
    if (next !== v) set(k, next);
  }

  const cityQuickPicks = React.useMemo(() => {
    const c = (form.country || "").trim();
    if (/^(ישראל|Israel)$/i.test(c)) return CITIES_IL;
    if (/^(ארה\"ב|USA|United States|United States of America)$/i.test(c))
      return CITIES_US;
    return [];
  }, [form.country]);

  /* ---------- ולידציות + התקדמות ---------- */
  const errors = React.useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.displayName || form.displayName.trim().length < 2) {
      e.displayName = "שם קצר מדי";
    }
    if (!isDOB(form.birthDate)) {
      e.birthDate = "מבנה תאריך לא תקין (YYYY-MM-DD)";
    } else {
      const age = calcAge(form.birthDate);
      if (age !== null && age < 18) e.birthDate = "ההרשמה מגיל 18 ומעלה";
    }
    if (!form.gender) e.gender = "בחר/י מין";
    if (!form.country) e.country = "נא למלא מדינה";
    if (!form.city) e.city = "נא למלא עיר";

    if (!form.judaism_direction) e.judaism_direction = "נא לבחור זרם";
    if (!form.kashrut_level) e.kashrut_level = "נא לבחור רמת כשרות";
    if (!form.shabbat_level) e.shabbat_level = "נא לבחור שמירת שבת";
    if (!form.goals) e.goals = "נא לבחור מטרה";

    if (!form.about_me && (!form.avatarUrl || form.avatarUrl.length < 3)) {
      e.about_me = "מומלץ למלא כמה מילים או להעלות תמונת פרופיל";
    }
    return e;
  }, [form]);

  const required = [
    ["displayName", !!form.displayName && form.displayName.trim().length >= 2],
    [
      "birthDate",
      isDOB(form.birthDate) && (calcAge(form.birthDate) ?? 18) >= 18,
    ],
    ["gender", !!form.gender],
    ["country", !!form.country],
    ["city", !!form.city],
    ["judaism_direction", !!form.judaism_direction],
    ["kashrut_level", !!form.kashrut_level],
    ["shabbat_level", !!form.shabbat_level],
    ["goals", !!form.goals],
  ] as const;

  const niceToHave = [
    ["languages", (form.languages || []).length > 0],
    ["about_me", !!form.about_me || !!form.avatarUrl],
  ] as const;

  const reqDone = required.filter(([, ok]) => ok).length;
  const optDone = niceToHave.filter(([, ok]) => ok).length;

  const percent = React.useMemo(() => {
    return Math.min(
      100,
      Math.round(
        (reqDone / required.length) * 80 + (optDone / niceToHave.length) * 20
      )
    );
  }, [reqDone, required.length, optDone, niceToHave.length]);

  const missing = React.useMemo(() => {
    const list: string[] = [];
    if (!required[0][1]) list.push("שם תצוגה");
    if (!required[1][1]) list.push("תאריך לידה");
    if (!required[2][1]) list.push("מין");
    if (!required[3][1]) list.push("מדינה");
    if (!required[4][1]) list.push("עיר");
    if (!required[5][1]) list.push("זרם ביהדות");
    if (!required[6][1]) list.push("רמת כשרות");
    if (!required[7][1]) list.push("שמירת שבת");
    if (!required[8][1]) list.push("מטרה");
    if (!niceToHave[0][1]) list.push("שפות");
    if (!niceToHave[1][1]) list.push("ביוגרפיה/תמונה");
    return list;
  }, [required, niceToHave]);

  const doneFlags = React.useMemo(
    () => [
      !!(
        required[0][1] &&
        required[1][1] &&
        required[2][1] &&
        required[3][1] &&
        required[4][1]
      ),
      !!(required[5][1] && required[6][1] && required[7][1] && required[8][1]),
      !!(niceToHave[1][1] || niceToHave[0][1]),
    ],
    [required, niceToHave]
  );

  /* ---------- Confetti קטן ---------- */
  const [showConfetti, setShowConfetti] = React.useState(false);
  const lastMilestoneRef = React.useRef(0);
  React.useEffect(() => {
    const milestones = [60, 80, 100];
    const next = milestones.find(
      (m) => percent >= m && lastMilestoneRef.current < m
    );
    if (next) {
      setShowConfetti(true);
      lastMilestoneRef.current = next;
      setToast({ open: true, kind: "ok", text: `יפה! הגעת ל-${next}% ✓` });
      const t = setTimeout(() => setShowConfetti(false), 1200);
      return () => clearTimeout(t);
    }
  }, [percent]);

  /* ---------- Auto-Save Debounced ---------- */
  React.useEffect(() => {
    if (isHydratingRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void autoSave();
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.displayName,
    form.birthDate,
    form.gender,
    form.country,
    form.city,
    form.judaism_direction,
    form.kashrut_level,
    form.shabbat_level,
    form.goals,
    form.avatarUrl,
    form.photos, // שמור גם על שינוי בסדר/מחיקה/הוספה
  ]);

  async function autoSave() {
    if (saving) return;
    try {
      setSaving(true);
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      await fetch("/api/date/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
        body: JSON.stringify(form),
      });
      onSaved?.(form);
      setToast({ open: true, kind: "info", text: "נשמר אוטומטית" });
    } catch {
      // שקט באוטו־סייב
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    try {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setSaving(true);
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      await fetch("/api/date/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
        body: JSON.stringify(form),
      });
      onSaved?.(form);
      setToast({ open: true, kind: "ok", text: "הפרופיל נשמר ✓" });
    } catch {
      setToast({ open: true, kind: "err", text: "שמירה נכשלה" });
    } finally {
      setSaving(false);
    }
  }

  // Ctrl/Cmd+S
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================ Upload Handlers ============================ */
  const dropRef = React.useRef<HTMLDivElement | null>(null);

  // Drag & Drop
  React.useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    function prevent(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
    function onDrop(e: DragEvent) {
      prevent(e);
      const dt = e.dataTransfer;
      if (!dt) return;
      const files = Array.from(dt.files || []);
      if (files.length) void handleFiles(files);
    }
    ["dragenter", "dragover", "dragleave", "drop"].forEach((t) =>
      el.addEventListener(t, prevent as any)
    );
    el.addEventListener("drop", onDrop as any);

    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((t) =>
        el.removeEventListener(t, prevent as any)
      );
      el.removeEventListener("drop", onDrop as any);
    };
  }, []);

  // Paste from clipboard
  React.useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length) {
        e.preventDefault();
        void handleFiles(files);
      }
    }
    el.addEventListener("paste", onPaste as any);
    return () => el.removeEventListener("paste", onPaste as any);
  }, []);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await handleFiles(files);
    e.target.value = ""; // reset
  }

  function validateBeforeUpload(files: File[]) {
    for (const f of files) {
      if (!ALLOWED_MIMES.has(f.type)) {
        throw new Error(`סוג קובץ לא נתמך: ${f.name} (${f.type})`);
      }
      if (f.size > MAX_BYTES) {
        throw new Error(`הקובץ גדול מדי: ${f.name} (מקס׳ 10MB)`);
      }
    }
  }

  async function handleFiles(files: File[]) {
    // מגבלת כמות
    const used = (form.photos?.length || 0) + pending.length;
    const remain = MAX_PHOTOS - used;
    if (remain <= 0) {
      setToast({
        open: true,
        kind: "err",
        text: `הגעת למקסימום ${MAX_PHOTOS} תמונות`,
      });
      return;
    }
    if (files.length > remain) {
      setToast({
        open: true,
        kind: "info",
        text: `נעלה רק ${remain} קבצים (מגבלה ${MAX_PHOTOS})`,
      });
      files = files.slice(0, remain);
    }

    try {
      validateBeforeUpload(files);
    } catch (e: any) {
      setToast({ open: true, kind: "err", text: e?.message || "שגיאה בקבצים" });
      return;
    }

    setUploading(true);

    for (const f of files) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(f);
      setPending((p) => [
        ...p,
        {
          id,
          name: f.name,
          size: f.size,
          type: f.type,
          progress: 0,
          previewUrl,
        },
      ]);

      const { xhr, done } = startUploadWithProgress(f, (pct) => {
        setPending((curr) =>
          curr.map((u) => (u.id === id ? { ...u, progress: pct } : u))
        );
      });

      uploadsRef.current.set(id, xhr);

      try {
        const url = await done;
        set("photos", [...(form.photos || []), url]);
        if (!form.avatarUrl) set("avatarUrl", url);
        setPending((curr) => curr.filter((u) => u.id !== id));
      } catch (err: any) {
        setPending((curr) => curr.filter((u) => u.id !== id));
        setToast({
          open: true,
          kind: "err",
          text: err?.message || "שגיאה בהעלאה",
        });
      } finally {
        uploadsRef.current.delete(id);
        URL.revokeObjectURL(previewUrl);
      }
    }

    setUploading(false);
    setToast({ open: true, kind: "ok", text: "העלאה הושלמה ✓" });
  }

  function cancelUpload(id: string) {
    const xhr = uploadsRef.current.get(id);
    if (xhr) {
      try {
        xhr.abort();
      } catch {}
      uploadsRef.current.delete(id);
    }
    setPending((curr) => curr.filter((u) => u.id !== id));
  }

  function onAddUrl(urlRaw: string) {
    const url = (urlRaw || "").trim();
    if (!url) return;
    try {
      new URL(url);
      if ((form.photos?.length || 0) >= MAX_PHOTOS) {
        setToast({
          open: true,
          kind: "err",
          text: `הגעת למקסימום ${MAX_PHOTOS} תמונות`,
        });
        return;
      }
      set("photos", [...(form.photos || []), url]);
      if (!form.avatarUrl) set("avatarUrl", url);
      setToast({ open: true, kind: "ok", text: "תמונה נוספה מ־URL ✓" });
    } catch {
      setToast({ open: true, kind: "err", text: "URL לא תקין" });
    }
  }

  function onRemovePhoto(url: string) {
    const next = (form.photos || []).filter((u) => u !== url);
    set("photos", next);
    if (form.avatarUrl === url) {
      set("avatarUrl", next[0] ?? null);
    }
  }

  function onSetAvatar(url: string) {
    set("avatarUrl", url);
  }

  function onReorder(from: number, to: number) {
    set("photos", reorder(form.photos || [], from, to));
  }

  function reorder(arr: string[], from: number, to: number) {
    const a = arr.slice();
    const [m] = a.splice(from, 1);
    a.splice(to, 0, m);
    return a;
  }

  /* ============================ RENDER ============================ */
  const age = calcAge(form.birthDate);
  const [urlInput, setUrlInput] = React.useState("");

  return (
    <div
      dir="rtl"
      className="min-h-[70vh] bg-gradient-to-br from-white to-violet-50 dark:from-neutral-950 dark:to-violet-950/20 rounded-3xl overflow-hidden border border-black/10 dark:border-white/10"
    >
      <Stepper
        current={step}
        doneFlags={doneFlags}
        percent={percent}
        onJump={setStep}
      />

      <Toast
        open={toast.open}
        kind={toast.kind}
        text={toast.text}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {/* Confetti CSS-only */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[3000]"
          >
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 60 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute inline-block"
                  style={{
                    left: `${(i * 17) % 100}%`,
                    top: `-10%`,
                    transform: `rotate(${(i * 47) % 360}deg)`,
                    animation: `fall ${1.2 + (i % 10) * 0.05}s linear forwards`,
                    fontSize: `${12 + (i % 6) * 2}px`,
                  }}
                >
                  {["✨", "🎉", "💖", "🎊", "🌟"][i % 5]}
                </span>
              ))}
            </div>
            <style>{`@keyframes fall { to { transform: translateY(120vh) rotate(720deg); opacity:.9 } }`}</style>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5">
          <ProgressPanel percent={percent} missing={missing} minOK={60} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="grid gap-5 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-5"
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <Field
                  label="שם תצוגה"
                  required
                  id="displayName"
                  error={errors.displayName}
                  success={!errors.displayName && !!form.displayName}
                >
                  <Input
                    id="displayName"
                    placeholder="למשל: מתן כהן"
                    value={form.displayName ?? ""}
                    onChange={(e) => set("displayName", e.target.value)}
                  />
                </Field>

                <Field
                  label="תאריך לידה"
                  required
                  id="birthDate"
                  hint="פורמט YYYY-MM-DD"
                  error={errors.birthDate}
                  success={!errors.birthDate && !!form.birthDate}
                >
                  <Input
                    id="birthDate"
                    placeholder="1992-07-18"
                    value={form.birthDate ?? ""}
                    onChange={(e) => set("birthDate", e.target.value)}
                  />
                  {age !== null && (
                    <div
                      className={cx(
                        "mt-1 text-xs",
                        age < 18
                          ? "text-rose-600"
                          : age < 25
                          ? "text-amber-600"
                          : "text-emerald-600"
                      )}
                    >
                      גיל מחושב: {age}
                    </div>
                  )}
                </Field>

                <Field
                  label="מין"
                  required
                  error={errors.gender}
                  success={!errors.gender && !!form.gender}
                >
                  <Select<Gender>
                    value={form.gender}
                    onChange={(v) => set("gender", v)}
                    options={
                      GENDERS.map((g) => ({
                        value: g.v,
                        label: g.label,
                      })) as any
                    }
                    placeholder="בחר/י"
                  />
                </Field>

                <Field
                  label="מדינה"
                  required
                  error={errors.country}
                  success={!errors.country && !!form.country}
                >
                  <Input
                    placeholder="ישראל / Israel"
                    value={form.country ?? ""}
                    onChange={(e) => set("country", e.target.value)}
                    onBlur={() => capOnBlur("country")}
                  />
                </Field>

                <Field
                  label="עיר"
                  required
                  error={errors.city}
                  success={!errors.city && !!form.city}
                >
                  <Input
                    placeholder="ירושלים"
                    value={form.city ?? ""}
                    onChange={(e) => set("city", e.target.value)}
                    onBlur={() => capOnBlur("city")}
                  />
                  <AnimatePresence>
                    {cityQuickPicks.length > 0 && !form.city && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 flex flex-wrap gap-2"
                      >
                        {cityQuickPicks.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => set("city", c)}
                            className="rounded-full border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 h-7 px-3 text-xs hover:bg-white dark:hover:bg-neutral-800"
                          >
                            {c}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Field>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <Field
                  label="זרם ביהדות"
                  required
                  error={errors.judaism_direction}
                  success={
                    !errors.judaism_direction && !!form.judaism_direction
                  }
                >
                  <Select<string | null>
                    value={form.judaism_direction ?? null}
                    onChange={(v) => set("judaism_direction", v)}
                    options={
                      [
                        { value: "orthodox", label: "אורתודוקסי" },
                        { value: "haredi", label: "חרדי" },
                        { value: "chasidic", label: "חסידי" },
                        { value: "modern", label: "אורתודוקסי מודרני" },
                        { value: "conservative", label: "קונסרבטיבי" },
                        { value: "reform", label: "רפורמי" },
                        { value: "reconstructionist", label: "רקונסטרוקטיבי" },
                        { value: "secular", label: "חילוני/תרבותי" },
                      ] as any
                    }
                    placeholder="בחר/י"
                  />
                </Field>

                <Field
                  label="רמת כשרות"
                  required
                  error={errors.kashrut_level}
                  success={!errors.kashrut_level && !!form.kashrut_level}
                >
                  <Select<Level | null>
                    value={form.kashrut_level ?? null}
                    onChange={(v) => set("kashrut_level", v)}
                    options={
                      LEVELS.map((l) => ({
                        value: l.v,
                        label: l.label,
                      })) as any
                    }
                    placeholder="בחר/י"
                  />
                </Field>

                <Field
                  label="שמירת שבת"
                  required
                  error={errors.shabbat_level}
                  success={!errors.shabbat_level && !!form.shabbat_level}
                >
                  <Select<Level | null>
                    value={form.shabbat_level ?? null}
                    onChange={(v) => set("shabbat_level", v)}
                    options={
                      LEVELS.map((l) => ({
                        value: l.v,
                        label: l.label,
                      })) as any
                    }
                    placeholder="בחר/י"
                  />
                </Field>

                <Field
                  label="מטרה"
                  required
                  error={errors.goals}
                  success={!errors.goals && !!form.goals}
                >
                  <Select<Goal>
                    value={form.goals ?? null}
                    onChange={(v) => set("goals", v)}
                    options={
                      GOALS.map((g) => ({ value: g.v, label: g.label })) as any
                    }
                    placeholder="בחר/י"
                  />
                </Field>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid gap-4"
              >
                {/* העלאת תמונות */}
                <Field
                  label="תמונות"
                  hint={`ניתן לגרור ולשחרר, להדביק (Ctrl/Cmd+V), לבחור קבצים, או להדביק URL. תמונות מותרות: JPG/PNG/WebP/GIF. מקס׳ ${MAX_PHOTOS} תמונות.`}
                  success={(form.photos || []).length > 0}
                >
                  <div
                    ref={dropRef}
                    className="rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          capture="environment"
                          onChange={onPickFiles}
                          className="hidden"
                          id="filepick"
                        />
                        <span className="inline-flex items-center gap-2 rounded-xl h-10 px-4 border bg-white/90 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 cursor-pointer">
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M19 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4h2v4h10v-4zm-6-2l-4-4l1.41-1.41L11 9.17V3h2v6.17l1.59-1.58L16 9z"
                            />
                          </svg>
                          <label htmlFor="filepick" className="cursor-pointer">
                            בחר/י קבצים / מצלמה
                          </label>
                        </span>
                      </label>

                      <div className="flex-1" />

                      <div className="flex items-center gap-2">
                        <input
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="או הדבק/י URL לתמונה…"
                          className="h-10 w-[220px] rounded-xl border px-3 bg-white/95 dark:bg-neutral-900/90"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = urlInput;
                            setUrlInput("");
                            onAddUrl(v);
                          }}
                          className="h-10 px-3 rounded-xl border bg-white/90 dark:bg-neutral-900/80 border-black/10 dark:border-white/10"
                        >
                          הוסף URL
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs opacity-60">
                      גררו תמונות לאזור זה או הדביקו (Ctrl/Cmd+V).{" "}
                      {uploading && "מעלה…"}
                    </div>

                    {/* ממתינים */}
                    <PendingGrid items={pending} onCancel={cancelUpload} />

                    {/* גלריה */}
                    <div className="mt-4">
                      <Gallery
                        photos={form.photos || []}
                        avatarUrl={form.avatarUrl}
                        onSetAvatar={onSetAvatar}
                        onRemove={onRemovePhoto}
                        onReorder={onReorder}
                      />
                    </div>
                  </div>
                </Field>

                {/* תמונת פרופיל (בחירה ספציפית או URL ישיר) */}
                <Field
                  label="תמונת פרופיל (Avatar)"
                  hint="אפשר לבחור מתוך הגלריה (לחצן 'קבע Avatar') או להדביק URL כאן."
                  success={!!form.avatarUrl}
                >
                  <div className="flex items-start gap-3">
                    <Input
                      placeholder="https://…"
                      value={form.avatarUrl ?? ""}
                      onChange={(e) => set("avatarUrl", e.target.value)}
                    />
                    {form.avatarUrl && (
                      <div className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.avatarUrl}
                          alt="avatar"
                          className="size-16 rounded-xl object-cover border border-black/10 dark:border-white/10"
                        />
                      </div>
                    )}
                  </div>
                </Field>

                {/* אודות ושפות */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="שפות"
                    hint="הוסף/י שפה עם Enter או פסיק. יש גם הצעות."
                    success={(form.languages || []).length > 0}
                  >
                    <LangTags
                      value={form.languages || []}
                      onChange={(langs) => set("languages", langs)}
                    />
                  </Field>

                  <Field
                    label="קצת עליי"
                    hint="מומלץ כמה משפטים — תחומי עניין, עיסוק, מה מחפש/ת."
                    error={errors.about_me}
                    success={!errors.about_me && !!form.about_me}
                  >
                    <Textarea
                      placeholder="אני אוהב/ת לרוץ 10 ק״מ, לשמוע מוזיקה טובה, ובסוף שבוע לצאת לטבע…"
                      value={form.about_me ?? ""}
                      onChange={(e) => set("about_me", e.target.value)}
                    />
                    <div className="mt-1 flex justify-between text-xs text-neutral-500">
                      <span>תווים: {form.about_me?.length ?? 0}</span>
                      {(form.about_me?.length ?? 0) >= 20 ? (
                        <span className="text-emerald-600">מצוין ✓</span>
                      ) : (
                        <span>מומלץ לפחות 20 תווים</span>
                      )}
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-2 flex flex-wrap gap-2 justify-between">
            <div>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setStep((s) => clamp(s - 1, 0, STEPS.length - 1))
                  }
                  className="inline-flex items-center gap-2 rounded-full h-10 px-4 text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                >
                  ← הקודם
                </button>
              ) : (
                <span />
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full h-10 px-4 text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-60"
                title="Ctrl/Cmd+S לשמירה"
              >
                {saving ? "שומר…" : "שמור"}
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setStep((s) => clamp(s + 1, 0, STEPS.length - 1))
                  }
                  className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
                >
                  הבא →
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700"
                >
                  סיום ושמירה ✓
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ניווט תחתון קצר */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <a
            href="/date/matches"
            className={cx(
              "inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold",
              percent >= 60
                ? "bg-pink-600 text-white hover:bg-pink-700"
                : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed"
            )}
            aria-disabled={percent < 60}
            onClick={(e) => {
              if (percent < 60) e.preventDefault();
            }}
          >
            לצפייה בהתאמות
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
          >
            דף הבית
          </a>
        </div>
      </div>
    </div>
  );
}
