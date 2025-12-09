"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEvent,
  ChangeEvent,
  DragEvent,
} from "react";
import { CONTACT } from "@/lib/constants";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mails,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  MessageSquareMore,
  MessageCircleHeart,
  Sparkles,
  ShieldCheck,
  NotebookPen,
  Zap,
  Globe2,
  Info,
  Trash2,
  MapPin,
  Paperclip,
  Star,
  HeartHandshake,
  Music4,
} from "lucide-react";

/** ============================================================================
 *  ContactSection — גרסת "טורבו+" מעוצבת
 *  - Wizard רב־שלבי עם Stepper & Progress
 *  - ולידציה עם zod
 *  - שמירה אוטומטית לטיוטה (localStorage)
 *  - Anti-spam (honeypot + cooldown)
 *  - וואטסאפ מהיר
 *  - Drag & Drop לקבצים (preview חכם)
 *  - אנימציות Framer Motion + micro-interactions
 *  - Glass Cards + רקע גרדיאנטים מונפש
 *  - RTL מלא, ARIA, נגישות
 * ============================================================================ */

type SendState = "idle" | "sending" | "ok" | "err";

type ContactDraft = {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  date?: string;
  time?: string;
  city?: string;
  attendees?: string;
  website?: string; // honeypot
  files?: File[];
};

const DEFAULT_DRAFT: ContactDraft = {
  fullName: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
  date: "",
  time: "",
  city: "",
  attendees: "",
  website: "",
  files: [],
};

const SUBJECT_SUGGESTIONS = [
  "הזמנת הופעה",
  "שאלה כללית",
  "דמו/וידאו נוסף",
  "הצעת מחיר לאירוע",
  "שיתוף פעולה",
  "טכנית – ציוד/במה",
  "תודה 🙌",
];

const CITIES = [
  "ירושלים",
  "תל אביב",
  "בני ברק",
  "אשדוד",
  "ביתר עילית",
  "מודיעין עילית",
  "חיפה",
  "פתח תקווה",
  "נתניה",
  "ראשון לציון",
  "צפת",
  "קרית מלאכי",
  "בית שמש",
  "אלעד",
  "אשקלון",
  "רחובות",
  "חולון",
  "בת ים",
  "רמת גן",
  "חדרה",
  "קריות",
  "באר שבע",
  "הרצליה",
  'כפר חב"ד',
];

const ContactSchema = z.object({
  fullName: z.string().min(2, "שם מלא קצר מדי"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9+\-() ]{7,}$/.test(v), "מספר הטלפון לא תקין"),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), "אימייל לא תקין"),
  subject: z.string().optional(),
  message: z.string().min(3, "הודעה קצרה מדי"),
  date: z.string().optional(),
  time: z.string().optional(),
  city: z.string().optional(),
  attendees: z.string().optional(),
  website: z.string().optional(),
});

const STORAGE_KEY = "maty_contact_draft_v3";
const COOLDOWN_SEC = 30;

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: "easeOut" },
};

const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25, ease: "easeOut" },
};

function IconLabel(props: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1.5",
        props.className || "",
      ].join(" ")}
    >
      <span className="inline-flex">{props.icon}</span>
      <span>{props.children}</span>
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  const danger = value > max;
  return (
    <span
      className={[
        "text-xs",
        danger ? "text-red-600 dark:text-red-300" : "opacity-60",
      ].join(" ")}
    >
      {value}/{max}
    </span>
  );
}

function loadDraft(): ContactDraft {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DRAFT, ...parsed, files: [] };
  } catch {
    return DEFAULT_DRAFT;
  }
}
function saveDraft(d: ContactDraft) {
  if (typeof window === "undefined") return;
  const clone: any = { ...d };
  delete clone.files;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
  } catch {}
}
function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function buildWaLink(d: ContactDraft) {
  const base = (CONTACT?.whatsapp || "https://wa.me/972000000000").replace(
    /\?.*$/,
    "",
  );
  const text = `היי מתי,
שמי: ${d.fullName || "-"}
טלפון: ${d.phone || "-"}
אימייל: ${d.email || "-"}
נושא: ${d.subject || "-"}
תאריך: ${d.date || "-"}
שעה: ${d.time || "-"}
עיר: ${d.city || "-"}
משתתפים: ${d.attendees || "-"}
הודעה: ${d.message || "-"}`;
  return `${base}?text=${encodeURIComponent(text)}`;
}

function useCooldown() {
  const [left, setLeft] = useState(0);
  const tm = useRef<any>(null);
  const start = useCallback(() => {
    setLeft(COOLDOWN_SEC);
    if (tm.current) clearInterval(tm.current);
    tm.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(tm.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }, []);
  useEffect(() => () => tm.current && clearInterval(tm.current), []);
  return { left, start };
}

type StepKey = "quick" | "booking" | "details" | "review";
const steps: StepKey[] = ["quick", "booking", "details", "review"];

function Stepper({
  current,
  total,
  onJump,
}: {
  current: number;
  total: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="select-none">
      <div className="flex items-center gap-2 justify-end">
        {Array.from({ length: total }).map((_, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              type="button"
              aria-label={`שלב ${i + 1}`}
              className={[
                "h-2.5 w-10 rounded-full transition",
                active
                  ? "bg-violet-600 shadow-sm"
                  : done
                    ? "bg-violet-400/70"
                    : "bg-neutral-200 dark:bg-neutral-800",
              ].join(" ")}
            />
          );
        })}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-800/60">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        />
      </div>
    </div>
  );
}

function FilePreview({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {files.map((f, i) => {
        const url = URL.createObjectURL(f);
        const isImg = /^image\//.test(f.type);
        return (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative rounded-xl border dark:border-neutral-800/60 overflow-hidden bg-white/70 dark:bg-neutral-950/60 backdrop-blur"
          >
            {isImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={f.name}
                className="w-full h-36 object-cover"
              />
            ) : (
              <div className="h-36 flex items-center justify-center text-sm opacity-70 p-3">
                <Paperclip className="w-4 h-4 me-1" />
                {f.name}
              </div>
            )}
            <div className="absolute top-1 left-1 flex gap-1">
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="rounded-full bg-black/60 text-white p-1 hover:bg-black/70"
                aria-label="הסר קובץ"
                title="הסר קובץ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-0 inset-x-0 text-[10px] opacity-90 bg-gradient-to-t from-black/70 to-transparent text-white px-2 py-1 line-clamp-1">
              {f.name} • {(f.size / 1024).toFixed(0)}KB
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function InputBase(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    hint?: string;
    dirClass?: string;
    iconLeft?: React.ReactNode;
    id?: string;
  },
) {
  const { label, hint, dirClass, className, iconLeft, id, ...rest } = props;
  const _id = id || "in-" + Math.random().toString(36).slice(2);
  return (
    <div className="text-right space-y-1">
      {label ? (
        <label htmlFor={_id} className="text-sm opacity-80 block">
          {label}
        </label>
      ) : null}
      <div
        className={[
          "rounded-xl bg-white/70 dark:bg-neutral-950/70 border dark:border-neutral-800/60",
          "focus-within:ring-2 ring-violet-500/40 transition",
          "flex items-center gap-2 ps-3",
          dirClass || "input-rtl",
          className || "",
        ].join(" ")}
      >
        {iconLeft ? <span className="opacity-70">{iconLeft}</span> : null}
        <input
          id={_id}
          {...rest}
          className="bg-transparent flex-1 py-2 pe-3 outline-none"
        />
      </div>
      {hint ? <span className="text-xs opacity-60">{hint}</span> : null}
    </div>
  );
}

function TextareaBase(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: React.ReactNode;
    hint?: string;
    dirClass?: string;
    id?: string;
  },
) {
  const { label, hint, dirClass, className, id, ...rest } = props;
  const _id = id || "ta-" + Math.random().toString(36).slice(2);
  return (
    <div className="text-right space-y-1">
      {label ? (
        <label htmlFor={_id} className="text-sm opacity-80 block">
          {label}
        </label>
      ) : null}
      <div
        className={[
          "rounded-2xl bg-white/70 dark:bg-neutral-950/70 border dark:border-neutral-800/60",
          "focus-within:ring-2 ring-fuchsia-500/40 transition",
          dirClass || "input-rtl",
          className || "",
        ].join(" ")}
      >
        <textarea
          id={_id}
          {...rest}
          className="bg-transparent w-full p-3 outline-none min-h-[140px]"
        />
      </div>
      {hint ? <span className="text-xs opacity-60">{hint}</span> : null}
    </div>
  );
}

export default function ContactSection() {
  const [draft, setDraft] = useState<ContactDraft>(() => loadDraft());
  const [state, setState] = useState<SendState>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<StepKey>("quick");
  const [activeFiles, setActiveFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [charCount, setCharCount] = useState({ message: 0 });
  const [agree, setAgree] = useState(false);
  const { left: cooldownLeft, start: startCooldown } = useCooldown();
  const [ariaLive, setAriaLive] = useState<string>("");

  const waLink = useMemo(() => buildWaLink({ ...draft, files: [] }), [draft]);

  useEffect(() => saveDraft(draft), [draft]);
  useEffect(
    () => setCharCount({ message: (draft.message || "").length }),
    [draft.message],
  );

  const onField = useCallback((key: keyof ContactDraft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  function pickSubject(s: string) {
    onField("subject", s);
    setAriaLive(`נושא עודכן: ${s}`);
  }

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || !list.length) return;
    const next = [...activeFiles];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i)!;
      if (f.size > 16 * 1024 * 1024) continue; // עד 16MB
      next.push(f);
    }
    setActiveFiles(next);
  }
  function onDropFiles(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const list = e.dataTransfer.files;
    if (!list || !list.length) return;
    const next = [...activeFiles];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i)!;
      if (f.size > 16 * 1024 * 1024) continue;
      next.push(f);
    }
    setActiveFiles(next);
  }
  function onDrag(e: DragEvent<HTMLDivElement>, over: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(over);
  }
  function removeFile(idx: number) {
    setActiveFiles((arr) => arr.filter((_, i) => i !== idx));
  }
  function openPicker() {
    fileInputRef.current?.click();
  }

  function validate() {
    const res = ContactSchema.safeParse(draft);
    if (!res.success) {
      const first = res.error.issues[0];
      return first?.message || "שגיאה בטופס";
    }
    if (!draft.fullName.trim()) return "שם מלא הוא שדה חובה";
    if (!draft.message.trim()) return "הודעה היא שדה חובה";
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setAriaLive("שולח את הטופס…");

    if (cooldownLeft > 0) {
      setErr(`אנא המתן ${cooldownLeft} שניות לפני שליחה נוספת`);
      return;
    }

    const v = validate();
    if (v) {
      setErr(v);
      setAriaLive("שגיאה בטופס");
      return;
    }

    if (!agree) {
      setErr("יש לאשר את תנאי השימוש והפרטיות");
      setAriaLive("חסרה הסכמה לתנאים");
      return;
    }

    setState("sending");

    try {
      const form = new FormData();
      form.set("website", draft.website || "");
      form.set("name", draft.fullName);
      form.set("email", draft.email || "");
      form.set("phone", draft.phone || "");
      form.set("subject", draft.subject || "");
      form.set("message", draft.message || "");
      form.set("date", draft.date || "");
      form.set("time", draft.time || "");
      form.set("city", draft.city || "");
      form.set("attendees", draft.attendees || "");
      activeFiles.forEach((f) => form.append("files", f, f.name));

      const res = await fetch("/api/contact", { method: "POST", body: form });

      if (!res.ok) {
        let msg = "שליחה נכשלה";
        try {
          const j = await res.json();
          if (j && j.error) msg = String(j.error);
        } catch {}
        throw new Error(msg);
      }

      setState("ok");
      setAriaLive("ההודעה נשלחה בהצלחה");
      startCooldown();
      setActiveFiles([]);
      setDraft({ ...DEFAULT_DRAFT });
      clearDraft();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mm:toast", {
            detail: { type: "success", text: "ההודעה נשלחה" },
          }),
        );
      }
    } catch (e: any) {
      setState("err");
      setAriaLive("שגיאה בשליחה");
      const msg =
        typeof e?.message === "string" ? e.message : "שגיאה בשליחה, נסה שוב";
      setErr(msg);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mm:toast", {
            detail: { type: "error", text: "שגיאה בשליחה" },
          }),
        );
      }
    }
  }

  const stepIndex = steps.indexOf(step);
  function goNext() {
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  }
  function goPrev() {
    setStep(steps[Math.max(stepIndex - 1, 0)]);
  }
  function setStepKey(k: StepKey) {
    setStep(k);
  }

  const MAX_MESSAGE = 1200;

  return (
    <section
      id="contact"
      className="relative py-16 sm:py-20"
      dir="rtl"
      aria-live="polite"
    >
      {/* ======= Animated gradient background ======= */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-[float_9s_ease-in-out_infinite]"></div>
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-[float_12s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/3 left-1/4 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl animate-[float_14s_ease-in-out_infinite]"></div>
        <style>{`
          @keyframes float { 
            0% { transform: translateY(0px) }
            50% { transform: translateY(-12px) }
            100% { transform: translateY(0px) }
          }
        `}</style>
      </div>

      <div className="container-section relative">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20% 0px -10% 0px" }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-4xl mb-8"
        >
          <div className="rounded-3xl border dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/60 backdrop-blur p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="text-right">
                <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                  צור קשר — טורבו+
                </h2>
                <p className="opacity-80 text-sm mt-1">
                  שלחו פרטים ונחזור עם הצעה מסודרת. אפשר גם וואטסאפ בלחיצה.
                </p>
              </div>
              <div className="text-xs opacity-70">
                שלב {stepIndex + 1} מתוך {steps.length}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setStepKey("quick")}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm border transition",
                  step === "quick"
                    ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
                    : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-4 h-4" /> מהיר
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStepKey("booking")}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm border transition",
                  step === "booking"
                    ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
                    : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" /> הזמנה
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStepKey("details")}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm border transition",
                  step === "details"
                    ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
                    : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-1">
                  <NotebookPen className="w-4 h-4" /> פרטים
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStepKey("review")}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm border transition",
                  step === "review"
                    ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
                    : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> סיכום
                </span>
              </button>
            </div>

            <div className="mt-4">
              <Stepper
                current={stepIndex}
                total={steps.length}
                onJump={(i) => setStep(steps[i])}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* ====== טופס ====== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/60 backdrop-blur p-5 shadow-sm"
          >
            <form
              className="grid gap-4"
              onSubmit={onSubmit}
              aria-busy={state === "sending"}
            >
              {/* honeypot */}
              <label className="hidden">
                <span>Website</span>
                <input
                  value={draft.website}
                  onChange={(e) => onField("website", e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </label>

              <AnimatePresence mode="wait">
                {step === "quick" && (
                  <motion.div
                    key="step-quick"
                    {...stepVariants}
                    className="grid gap-3"
                  >
                    <div className="grid md:grid-cols-2 gap-3">
                      <InputBase
                        label="שם מלא *"
                        value={draft.fullName}
                        onChange={(e) => onField("fullName", e.target.value)}
                        autoComplete="name"
                        placeholder="שם פרטי ומשפחה"
                        dirClass="input-rtl"
                        iconLeft={
                          <HeartHandshake className="w-4 h-4 opacity-70" />
                        }
                      />
                      <InputBase
                        label="אימייל"
                        type="email"
                        value={draft.email}
                        onChange={(e) => onField("email", e.target.value)}
                        autoComplete="email"
                        placeholder="name@example.com"
                        dirClass="input-ltr"
                        iconLeft={<Mails className="w-4 h-4 opacity-70" />}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <InputBase
                        label="טלפון"
                        value={draft.phone}
                        onChange={(e) => onField("phone", e.target.value)}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="05X-XXXXXXX"
                        dirClass="input-ltr"
                        iconLeft={<Phone className="w-4 h-4 opacity-70" />}
                      />
                      <InputBase
                        label="נושא"
                        value={draft.subject}
                        onChange={(e) => onField("subject", e.target.value)}
                        placeholder="הזמנת הופעה / שאלה כללית"
                        dirClass="input-rtl"
                        iconLeft={<Music4 className="w-4 h-4 opacity-70" />}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end text-xs">
                      <span className="opacity-70">בחר מהיר:</span>
                      {SUBJECT_SUGGESTIONS.map((s) => (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          whileHover={{ y: -1 }}
                          key={s}
                          type="button"
                          onClick={() => pickSubject(s)}
                          className="rounded-full border px-2 py-1 bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            {s}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <TextareaBase
                      label={
                        <span className="inline-flex items-center gap-2">
                          הודעה *{" "}
                          <Counter
                            value={charCount.message}
                            max={MAX_MESSAGE}
                          />
                        </span>
                      }
                      value={draft.message}
                      onChange={(e) =>
                        onField("message", e.target.value.slice(0, MAX_MESSAGE))
                      }
                      placeholder="ספרו על האירוע: תאריך/מיקום/סגנון/מספר משתתפים וכו׳"
                      dirClass="input-rtl"
                    />

                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={goNext}
                        className="rounded-xl px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 inline-flex items-center gap-2"
                      >
                        הבא <ChevronLeft className="w-4 h-4" />
                      </button>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border px-4 py-2 bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
                      >
                        וואטסאפ מהיר <MessageSquareMore className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                )}

                {step === "booking" && (
                  <motion.div
                    key="step-booking"
                    {...stepVariants}
                    className="grid gap-3"
                  >
                    <div className="grid md:grid-cols-3 gap-3">
                      <InputBase
                        label="תאריך"
                        type="date"
                        value={draft.date}
                        onChange={(e) => onField("date", e.target.value)}
                        dirClass="input-ltr"
                        iconLeft={
                          <CalendarDays className="w-4 h-4 opacity-70" />
                        }
                      />
                      <InputBase
                        label="שעה משוערת"
                        type="time"
                        value={draft.time}
                        onChange={(e) => onField("time", e.target.value)}
                        dirClass="input-ltr"
                      />
                      <label className="grid gap-1 text-right">
                        <span className="text-sm opacity-80">עיר/מיקום</span>
                        <div className="input-base rounded-xl bg-white/70 dark:bg-neutral-950/70 border dark:border-neutral-800/60 input-rtl focus-within:ring-2 ring-rose-500/40 transition flex items-center">
                          <span className="ps-3 opacity-70">
                            <MapPin className="w-4 h-4" />
                          </span>
                          <select
                            value={draft.city || ""}
                            onChange={(e) => onField("city", e.target.value)}
                            className="bg-transparent flex-1 py-2 pe-3 outline-none"
                          >
                            <option value="">בחר…</option>
                            {CITIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </label>
                    </div>

                    <InputBase
                      label="מספר משתתפים (משוער)"
                      value={draft.attendees}
                      onChange={(e) => onField("attendees", e.target.value)}
                      placeholder="למשל: 250"
                      dirClass="input-ltr"
                      iconLeft={<Info className="w-4 h-4 opacity-70" />}
                    />

                    {draft.city && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl overflow-hidden border dark:border-neutral-800/60"
                      >
                        <iframe
                          title="מפה"
                          className="w-full h-64"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(draft.city)}&output=embed`}
                        />
                      </motion.div>
                    )}

                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        className="rounded-xl border px-4 py-2 bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4" /> חזרה
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="rounded-xl px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 inline-flex items-center gap-2"
                      >
                        הבא <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "details" && (
                  <motion.div
                    key="step-details"
                    {...stepVariants}
                    className="grid gap-3"
                  >
                    <div
                      onDragEnter={(e) => onDrag(e, true)}
                      onDragOver={(e) => onDrag(e, true)}
                      onDragLeave={(e) => onDrag(e, false)}
                      onDrop={onDropFiles}
                      className={[
                        "rounded-2xl border-2 border-dashed p-5 transition",
                        dragOver
                          ? "border-fuchsia-500 bg-fuchsia-500/5"
                          : "border-neutral-300/60 dark:border-neutral-700/60 bg-white/60 dark:bg-neutral-950/50",
                      ].join(" ")}
                      aria-label="אזור העלאת קבצים"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="font-semibold flex items-center gap-2">
                          <UploadCloud className="w-5 h-5 text-fuchsia-600" />
                          גרור קבצים לכאן או לחץ לבחירה
                        </div>
                        <button
                          type="button"
                          onClick={openPicker}
                          className="btn"
                        >
                          בחר קבצים
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={onPickFiles}
                          multiple
                          className="hidden"
                          accept="image/*,application/pdf,video/*,audio/*"
                        />
                      </div>
                      <p className="opacity-70 text-xs mt-1">
                        תמונות/מסמכים/וידאו קצרים. עד ~16MB לקובץ.
                      </p>

                      <AnimatePresence>
                        {activeFiles.length > 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3"
                          >
                            <FilePreview
                              files={activeFiles}
                              onRemove={removeFile}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 text-sm opacity-70"
                          >
                            לא נבחרו קבצים.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <label className="inline-flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                      />
                      <span className="text-sm opacity-90">
                        אני מאשר/ת את{" "}
                        <a className="underline" href="/terms" target="_blank">
                          תנאי השימוש
                        </a>{" "}
                        ו{" "}
                        <a
                          className="underline"
                          href="/privacy"
                          target="_blank"
                        >
                          מדיניות הפרטיות
                        </a>
                      </span>
                    </label>

                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        className="rounded-xl border px-4 py-2 bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4" /> חזרה
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="rounded-xl px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 inline-flex items-center gap-2"
                      >
                        הבא <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "review" && (
                  <motion.div
                    key="step-review"
                    {...stepVariants}
                    className="grid gap-3"
                  >
                    <div className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/60">
                      <div className="font-semibold mb-2">תצוגה מקדימה</div>
                      <ul className="text-sm space-y-1 opacity-85">
                        <li>
                          <b>שם:</b> {draft.fullName || "-"}
                        </li>
                        <li>
                          <b>אימייל:</b> {draft.email || "-"}
                        </li>
                        <li>
                          <b>טלפון:</b> {draft.phone || "-"}
                        </li>
                        <li>
                          <b>נושא:</b> {draft.subject || "-"}
                        </li>
                        <li>
                          <b>תאריך:</b> {draft.date || "-"}
                        </li>
                        <li>
                          <b>שעה:</b> {draft.time || "-"}
                        </li>
                        <li>
                          <b>עיר:</b> {draft.city || "-"}
                        </li>
                        <li className="break-words">
                          <b>הודעה:</b> {draft.message || "-"}
                        </li>
                        <li>
                          <b>קבצים:</b>{" "}
                          {activeFiles.length
                            ? `${activeFiles.length} קובץ/ים`
                            : "—"}
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap justify-between gap-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        className="rounded-xl border px-4 py-2 bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4" /> חזרה
                      </button>

                      <div className="flex gap-2">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border px-4 py-2 bg-white/70 dark:bg-neutral-950/60 hover:bg-white/90 dark:hover:bg-neutral-900/80 inline-flex items-center gap-2"
                        >
                          וואטסאפ <MessageCircleHeart className="w-4 h-4" />
                        </a>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={state === "sending" || cooldownLeft > 0}
                          className={[
                            "rounded-xl px-4 py-2 text-white border-0 inline-flex items-center gap-2",
                            state === "sending" || cooldownLeft > 0
                              ? "bg-brand/60 cursor-not-allowed"
                              : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110",
                          ].join(" ")}
                        >
                          {state === "sending" ? (
                            <>
                              שולח… <Loader2 className="w-4 h-4 animate-spin" />
                            </>
                          ) : cooldownLeft > 0 ? (
                            <>חכה {cooldownLeft}s</>
                          ) : (
                            <>
                              שלח <Send className="w-4 h-4" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {err && (
                  <motion.div
                    key="err"
                    {...fadeIn}
                    role="alert"
                    className="rounded-xl border border-red-200/50 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-200 text-sm"
                  >
                    <IconLabel icon={<AlertCircle className="w-4 h-4" />}>
                      {err}
                    </IconLabel>
                  </motion.div>
                )}
                {state === "ok" && !err && (
                  <motion.div
                    key="ok"
                    {...fadeIn}
                    role="status"
                    className="rounded-xl border border-emerald-200/50 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-200 text-sm"
                  >
                    <IconLabel icon={<CheckCircle2 className="w-4 h-4" />}>
                      ההודעה נשלחה. נחזור אליך בהקדם 🙌
                    </IconLabel>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="sr-only" aria-live="polite">
                {ariaLive}
              </div>
            </form>
          </motion.div>

          {/* ====== סיידבר ====== */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-3xl border dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/60 backdrop-blur p-5 shadow-sm"
          >
            <div className="text-right space-y-5">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600/15 to-fuchsia-600/10 border border-violet-600/30">
                  <div className="font-semibold mb-1">פרטים מהירים</div>
                  <div className="grid gap-2 text-sm opacity-85">
                    <IconLabel icon={<Phone className="w-4 h-4" />}>
                      {CONTACT?.phoneLocal || "—"}
                    </IconLabel>
                    <IconLabel icon={<Mails className="w-4 h-4" />}>
                      {CONTACT?.email || "—"}
                    </IconLabel>
                    <IconLabel icon={<Globe2 className="w-4 h-4" />}>
                      <a className="underline" href="/" rel="noreferrer">
                        maty-music.com
                      </a>
                    </IconLabel>
                    <div className="flex gap-2 justify-end pt-1">
                      <a
                        className="btn"
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        וואטסאפ
                      </a>
                      <a
                        className="btn"
                        href={`mailto:${CONTACT?.email || ""}`}
                      >
                        מייל
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <HelpCard
                    title="מה לציין בהודעה?"
                    text="תאריך, שעה משוערת, מיקום, מספר משתתפים, סגנון מועדף ודגשים."
                    icon={<Info className="w-5 h-5 text-violet-600" />}
                  />
                  <HelpCard
                    title="למה קהילה מאושרת?"
                    text="הרשת שלנו נקיה ומכובדת—כניסה באישור, מודרציה ומדיניות ברורה."
                    icon={<ShieldCheck className="w-5 h-5 text-violet-600" />}
                  />
                  <HelpCard
                    title="אפשר לראות דמואים?"
                    text="כמובן. יש עמוד וידאו וגלריה, ונשלח חומר נוסף לפי צורך."
                    icon={<Sparkles className="w-5 h-5 text-violet-600" />}
                  />
                </div>
              </div>

              <nav className="pt-1">
                <div className="font-semibold mb-2">קישורים שימושיים</div>
                <ul className="text-sm opacity-85 space-y-1">
                  <li>
                    <a className="underline" href="/videos">
                      וידאו
                    </a>
                  </li>
                  <li>
                    <a className="underline" href="/gallery">
                      גלריה
                    </a>
                  </li>
                  <li>
                    <a className="underline" href="/events">
                      הזמנת הופעה
                    </a>
                  </li>
                  <li>
                    <a className="underline" href="/pricing">
                      מחירים
                    </a>
                  </li>
                  <li>
                    <a className="underline" href="/club">
                      MATY-CLUB
                    </a>
                  </li>
                  <li>
                    <a className="underline" href="/date">
                      MATY-DATE
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/80 dark:bg-neutral-950/80">
                <div className="font-semibold mb-1">טיפ קטן</div>
                <div className="text-sm opacity-80">
                  מומלץ לצרף לינק לוידאו/גלריה של האולם או מעמד דומה שאהבתם—זה
                  עוזר לבנות פלייליסט מדויק.
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* ====== FAQ ====== */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mt-8"
        >
          <header className="mb-3">
            <h3 className="text-xl font-extrabold">שאלות נפוצות</h3>
            <p className="opacity-75 text-sm">שקיפות זה שם המשחק</p>
          </header>
          <div className="grid md:grid-cols-2 gap-3">
            {FAQ_ENTRIES.map((f, i) => (
              <details
                key={i}
                className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70 backdrop-blur"
              >
                <summary className="cursor-pointer font-semibold">
                  {f.q}
                </summary>
                <div className="opacity-80 text-sm leading-7 mt-1">{f.a}</div>
              </details>
            ))}
          </div>
        </motion.section>

        {/* ====== מרקיז ====== */}
        <section className="mt-8">
          <div className="rounded-2xl border dark:border-neutral-800/60 p-3 bg-white/70 dark:bg-neutral-950/70 overflow-hidden backdrop-blur">
            <div className="whitespace-nowrap animate-[marquee_28s_linear_infinite]">
              <span className="me-6">
                • MATY-MUSIC • אירועים • חופות • התוועדויות • הופעות חיות •
              </span>
              <span className="me-6">
                וידאו • גלריה • פלייליסט מותאם • סאונד מקצועי •
              </span>
              <span className="me-6">MATY-CLUB • MATY-DATE • קהילה נקיה •</span>
            </div>
            <style>{`@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
          </div>
        </section>
      </div>
    </section>
  );
}

function HelpCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icon}</div>
        <div className="text-right flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-80">{text}</div>
        </div>
      </div>
    </div>
  );
}

/* FAQ גדול (תוכן) */
const FAQ_ENTRIES: { q: string; a: string }[] = [
  {
    q: "איך בוחרים סט לאירוע?",
    a: "נבנה פלייליסט לפי הקהל, סוג האירוע והדגשים שלך; בשטח ננהל דינמיקה.",
  },
  {
    q: "אפשר לקבל דמואים מראש?",
    a: "כן, יש עמודי וידאו וגלריה—ונשלח גם חומר נוסף לפי צורך.",
  },
  {
    q: "ציוד במה קיים?",
    a: "קלידים Korg Pa5X (סטים מותאמים), RCF/JBL, מיקסר עם שליטה מלאה ועוד.",
  },
  { q: "כמה זמן סט?", a: "בד״כ 25–45 דק׳, 2–4 סטים; מותאם לערב ולסדר האירוע." },
  {
    q: "איזו מדיניות קהילה?",
    a: "ניקיון ואיכות: כניסה באישור, מודרציה, חסימות לפי צורך.",
  },
  {
    q: "מה העלויות?",
    a: "תלויות תאריך/מיקום/ציוד/היקף. נבנה הצעת מחיר הוגנת ומותאמת.",
  },
  {
    q: "אפשר הופעה קטנה?",
    a: "כן, נבנה סט-אפ מוקטן שמתאים למגבלות מקום/תקציב.",
  },
  { q: "עובדים מחוץ לארץ?", a: "לפי מקרה—צרו קשר עם פרטים ונבחן לוגיסטיקה." },
  {
    q: "מתאימים לקהילה דתית/חסידית?",
    a: "כן, רפרטואר חסידי/חב״ד + ים-תיכוני, תוך שמירה על הקו.",
  },
  {
    q: "אפשר לבקש שירים מסוימים?",
    a: "בהחלט. נעדכן מראש רשימה שמכסים ו/או מנגנים חי.",
  },
];
