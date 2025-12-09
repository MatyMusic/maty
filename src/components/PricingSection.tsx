"use client";

/**
 * PricingSection — “טורבו”: כרטיסים + קונפיגורטור חי
 * הגדשה מכוונת: הרבה אנימציות, קישוטים, עזרי UI ו־FAQ.
 * תלויות: framer-motion, lucide-react (יש לך כבר בפרויקט), Tailwind.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wallet,
  Zap,
  Crown,
  CalendarDays,
  Clock3,
  Users2,
  MapPin,
  Info,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  Siren,
  Cpu,
  Music3,
  HeartHandshake,
  Percent,
  Gift,
  BadgeCheck,
  Loader2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  TicketCheck,
  HandCoins,
  Handshake,
} from "lucide-react";

import { BASE_PRICE, CATEGORY_LABEL, CategoryKey } from "@/lib/pricing";

/* ============================================================================
   קבועים ותצורה
   ============================================================================ */

const CATS: CategoryKey[] = ["chabad", "mizrahi", "soft", "fun"];

const FEATURES: Record<CategoryKey, string[]> = {
  chabad: ["ניגונים חסידיים", "התוועדות/ריקודים", "מוביל קהל", "אפשרות חופה"],
  mizrahi: ["ים־תיכוני חי", "הוקי קהל", "מקצבים דרבוקה/תופים", "סט הרחבה"],
  soft: ["בלדות/ליווי", "צליל נקי ושקט", "טקס/קבלת פנים", "מינימום רעש"],
  fun: ["סטים מקפיצים", "מעברים חדים", "אנרגיה גבוהה", "אינטראקציה מלאה"],
};

/** מע״מ — רק לתצוגה (עדכן לפי הדין בפועל) */
const VAT_RATE = 0.17;

/** טווחים סבירים לקונפיגורטור */
const HOURS_MIN = 2;
const HOURS_MAX = 10;
const PEOPLE_MIN = 30;
const PEOPLE_MAX = 800;
const KM_MIN = 0;
const KM_MAX = 180;

/** תוספות (דמויות) */
type AddonKey =
  | "extraSound"
  | "extraMusician"
  | "photographer"
  | "mc"
  | "rushWeekend"
  | "royaltyFree"
  | "stageLighting"
  | "recording";

type Addon = {
  key: AddonKey;
  label: string;
  desc: string;
  /** מחיר קבוע לאירוע */
  perEvent?: number;
  /** מחיר לשעה */
  perHour?: number;
  /** פר מחלקה/איש */
  perPerson?: number;
};

const ADDONS: Addon[] = [
  {
    key: "extraSound",
    label: "מערכת סאונד מוגברת",
    desc: "לחללים גדולים/פתוחים — ארון רמקולים/סאבוופרים נוספים",
    perEvent: 1200,
  },
  {
    key: "extraMusician",
    label: "נגן נוסף",
    desc: "למשל: קלרינט/כינור/תופים — מחיר לשעה",
    perHour: 450,
  },
  {
    key: "photographer",
    label: "זמר ",
    desc: "לבחירת לקוח - או דרכינו ",
    perEvent: 1600,
  },
  {
    key: "mc",
    label: " מחירים מיוחדים לבתי חבד ",
    desc: "גמישות מלאה ",
    perEvent: 0,
  },
  {
    key: "rushWeekend",
    label: "סופ״ש/ערב חג",
    desc: "ביקוש גבוה/לוגיסטיקה — תוספת אירוע",
    perEvent: 900,
  },
  {
    key: "royaltyFree",
    label: "שימוש חומר ללא זכויות",
    desc: "סטים ייעודיים ללא בעיות זכויות (אם נדרש)",
    perEvent: 0,
  },
  {
    key: "stageLighting",
    label: " הוספת DJ  או הכנה של סטים ",
    desc: " בבחירת שירם פרטני בטופס שישלח ללקוח ",
    perEvent: 700,
  },
  {
    key: "recording",
    label: "הקלטת אודיו לייב",
    desc: "הקלטה מהקונסולה + ערבוב מהיר",
    perEvent: 0,
  },
];

/** מדרגות מרחק */
const TRAVEL_STEPS = [
  { maxKm: 10, label: "עד 10 ק״מ", perEvent: 0 },
  { maxKm: 30, label: "עד 30 ק״מ", perEvent: 200 },
  { maxKm: 60, label: "עד 60 ק״מ", perEvent: 380 },
  { maxKm: 100, label: "עד 100 ק״מ", perEvent: 700 },
  { maxKm: 150, label: "עד 150 ק״מ", perEvent: 980 },
  { maxKm: 9999, label: "מעל 150 ק״מ", perEvent: 1400 },
];

/** קופונים/הנחות (דמויות) */
const COUPONS: Record<
  string,
  { label: string; percent?: number; minus?: number }
> = {
  MGMATY5: { label: "חבר מביא חבר", percent: 0.05 },
  EARLY10: { label: "סגירה מוקדמת", percent: 0.1 },
  COMMUNITY150: { label: "קהילה/מוסד", minus: 150 },
};

/* ============================================================================
   עזרים
   ============================================================================ */
const heNumber = (n: number) => n.toLocaleString("he-IL");

function basePriceFor(cat: CategoryKey): number {
  return BASE_PRICE?.[cat] ?? 2000;
}

function travelFee(km: number): number {
  const step =
    TRAVEL_STEPS.find((s) => km <= s.maxKm) ||
    TRAVEL_STEPS[TRAVEL_STEPS.length - 1];
  return step.perEvent;
}

/** מחשב מחיר כולל פירוט */
function calcPrice(opts: {
  category: CategoryKey;
  hours: number;
  people: number;
  km: number;
  addons: Set<AddonKey>;
  coupon?: string;
  includeVat?: boolean;
}) {
  const base = basePriceFor(opts.category);
  // כלל שעות: עד 6 שעות — במחיר בסיס, מעבר — תוספת לשעה
  const baseHours = 6;
  const extraPerHour = Math.round(base * 0.12); // 12% מהבסיס לשעה נוספת
  const extraHours = Math.max(0, opts.hours - baseHours);
  const hoursExtraTotal = extraHours * extraPerHour;

  // תוספת גודל קהל (תוספת פלוס-מינוס)
  let peopleExtra = 0;
  if (opts.people > 250) {
    peopleExtra += Math.ceil((opts.people - 250) / 100) * 180;
  } else if (opts.people < 80) {
    // הנחה קטנה לאירועים אינטימיים
    peopleExtra -= 80;
  }

  // מרחק
  const travel = travelFee(opts.km);

  // תוספות נבחרות
  const addonTotal = Array.from(opts.addons).reduce((sum, key) => {
    const cfg = ADDONS.find((a) => a.key === key);
    if (!cfg) return sum;
    if (cfg.perEvent) sum += cfg.perEvent;
    if (cfg.perHour) sum += cfg.perHour * opts.hours;
    if (cfg.perPerson) sum += cfg.perPerson * opts.people;
    return sum;
  }, 0);

  // הנחה/קופון
  let discount = 0;
  if (opts.coupon && COUPONS[opts.coupon]) {
    const c = COUPONS[opts.coupon];
    if (c.percent)
      discount +=
        (base + hoursExtraTotal + addonTotal + travel + peopleExtra) *
        c.percent;
    if (c.minus) discount += c.minus;
  }

  const subtotal = Math.max(
    0,
    base + hoursExtraTotal + addonTotal + travel + peopleExtra - discount,
  );
  const vat = Math.round(subtotal * VAT_RATE);
  const total = opts.includeVat ? subtotal + vat : subtotal;

  return {
    base,
    extraHours,
    extraPerHour,
    hoursExtraTotal,
    peopleExtra,
    travel,
    addonTotal,
    discount: Math.round(discount),
    subtotal,
    vat,
    total,
  };
}

/* ============================================================================
   אנימציות
   ============================================================================ */
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const pop = {
  initial: { scale: 0.96, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const glowPulse = "animate-[glow_2.4s_ease-in-out_infinite]";
const floatY = "animate-[floaty_6s_ease-in-out_infinite]";
const subtlePulse = "animate-[pulseSoft_4s_ease-in-out_infinite]";

/* ============================================================================
   קומפוננטה
   ============================================================================ */
export default function PricingSection() {
  const [activeCat, setActiveCat] = useState<CategoryKey>("chabad");
  const [hours, setHours] = useState(6);
  const [people, setPeople] = useState(150);
  const [km, setKm] = useState(15);
  const [addons, setAddons] = useState<Set<AddonKey>>(new Set());
  const [coupon, setCoupon] = useState("");
  const [applyVat, setApplyVat] = useState(true);
  const [loading, setLoading] = useState(false);

  const calc = useMemo(
    () =>
      calcPrice({
        category: activeCat,
        hours,
        people,
        km,
        addons,
        coupon: coupon.trim().toUpperCase(),
        includeVat: applyVat,
      }),
    [activeCat, hours, people, km, addons, coupon, applyVat],
  );

  /** החלפת תוספת */
  function toggleAddon(key: AddonKey) {
    setAddons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** “הזמן עכשיו” — יצירת קישור עם פרמטרים */
  const bookHref = useMemo(() => {
    const p = new URLSearchParams({
      category: activeCat,
      hours: String(hours),
      people: String(people),
      km: String(km),
      addons: Array.from(addons).join(","),
      coupon: coupon.trim(),
    });
    return `/book?${p.toString()}`;
  }, [activeCat, hours, people, km, addons, coupon]);

  /** בדיקה/ספינר דמה */
  async function fakeCheck() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
  }

  useEffect(() => {
    // דוגמה: בדיקה מהירה בכל שינוי קופון
    if (coupon.trim()) fakeCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon]);

  return (
    <section id="pricing" className="section-padding relative" dir="rtl">
      {/* ==== רקע אנימטיבי ===== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes glow { 0%,100%{filter:drop-shadow(0 0 0 rgba(109,74,255,0));} 50%{filter:drop-shadow(0 0 16px rgba(109,74,255,.35));} }
          @keyframes floaty { 0%{ transform:translateY(0) } 50%{ transform:translateY(-8px) } 100%{ transform:translateY(0) } }
          @keyframes pulseSoft { 0%,100%{ transform:scale(1); opacity:.95 } 50%{ transform:scale(1.02); opacity:1 } }
        `,
        }}
      />
      <div className="absolute -z-10 inset-0 pointer-events-none">
        <div
          aria-hidden
          className={`absolute inset-x-0 -top-24 mx-auto h-[240px] w-[min(100%,900px)] rounded-[56px] blur-3xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(109,74,255,.26),rgba(109,74,255,0)_65%)] ${glowPulse}`}
        />
        <div
          aria-hidden
          className={`absolute inset-x-0 top-12 mx-auto h-[220px] w-[min(100%,700px)] rounded-[56px] blur-3xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,134,98,.22),rgba(255,134,98,0)_65%)] ${floatY}`}
        />
      </div>

      <div className="container-section">
        {/* ====== כותרת ====== */}
        <motion.header {...fadeUp} className="mb-6 text-right">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-xs opacity-80">מחירון דינמי</span>
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            מחירון לפי קטגוריות + קונפיגורטור
          </h1>
          <p className="opacity-80 mt-1">
            בסיס <b>6 שעות</b> + אפשרויות הרחבה. המחיר מתעדכן לפי פרטי האירוע.
          </p>
        </motion.header>

        {/* ====== טאבים של קטגוריות ====== */}
        <motion.div
          {...fadeUp}
          className="mb-5 flex flex-wrap gap-2 justify-end"
        >
          {CATS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              className={[
                "rounded-xl px-3 py-1.5 text-sm border transition inline-flex items-center gap-2",
                activeCat === key
                  ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
                  : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
              ].join(" ")}
              aria-pressed={activeCat === key}
            >
              {key === "chabad" && <ShieldCheck className="w-4 h-4" />}
              {key === "mizrahi" && <Music3 className="w-4 h-4" />}
              {key === "soft" && <HeartHandshake className="w-4 h-4" />}
              {key === "fun" && <Zap className="w-4 h-4" />}
              {CATEGORY_LABEL[key]}
            </button>
          ))}
        </motion.div>

        {/* ====== גריד כרטיסים ====== */}
        <motion.div
          {...pop}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {CATS.map((k, i) => {
            const price = basePriceFor(k);
            return (
              <motion.article
                key={k}
                className="card flex flex-col border dark:border-white/10 overflow-hidden relative"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.03 * i, duration: 0.35 }}
              >
                {/* פס ראש */}
                <div
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 ${k === activeCat ? "bg-violet-500" : "bg-neutral-200 dark:bg-neutral-800"}`}
                />
                <div className="text-xl font-extrabold text-right flex items-center justify-between">
                  <span>{CATEGORY_LABEL[k]}</span>
                  {k === activeCat ? (
                    <BadgeCheck
                      className={`w-5 h-5 text-violet-600 ${glowPulse}`}
                    />
                  ) : (
                    <Crown className="w-5 h-5 opacity-50" />
                  )}
                </div>
                <div className="mt-1 text-3xl font-black text-right">
                  ₪{heNumber(price)}
                  <span className="text-sm opacity-60 mr-1">/ 6 שעות</span>
                </div>

                <ul className="mt-4 space-y-2 text-right opacity-90">
                  {FEATURES[k].map((f) => (
                    <li key={f} className="flex items-center justify-end gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>• {f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4 flex justify-end">
                  <Link
                    href={`/book?category=${k}`}
                    className="btn bg-brand text-white border-0 hover:opacity-90 inline-flex items-center gap-2"
                    onMouseEnter={() => setActiveCat(k)}
                  >
                    הזמן עכשיו <Handshake className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* ====== מפריד ====== */}
        <div className="my-7" />

        {/* ====== קונפיגורטור חי ====== */}
        <section className="grid lg:grid-cols-2 gap-5">
          {/* פנל שמאלי: שליטה */}
          <motion.div {...pop} className="card">
            <header className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-sm opacity-70">הגדרות האירוע</div>
                <h3 className="text-xl font-extrabold">בנה הצעת מחיר</h3>
              </div>
              <Wallet className="w-6 h-6 opacity-70" />
            </header>

            <div className="mt-4 grid gap-3 text-right">
              {/* שעות */}
              <div className="rounded-2xl border dark:border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold flex items-center gap-2">
                    <Clock3 className="w-4 h-4" /> שעות
                  </div>
                  <div className="text-sm opacity-70">{hours} שעות</div>
                </div>
                <input
                  type="range"
                  min={HOURS_MIN}
                  max={HOURS_MAX}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full mt-3"
                />
                <div className="flex justify-between text-xs opacity-60 mt-1">
                  <span>{HOURS_MIN}</span>
                  <span>6 בסיס</span>
                  <span>{HOURS_MAX}</span>
                </div>
              </div>

              {/* קהל */}
              <div className="rounded-2xl border dark:border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold flex items-center gap-2">
                    <Users2 className="w-4 h-4" /> גודל קהל (משוער)
                  </div>
                  <div className="text-sm opacity-70">{people} איש</div>
                </div>
                <input
                  type="range"
                  min={PEOPLE_MIN}
                  max={PEOPLE_MAX}
                  step={10}
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  className="w-full mt-3"
                />
                <div className="flex justify-between text-xs opacity-60 mt-1">
                  <span>{PEOPLE_MIN}</span>
                  <span>~250</span>
                  <span>{PEOPLE_MAX}</span>
                </div>
              </div>

              {/* מרחק */}
              <div className="rounded-2xl border dark:border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> מרחק נסיעה
                  </div>
                  <div className="text-sm opacity-70">{km} ק״מ</div>
                </div>
                <input
                  type="range"
                  min={KM_MIN}
                  max={KM_MAX}
                  step={5}
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full mt-3"
                />
                <div className="flex justify-between text-xs opacity-60 mt-1">
                  <span>{KM_MIN}</span>
                  <span>~30 ק״מ</span>
                  <span>{KM_MAX}</span>
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {TRAVEL_STEPS.find((s) => km <= s.maxKm)?.label}
                </div>
              </div>

              {/* תוספות */}
              <div className="rounded-2xl border dark:border-white/10 p-4">
                <div className="font-semibold flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4" /> תוספות (אופציונלי)
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {ADDONS.map((a) => {
                    const checked = addons.has(a.key);
                    return (
                      <label
                        key={a.key}
                        className={[
                          "rounded-xl border p-3 cursor-pointer transition",
                          checked
                            ? "bg-violet-600/10 border-violet-300/50 dark:border-violet-500/30"
                            : "bg-white/60 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-right">
                            <div className="font-semibold">{a.label}</div>
                            <div className="text-xs opacity-70">{a.desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddon(a.key)}
                            aria-label={a.label}
                          />
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {a.perEvent
                            ? `₪${heNumber(a.perEvent)} לאירוע`
                            : null}
                          {a.perHour
                            ? `${a.perEvent ? " · " : ""}₪${heNumber(a.perHour)}/שעה`
                            : null}
                          {a.perPerson
                            ? `${a.perEvent || a.perHour ? " · " : ""}₪${heNumber(a.perPerson)}/לאדם`
                            : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* קופון + מע״מ */}
              <div className="rounded-2xl border dark:border-white/10 p-4">
                <div className="grid md:grid-cols-[1fr_auto] items-center gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm opacity-80">קופון</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="למשל: EARLY10"
                        className="input-base rounded-xl bg-white/70 dark:bg-neutral-950/70 border dark:border-neutral-800/60 input-ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setCoupon(coupon.trim().toUpperCase())}
                        className="rounded-xl border px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 inline-flex items-center gap-2"
                      >
                        אשר <TicketCheck className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs opacity-70">
                      קופונים זמינים לדוגמה: <code>MGMATY5</code>,{" "}
                      <code>EARLY10</code>, <code>COMMUNITY150</code>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 justify-end mt-2 md:mt-5">
                    <input
                      type="checkbox"
                      checked={applyVat}
                      onChange={(e) => setApplyVat(e.target.checked)}
                    />
                    <span className="text-sm opacity-90">כולל מע״מ</span>
                  </label>
                </div>

                {loading && (
                  <div className="mt-3 text-xs opacity-70 inline-flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    בודק קופון…
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* פנל ימני: תוצאה/פירוט */}
          <motion.div {...pop} className="card">
            <header className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-sm opacity-70">הצעת מחיר מיידית</div>
                <h3 className="text-xl font-extrabold">פירוט מלא</h3>
              </div>
              <Percent className="w-6 h-6 opacity-70" />
            </header>

            <div className="mt-4 grid gap-3 text-right">
              {/* סיכום עליון */}
              <div className="rounded-2xl border dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-950/80">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {CATEGORY_LABEL[activeCat]}
                  </div>
                  <div className={`text-3xl font-black ${subtlePulse}`}>
                    ₪{heNumber(calc.total)}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {applyVat
                    ? `כולל מע״מ (${Math.round(VAT_RATE * 100)}%)`
                    : "לא כולל מע״מ"}
                </div>
              </div>

              {/* פירוט */}
              <div className="rounded-2xl border dark:border-white/10 p-4">
                <ul className="text-sm opacity-90 space-y-1">
                  <li className="flex items-center justify-between">
                    <span>בסיס (6 שעות)</span>
                    <span>₪{heNumber(calc.base)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>
                      שעות נוספות ({calc.extraHours} × ₪
                      {heNumber(calc.extraPerHour)})
                    </span>
                    <span>₪{heNumber(calc.hoursExtraTotal)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>תוספת גודל קהל</span>
                    <span>
                      {calc.peopleExtra >= 0 ? "₪" : "–₪"}
                      {heNumber(Math.abs(calc.peopleExtra))}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>מרחק נסיעה</span>
                    <span>₪{heNumber(calc.travel)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>תוספות נבחרות</span>
                    <span>₪{heNumber(calc.addonTotal)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>הנחה/קופון</span>
                    <span>–₪{heNumber(calc.discount)}</span>
                  </li>
                  <li className="border-t dark:border-white/10 my-2" />
                  <li className="flex items-center justify-between">
                    <span>ביניים</span>
                    <span>₪{heNumber(calc.subtotal)}</span>
                  </li>
                  {applyVat && (
                    <li className="flex items-center justify-between">
                      <span>מע״מ</span>
                      <span>₪{heNumber(calc.vat)}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  href={bookHref}
                  className="btn bg-brand text-white border-0 hover:opacity-90 inline-flex items-center gap-2"
                >
                  הזמן עכשיו <Handshake className="w-4 h-4" />
                </Link>
                <Link
                  href={`/pricing/print?cat=${activeCat}`}
                  className="btn inline-flex items-center gap-2"
                >
                  גרסת הדפסה <ArrowRightLeft className="w-4 h-4" />
                </Link>
              </div>

              {/* הערות קטנות */}
              <div className="text-xs opacity-70">
                * המחיר המוצג הינו הערכה ראשונית. הצעת מחיר סופית תישלח לאחר
                קבלת פרטי האירוע המלאים.
              </div>
            </div>
          </motion.div>
        </section>

        {/* ====== טיפים/מידע ====== */}
        <section className="mt-7 grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <CalendarDays className="w-4 h-4" />,
              title: "סגירה מוקדמת משתלמת",
              text: "תאריכים מבוקשים נסגרים מהר. קופוני EARLY עשויים לחסוך 5–10%.",
            },
            {
              icon: <Cpu className="w-4 h-4" />,
              title: "סט-אפ חכם",
              text: "התאמה לחלל/קהל: סאונד ממוקד, מעבר חלק בין סגנונות, דינמיקה נכונה.",
            },
            {
              icon: <Siren className="w-4 h-4" />,
              title: "סופ״ש / ערבי חג",
              text: "קיים ביקוש גבוה ולוגיסטיקה מורכבת — תוספת rushWeekend בקונפיגורטור.",
            },
          ].map((c, i) => (
            <motion.article
              key={i}
              className="rounded-2xl border dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-950/70"
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
            >
              <div className="flex items-start justify-between">
                <div className="text-right">
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-sm opacity-80">{c.text}</div>
                </div>
                <div
                  className={`rounded-full p-2 bg-violet-500/10 text-violet-600 ${glowPulse}`}
                >
                  {c.icon}
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        {/* ====== מרקיז ====== */}
        <section className="mt-8">
          <div className="rounded-2xl border dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-950/70 overflow-hidden">
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

        {/* ====== FAQ מחירון ====== */}
        <section className="mt-8">
          <header className="mb-3 text-right">
            <h3 className="text-xl font-extrabold">שאלות על המחירון</h3>
            <p className="opacity-75 text-sm">הכי שקוף שיש</p>
          </header>
          <div className="grid md:grid-cols-2 gap-3">
            {PRICING_FAQ.map((f, i) => (
              <details
                key={i}
                className="rounded-2xl border dark:border-white/10 p-4 bg-white/80 dark:bg-neutral-950/80"
              >
                <summary className="cursor-pointer font-semibold">
                  {f.q}
                </summary>
                <div className="opacity-80 text-sm leading-7 mt-1">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ====== כיתוב קטן ====== */}
        <div className="mt-6 text-xs opacity-70 text-right">
          * תוספות אפשריות: שעות נוספות, תוספת נגנים, נסיעות, גודל קהל.
          סופ״ש/מועד דחוף עשויים להשפיע.
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   FAQ — ארוך יחסית כדי לתת “בשר” (אפשר להרחיב בהמשך)
   ============================================================================ */
const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "האם המחירים כוללים מע״מ?",
    a: 'ברירת המחדל כאן מציגה מחיר כולל מע״מ, אך ניתן לבטל את סימון "כולל מע״מ" בקונפיגורטור לקבלת מחיר לפני מע״מ.',
  },
  {
    q: "כמה עולה שעה נוספת?",
    a: "בקירוב, ~12% ממחיר הבסיס לשעה נוספת. בקונפיגורטור תראה תוספת מדויקת לפי הקטגוריה.",
  },
  {
    q: "מה עם נסיעות?",
    a: "יש מדרגות לפי ק״מ (עד 10/30/60/100/150/מעל). בחר מרחק משוער ותראה את התוספת המדויקת.",
  },
  {
    q: "האם יש תוספת לסופ״ש/חגים?",
    a: "כן, בקונפיגורטור תוכל להפעיל תוספת rushWeekend. גובה התוספת תלוי בביקוש/לוגיסטיקה.",
  },
  {
    q: "האם אפשר תשלום שלבים/מקדמה?",
    a: "כן. בדרך כלל מקדמה 20–30% לסגירת תאריך, היתרה סמוך לאירוע. אפשר לפרוס לפי צורך.",
  },
  {
    q: "אפשר להתאים את החבילה?",
    a: "בהחלט. אפשר להוסיף/להוריד תוספות, להגדיר זמנים וגודל קהל, ולעדכן לפי חלל האירוע.",
  },
  {
    q: "איך מקבלים הצעת מחיר רשמית?",
    a: "לאחר מילוי הפרטים ושיגור יצירת קשר/הזמנה, נחזור עם מסמך PDF מסודר ופירוט תנאים.",
  },
  {
    q: "האם המחירון קשיח?",
    a: "הוא מהווה בסיס. בפועל אנו גמישים — יעדכנו הצעה לפי פרטים מלאים, תאריך, מרחק וצרכים.",
  },
];
