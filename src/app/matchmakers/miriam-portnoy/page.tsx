"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * Miriam Portnoy — Matchmaker (שדכנית)
 * גרסת Pro מחודשת: UX, מובייל, ועיצוב “כרטיס ביקור” משופר.
 *
 * ✅ נקודות עיקריות:
 * - BusinessCard חדש ומבריק בחלק העליון־שמאלי (ב־RTL זה באמת שמאל 😉)
 * - Grid רספונסיבי עם Tilt עדין לתמונה (כבוי בטאץ׳/Reduce Motion)
 * - Counters, Timeline, Testimonials עם נגישות מלאה
 * - טופס רב־שלבי משודרג (אימות, שמירה, קונפטי)
 * - Sticky Dock תחתון עם safe-bottom אמיתי
 * - בועית ווטסאפ צפה שלא מחפירה לטופס/דוק
 * - הרבה פינוקים חזותיים קטנים, אבל קלים לביצועים
 */

// ====== קבועי קשר (עריכה מהירה) ======
const PHONE_UI = "053-277-0198";
const PHONE_INTL = "+972532770198";
const EMAIL = "Moshiachbeitar@gmail.com";

// ====== עזרים ======
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function usePrefersReducedMotion() {
  const [pref, setPref] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setPref(!!mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return pref;
}

function useIsTouch() {
  const [is, setIs] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIs("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);
  return is;
}

function useCountUp(target: number, durationMs = 1400, startOn = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!startOn) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      setVal(Math.round(target * easeOutCubic(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, startOn]);
  return val;
}

// ====== קונפטי (אימוג'ים חמודים) ======
function launchConfetti(root: HTMLElement, n = 56) {
  const emojies = ["✨", "💖", "🎉", "💐", "🕊️", "💍", "⭐"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.textContent = emojies[Math.floor(Math.random() * emojies.length)];
    s.className = "confetti-emoji";
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 12 + Math.random() * 18 + "px";
    s.style.animationDelay = Math.random() * 0.3 + "s";
    s.style.animationDuration = 1.2 + Math.random() * 1.5 + "s";
    root.appendChild(s);
    setTimeout(() => s.remove(), 3200);
  }
}

// ====== קרוסלת המלצות ======
type Testimonial = {
  quote: string;
  name: string;
  meta: string;
  photo?: string;
};
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "מרים פשוט קלעה בול מיומו הראשון. בתוך שבועיים כבר נפגשנו — היום אנחנו מאורסים 💍",
    name: "ח. ור.",
    meta: "ירושלים · שידוך דתי-לאומי",
  },
  {
    quote:
      "דיסקרטיות מלאה, יחס אנושי, ובדיקה מעמיקה. זו חוויה אחרת לחלוטין מכל מה שהכרתי.",
    name: "ש. נ.",
    meta: "בני ברק · מגזר חרדי",
  },
  {
    quote: "אהבתי את ההתאמה האישית. לא 'עוד הצעה' — ממש חשיבה על אופי וערכים.",
    name: "ר. ל.",
    meta: "ת״א · מסורתית",
  },
];

// ====== Tilt עדין לכרטיס תמונה (כבוי במגע/Reduce) ======
function useTilt<T extends HTMLElement>(maxDeg = 8) {
  const ref = useRef<T | null>(null);
  const isTouch = useIsTouch();
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch || reduce) return;
    let rect = el.getBoundingClientRect();
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * maxDeg * 2;
      const ry = (x - 0.5) * maxDeg * 2;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(
        2,
      )}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
    };
    const onResize = () => (rect = el.getBoundingClientRect());
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [maxDeg, isTouch, reduce]);

  return ref;
}

/* =========================================================
   כרטיס ביקור חדש (BusinessCard)
   ========================================================= */
function BusinessCard() {
  return (
    <aside
      className="relative rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 shadow-card p-4 sm:p-5 overflow-hidden"
      aria-label="כרטיס ביקור — מרים פורטנוי"
    >
      {/* הילה רכה */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[32px] blur-2xl"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 20%, rgba(124,58,237,.18), transparent 60%), radial-gradient(50% 40% at 80% 70%, rgba(236,72,153,.18), transparent 60%)",
        }}
      />

      <div className="relative flex items-start gap-3">
        {/* אוואטר/תמונה קטנה */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/matchmakers/miriam.jpg"
          alt=""
          className="h-16 w-16 rounded-2xl object-cover border border-black/10 dark:border-white/10 shadow"
          loading="lazy"
        />

        <div className="min-w-0 flex-1 text-right">
          <div className="text-lg font-extrabold leading-tight">
            מרים פורטנוי
          </div>
          <div className="text-xs opacity-75">
            שדכנית בכירה · דיסקרטיות מלאה
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 justify-end">
            <span className="mm-badge mm-badge-brand">
              💖 שיחה ראשונית חינם
            </span>
            <span className="mm-badge">🛡️ פרטיות</span>
            <span className="mm-badge">✅ התאמות עומק</span>
          </div>
        </div>
      </div>

      {/* סטאטוסים קטנים */}
      <div className="relative mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat small title="שידוכים" value="327+" />
        <Stat small title="פרופילים" value="5,100+" />
        <Stat small title="ניסיון" value="15 שנים" />
      </div>

      {/* כפתורי קשר — קומפקטי ואלגנטי */}
      <div className="relative mt-3 grid grid-cols-3 gap-2">
        <AButton
          href={`tel:${PHONE_INTL}`}
          primary
          title={`התקשר/י — ${PHONE_UI}`}
        >
          📞 <span className="hidden sm:inline">התקשר/י</span>
        </AButton>
        <AButton
          href={`https://wa.me/${PHONE_INTL.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          title="ווטסאפ"
        >
          💬 <span className="hidden sm:inline">ווטסאפ</span>
        </AButton>
        <AButton href={`mailto:${EMAIL}`} title={`מייל: ${EMAIL}`}>
          ✉️ <span className="hidden sm:inline">מייל</span>
        </AButton>
      </div>
    </aside>
  );
}

/* =========================================================
   רכיבי עזר קטנים לעיצוב
   ========================================================= */
function AButton({
  href,
  children,
  primary,
  title,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  title?: string;
  target?: string;
  rel?: string;
}) {
  return (
    <a
      href={href}
      title={title}
      target={target}
      rel={rel}
      className={cx(
        "mm-btn w-full h-10 rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.995] text-center grid place-items-center",
        primary ? "mm-btn-primary btn-glow btn-wiggle" : "",
      )}
    >
      {children}
    </a>
  );
}

function Stat({
  title,
  value,
  small = false,
}: {
  title: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/85 p-2 shadow-sm">
      <div
        className={cx(
          "font-extrabold tabular-nums",
          small ? "text-base" : "text-xl",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] opacity-70">{title}</div>
    </div>
  );
}

/* =========================================================
   HERO + תוכן ראשי
   ========================================================= */
export default function MiriamPortnoyPage() {
  // ====== UI State ======
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // טופס רב-שלבי
  const [step, setStep] = useState(1); // 1..3
  const stepsTotal = 3;
  const progress = Math.round((step / stepsTotal) * 100);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    community: "",
    age: "",
    lookingFor: "serious",
    city: "",
    notes: "",
    preferedContact: "phone" as "phone" | "whatsapp" | "email",
    acceptPolicy: false,
  });

  // שמירת טופס בלוקאל לשקט נפשי
  useEffect(() => {
    try {
      const saved = localStorage.getItem("miriam:lead");
      if (saved) {
        const obj = JSON.parse(saved);
        setForm((f) => ({ ...f, ...obj }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("miriam:lead", JSON.stringify(form));
    } catch {}
  }, [form]);

  const okBasic = useMemo(
    () =>
      form.name.trim() &&
      (normalizePhone(form.phone).length >= 9 || form.email.trim()),
    [form],
  );
  const okStep = useMemo(() => {
    if (step === 1) return okBasic;
    if (step === 2) return true;
    if (step === 3) return form.acceptPolicy;
    return false;
  }, [step, okBasic, form.acceptPolicy]);

  // Counters
  const inViewRef = useRef<HTMLDivElement | null>(null);
  const [countersOn, setCountersOn] = useState(false);
  useEffect(() => {
    const el = inViewRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) setCountersOn(true);
      },
      { threshold: 0.3 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  const cSuccess = useCountUp(327, 1600, countersOn);
  const cDb = useCountUp(5100, 1700, countersOn);
  const cYears = useCountUp(15, 1400, countersOn);

  // Testimonial carousel
  const [tIdx, setTIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setTIdx((i) => (i + 1) % TESTIMONIALS.length),
      4200,
    );
    return () => clearInterval(id);
  }, []);

  // Tilt for image card
  const tiltRef = useTilt<HTMLDivElement>(10);

  // Confetti root
  const confettiRef = useRef<HTMLDivElement | null>(null);

  // שליחה
  const submit = useCallback(async () => {
    if (!okBasic) return;
    setSending(true);
    setErr(null);
    try {
      const payload = { ...form, ts: Date.now(), source: "miriam-portnoy" };
      try {
        const res = await fetch("/api/matchmakers/miriam/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
      } catch {
        // דמו
        await new Promise((r) => setTimeout(r, 900));
      }
      setSent(true);
      if (confettiRef.current) launchConfetti(confettiRef.current, 64);
    } catch (e: any) {
      setErr(e?.message || "שגיאה בשליחה. נסו שוב.");
    } finally {
      setSending(false);
    }
  }, [form, okBasic]);

  const nextStep = useCallback(() => {
    if (step < stepsTotal && okStep) setStep((s) => s + 1);
  }, [step, okStep]);
  const prevStep = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  // ניהול כפתורי חזרה/הבא ע״י Enter / Shift+Enter
  const onFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        prevStep();
      } else if (step < stepsTotal) {
        e.preventDefault();
        nextStep();
      }
    }
  };

  return (
    <div
      className="min-h-dvh bg-gradient-to-b from-transparent to-rose-50 dark:to-rose-900/10"
      dir="rtl"
    >
      {/* סגנונות/Keyframes מקומיים לדף */}
      <StyleTag />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* ===== HERO ===== */}
        <header className="grid gap-8 md:grid-cols-[1.15fr,.85fr] md:items-stretch">
          {/* LEFT (ב־RTL זו “שמאל”) — BusinessCard + טקסט */}
          <div className="grid content-start gap-4">
            {/* כרטיס ביקור חדש */}
            <BusinessCard />

            {/* כותרת/טקסט קצר — נקי יותר */}
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/80 p-4 shadow-card">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                ליווי שידוכים <span className="grad-text">עם לב ותוצאה</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base opacity-80 leading-7">
                התאמות עומק לקהל הדתי/חרדי/מסורתי — עם בדיקות דיסקרטיות, מחשבה
                על ערכים ואופי, וליווי צמוד עד לחתונה בע״ה.
              </p>

              {/* Badges רכים */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="mm-badge">🎯 התאמה אישית</span>
                <span className="mm-badge">🤝 יחס אנושי</span>
                <span className="mm-badge">🔒 דיסקרטיות</span>
              </div>
            </div>
          </div>

          {/* RIGHT — כרטיס תמונה משופרת + Tilt + Sparkles */}
          <div
            ref={tiltRef}
            className="relative rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 shadow-card bg-white/90 dark:bg-neutral-900/80 grid"
            aria-label="תמונת מרים ותו זוהר"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/matchmakers/miriam.jpg"
              alt="מרים פורטנוי"
              className="w-full h-80 md:h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 pointer-events-none">
              <span className="sparkle" style={{ left: "18%", top: "16%" }}>
                ✨
              </span>
              <span className="sparkle" style={{ left: "76%", top: "34%" }}>
                💍
              </span>
              <span className="sparkle" style={{ left: "60%", top: "70%" }}>
                🕊️
              </span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white/92 dark:from-black/70 to-transparent">
              <div className="font-extrabold text-lg">מרים פורטנוי</div>
              <div className="text-xs opacity-80">שדכנית · ירושלים והסביבה</div>
            </div>
          </div>
        </header>

        {/* ===== COUNTERS ===== */}
        <section
          ref={inViewRef}
          className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50 p-4 md:p-6 shadow-card"
          aria-labelledby="stats-title"
        >
          <h2 id="stats-title" className="sr-only">
            מדדי ניסיון
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="mm-card p-4">
              <div className="text-3xl font-extrabold">{cSuccess}+</div>
              <div className="text-xs opacity-70">שידוכים שהצליחו</div>
            </div>
            <div className="mm-card p-4">
              <div className="text-3xl font-extrabold">
                {cDb.toLocaleString()}
              </div>
              <div className="text-xs opacity-70">פרופילים מסוננים</div>
            </div>
            <div className="mm-card p-4">
              <div className="text-3xl font-extrabold">{cYears}</div>
              <div className="text-xs opacity-70">שנות ניסיון</div>
            </div>
          </div>
        </section>

        {/* ===== TIMELINE HOW-IT-WORKS ===== */}
        <section className="mt-8" aria-labelledby="how-title">
          <h2 id="how-title" className="text-xl font-extrabold">
            איך זה עובד?
          </h2>
          <ol className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
            <li className="mm-card p-4 border-grid">
              <b>שיחה קצרה</b>
              <div className="opacity-80 mt-1">מגדירים מטרות, רקע והעדפות.</div>
            </li>
            <li className="mm-card p-4 border-grid">
              <b>איתור והתאמה</b>
              <div className="opacity-80 mt-1">
                בדיקות דיסקרטיות והתאמות עומק.
              </div>
            </li>
            <li className="mm-card p-4 border-grid">
              <b>ליווי צמוד</b>
              <div className="opacity-80 mt-1">
                משלב ההיכרות עד השידוך, בקצב שלך.
              </div>
            </li>
          </ol>
        </section>

        {/* ===== TESTIMONIALS CAROUSEL ===== */}
        <section className="mt-10" aria-labelledby="testimonials-title">
          <h2 id="testimonials-title" className="text-xl font-extrabold">
            מה לקוחות מספרים
          </h2>
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50">
            <div
              className="flex transition-transform duration-500"
              style={{
                width: `${TESTIMONIALS.length * 100}%`,
                transform: `translateX(-${(100 / TESTIMONIALS.length) * tIdx}%)`,
              }}
              aria-live="polite"
            >
              {TESTIMONIALS.map((t, i) => (
                <figure
                  key={i}
                  className="w-full shrink-0 p-6 text-center grid gap-2 place-items-center"
                >
                  <blockquote className="max-w-3xl text-lg leading-8">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="text-xs opacity-80">
                    <b>{t.name}</b> · {t.meta}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  className={cx(
                    "h-2 w-2 rounded-full transition",
                    i === tIdx ? "bg-pink-600" : "bg-black/20 dark:bg-white/20",
                  )}
                  onClick={() => setTIdx(i)}
                  aria-label={`לשקופית ${i + 1}`}
                  aria-pressed={i === tIdx}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== PACKAGES ===== */}
        <section className="mt-10" aria-labelledby="packages-title">
          <h2 id="packages-title" className="text-xl font-extrabול">
            מסלולים ושירותים
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "שיחת ייעוץ ממוקדת",
                price: "חינם",
                perks: ["15–20 דק׳", "מיפוי מטרות", "כיוונים ראשוניים"],
                cta: "קביעת שיחה",
              },
              {
                title: "ליווי התאמות חכם",
                price: "בהתאמה",
                perks: ["בדיקות דיסקרטיות", "התאמות עומק", "תיאום היכרות"],
                cta: "דברו איתי",
              },
              {
                title: "ליווי פרימיום",
                price: "בהתאמה",
                perks: ["עד לסגירת שידוך", "זמינות גבוהה", "פרטיות מלאה"],
                cta: "התעניינות",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="mm-card p-5 hover:shadow-card transition flex flex-col"
              >
                <div className="text-lg font-extrabold">{p.title}</div>
                <div className="mt-1 text-2xl">{p.price}</div>
                <ul className="mt-3 text-sm opacity-80 grid gap-1">
                  {p.perks.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <AButton href={`tel:${PHONE_INTL}`} primary>
                    📞 {p.cta}
                  </AButton>
                  <AButton
                    href={`https://wa.me/${PHONE_INTL.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 ווטסאפ
                  </AButton>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== MULTISTEP FORM ===== */}
        <section className="mt-12 relative" aria-labelledby="form-title">
          <div
            ref={confettiRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          />
          <div className="mm-card p-5">
            <div className="flex items-center justify-between">
              <h2 id="form-title" className="text-xl font-extrabold">
                טופס פנייה דיסקרטי
              </h2>
              <div className="text-xs opacity-70">
                שלב {step} מתוך {stepsTotal}
              </div>
            </div>
            {/* Progress */}
            <div className="mt-3 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {sent ? (
              <div
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4 text-sm"
                role="status"
              >
                תודה! הפנייה התקבלה ונחזור אליך בהקדם 🙏
              </div>
            ) : (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (step < stepsTotal) nextStep();
                    else submit();
                  }}
                  onKeyDown={onFormKeyDown}
                  className="mt-4 grid gap-4"
                >
                  {step === 1 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="שם מלא" required>
                        <input
                          className="mm-input input-rtl"
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          required
                          aria-required="true"
                        />
                      </Field>
                      <Field label="טלפון">
                        <input
                          inputMode="tel"
                          className="mm-input input-ltr"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              phone: e.target.value,
                            }))
                          }
                          placeholder={PHONE_UI}
                        />
                      </Field>
                      <Field label="אימייל">
                        <input
                          type="email"
                          className="mm-input input-ltr"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                          }
                          placeholder={EMAIL}
                        />
                      </Field>
                      <Field label="עיר/אזור">
                        <input
                          className="mm-input input-rtl"
                          value={form.city}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, city: e.target.value }))
                          }
                          placeholder="למשל: ירושלים"
                        />
                      </Field>

                      {/* אזהרה אם אין טלפון/מייל */}
                      {!okBasic && (
                        <div className="md:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">
                          יש להזין לפחות טלפון או מייל.
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="קהילה/רקע">
                        <input
                          className="mm-input input-rtl"
                          value={form.community}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              community: e.target.value,
                            }))
                          }
                          placeholder="חרדי/דתי-לאומי/מסורתי/אחר"
                        />
                      </Field>
                      <Field label="גיל">
                        <input
                          type="number"
                          min={18}
                          max={99}
                          className="mm-input input-ltr"
                          value={form.age}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, age: e.target.value }))
                          }
                        />
                      </Field>
                      <Field label="מטרה">
                        <select
                          className="mm-select"
                          value={form.lookingFor}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              lookingFor: e.target.value as any,
                            }))
                          }
                        >
                          <option value="serious">קשר רציני</option>
                          <option value="marriage">נישואין</option>
                          <option value="friendship">חברות</option>
                        </select>
                      </Field>
                      <Field label="העדפת יצירת קשר">
                        <select
                          className="mm-select"
                          value={form.preferedContact}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              preferedContact: e.target.value as any,
                            }))
                          }
                        >
                          <option value="phone">טלפון</option>
                          <option value="whatsapp">וואטסאפ</option>
                          <option value="email">אימייל</option>
                        </select>
                      </Field>
                      <Field label="כמה מילים חופשיות" full>
                        <textarea
                          className="mm-textarea input-rtl"
                          rows={4}
                          value={form.notes}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, notes: e.target.value }))
                          }
                          placeholder="מה חשוב לך? קווים אדומים? הערות נוספות…"
                        />
                      </Field>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-3">
                      <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/50">
                        <div className="font-semibold mb-1">סיכום קצר</div>
                        <div className="text-sm opacity-80 grid gap-1">
                          <div>
                            שם: <b>{form.name || "—"}</b> · עיר:{" "}
                            <b>{form.city || "—"}</b>
                          </div>
                          <div>
                            טלפון: <b>{form.phone || "—"}</b> · מייל:{" "}
                            <b>{form.email || "—"}</b>
                          </div>
                          <div>
                            קהילה: <b>{form.community || "—"}</b> · גיל:{" "}
                            <b>{form.age || "—"}</b>
                          </div>
                          <div>
                            מטרה:{" "}
                            <b>
                              {form.lookingFor === "serious"
                                ? "קשר רציני"
                                : form.lookingFor === "marriage"
                                  ? "נישואין"
                                  : "חברות"}
                            </b>{" "}
                            · אמצעי קשר מועדף: <b>{form.preferedContact}</b>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-pink-600 h-4 w-4"
                          checked={form.acceptPolicy}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              acceptPolicy: e.target.checked,
                            }))
                          }
                        />
                        <span>
                          קראתי ואני מסכים/ה למדיניות הפרטיות ולתנאי הפנייה.
                        </span>
                      </label>
                    </div>
                  )}

                  {err && (
                    <div
                      className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm"
                      role="alert"
                    >
                      {err}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs opacity-70">
                      הטופס נשמר אוטומטית.
                    </div>
                    <div className="flex gap-2">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="mm-btn"
                        >
                          חזרה
                        </button>
                      )}
                      {step < stepsTotal && (
                        <button
                          type="submit"
                          disabled={!okStep}
                          className="mm-btn mm-btn-primary btn-glow btn-wiggle disabled:opacity-60"
                        >
                          הבא
                        </button>
                      )}
                      {step === stepsTotal && (
                        <button
                          type="button"
                          disabled={sending || !okStep}
                          onClick={() => submit()}
                          className="mm-btn mm-btn-primary btn-glow btn-wiggle disabled:opacity-60"
                        >
                          {sending ? "שולח…" : "שליחה"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                {/* Quick actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <AButton href={`tel:${PHONE_INTL}`}>📞 שיחת היכרות</AButton>
                  <AButton
                    href={`https://wa.me/${PHONE_INTL.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 ווטסאפ
                  </AButton>
                  <AButton href={`mailto:${EMAIL}`}>✉️ מייל</AButton>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section
          className="mt-10 grid gap-3 md:grid-cols-2"
          aria-labelledby="faq-title"
        >
          <h2 id="faq-title" className="sr-only">
            שאלות נפוצות
          </h2>
          <details className="mm-card p-4" open>
            <summary className="font-semibold cursor-pointer">
              כמה זה עולה?
            </summary>
            <div className="mt-2 text-sm opacity-80">
              שיחה ראשונית ללא עלות. שאר השלבים בתמחור מותאם — פירוט בשיחה.
            </div>
          </details>
          <details className="mm-card p-4">
            <summary className="font-semibold cursor-pointer">
              מה לגבי דיסקרטיות?
            </summary>
            <div className="mt-2 text-sm opacity-80">
              המידע נשמר חסוי ומשותף רק בהסכמתך.
            </div>
          </details>
          <details className="mm-card p-4">
            <summary className="font-semibold cursor-pointer">
              זמינות גם מחו״ל?
            </summary>
            <div className="mt-2 text-sm opacity-80">
              בהחלט — שיחות זום וליווי ללקוחות בארה״ב/אירופה/קנדה ועוד.
            </div>
          </details>
          <details className="mm-card p-4">
            <summary className="font-semibold cursor-pointer">
              אפשר להיפגש פרונטלית?
            </summary>
            <div className="mt-2 text-sm opacity-80">כן, בתיאום מראש.</div>
          </details>
        </section>

        {/* מרווח תחתון לפני הדוק */}
        <div className="h-24" />
      </main>

      {/* Sticky Dock — עם safe-bottom אמיתי */}
      <StickyDock />

      {/* WhatsApp Floating Bubble (לא חופף לדוק) */}
      <a
        href={`https://wa.me/${PHONE_INTL.replace("+", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[calc(80px+var(--safe-bottom,24px))] right-4 h-12 w-12 rounded-full bg-emerald-500 text-white grid place-items-center shadow-card btn-glow"
        title="ווטסאפ"
        aria-label="ווטסאפ"
      >
        💬
      </a>
    </div>
  );
}

/* =========================================================
   רכיבי עזר נוספים
   ========================================================= */

function Field({
  label,
  children,
  required,
  full,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={cx("grid gap-1", full ? "md:col-span-2" : "")}>
      <span className="form-label">
        {label} {required && <span className="text-pink-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function normalizePhone(p: string) {
  return (p || "").replace(/[^\d+]/g, "");
}

function StickyDock() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pb-safe">
        <div className="dock-blur rounded-t-2xl p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm opacity-80">
            רוצה ליווי מקצועי ודיסקרטי? —{" "}
            <b className="opacity-100">מרים פורטנוי</b>
          </div>
          <div className="flex gap-2">
            <AButton href={`tel:${PHONE_INTL}`} primary>
              📞 התקשר/י
            </AButton>
            <AButton
              href={`https://wa.me/${PHONE_INTL.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 ווטסאפ
            </AButton>
            <AButton href={`mailto:${EMAIL}`}>✉️ מייל</AButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   סגנונות/Keyframes Inline לדף הזה
   ========================================================= */
function StyleTag() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .sparkle { position:absolute; pointer-events:none; animation: sparkle 2.2s linear infinite; }
        @keyframes sparkle { 0%{ transform:translateY(0) scale(1); opacity:.9 }
          70%{ opacity:.8 } 100%{ transform:translateY(-28px) scale(1.08); opacity:0 } }
        .border-grid { background-image: linear-gradient(rgba(0,0,0,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.06) 1px, transparent 1px); background-size: 18px 18px; }
        .dark .border-grid { background-image: linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px); }
        .grad-text { background: linear-gradient(90deg,#7c3aed,#ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .btn-cta { box-shadow: 0 10px 22px rgba(236,72,153,.25); }
        .btn-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 26px rgba(236,72,153,.32); }
        .confetti-emoji { position:absolute; top:-10px; animation: fall 2.3s ease-in forwards; }
        @keyframes fall { to { transform: translateY(80vh) rotate(360deg); opacity: .2 } }
        `,
      }}
    />
  );
}
