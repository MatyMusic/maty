"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Shield,
  ShieldAlert,
  HeartHandshake,
  Users2,
  Search,
  Filter,
  KeyRound,
  MessageCircleHeart,
  BookOpenText,
  BrainCircuit,
  LockKeyhole,
  Heart,
  Handshake,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Stars,
  Crown,
  Cpu,
  EyeOff,
} from "lucide-react";

type FAQ = { q: string; a: React.ReactNode; tag?: string };

/** אנימציות בסיס */
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const pop = {
  initial: { opacity: 0, scale: 0.96 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: "easeOut" },
};

/** תוכן שאלות—נפוצות */
const FAQ_ITEMS: FAQ[] = [
  {
    q: "מה זה MATY-DATE ומה מיוחד בו?",
    a: (
      <>
        MATY-DATE הוא מודול התאמות ושידוכים שמחובר לאתר <b>MATY-MUSIC</b>{" "}
        ומכוּון לקהילות חרדיות/חסידיות/דתיות. המערכת משלבת <b>אימות ידני</b>,{" "}
        <b>אלגוריתם התאמה</b> (עם פרמטרים צנועים וקהילתיים), ו<b>פיקוח אנושי</b>{" "}
        — כדי ליצור סביבה נקייה, מכובדת ויעילה.
      </>
    ),
    tag: "כללי",
  },
  {
    q: "איך האלגוריתם בוחר התאמות?",
    a: (
      <>
        האלגוריתם מסתמך על <b>מכנים משותפים</b> כגון: זרם/חסידות, רמת הקפדה,
        טווח גילאים, עיר/אזור (סבסיבה), תחומי עניין, והרגלי מוזיקה (אם המשתמש
        מאשר). בנוסף, נלקחים בחשבון <b>קריטריונים זהירים</b> כמו זמינות לשיחה
        ראשונה, תדירות שימוש, והמלצות שדכנית. אין דירוג מראה/תמונות ואין לייקים
        פומביים.
      </>
    ),
    tag: "אלגוריתם",
  },
  {
    q: "איך נשמרת הצניעות והלימה להלכה?",
    a: (
      <>
        המערכת בנויה על <b>כללי צניעות</b>: אין תוכן לא הולם, אין צ׳אטים פתוחים
        ללא אישור הדדי, <b>מסנן מדיה</b> שמסתיר תמונות כברירת מחדל, והודעות
        נפתחות רק אחרי התאמה הדדית או <b>תיווך שדכנית</b>. מומלץ ליווי/התייעצות
        רב במידת הצורך.
      </>
    ),
    tag: "הלכה",
  },
  {
    q: "איך מתבצע אימות משתמשים?",
    a: (
      <>
        <b>אימות רב-שלבי</b>: (1) אימות טלפון; (2) אימות מייל; (3) אישור ידני על
        ידי צוות/שדכנית לפי שיקולי קהילה; (4) אופציה לאימות מסגרת/תעסוקה.
        משתמשים שלא עומדים במדיניות נחסמים. מאושרים מקבלים <b>סימון אימות</b>{" "}
        ב-פרופיל.
      </>
    ),
    tag: "אבטחה",
  },
  {
    q: "מה ההבדל בין התאמה ישירה לשידוך מתווך?",
    a: (
      <>
        <b>התאמה ישירה</b> — האלגוריתם מציע התאמות, והצדדים בוחרים אם לפתוח
        שיחה. <b>שידוך מתווך</b> — שדכנית/רכזת בודקת נתונים ומבצעת היכרות
        בשלבים. ניתן לבחור מצב מועדף.
      </>
    ),
    tag: "תהליך",
  },
  {
    q: "האם יש עלות?",
    a: (
      <>
        יש <b>מסלול חינמי</b> בסיסי (כמות התאמות מוגבלת) ו<b>מסלול תומך</b>{" "}
        (פרימיום) עם תעדוף התאמות, תמיכה אנושית, ותובנות סטטיסטיות (ללא חשיפה
        רגישת). המחירון יפורסם.
      </>
    ),
    tag: "מסלולים",
  },
  {
    q: "מה המדיניות מול תמונות/וידאו?",
    a: (
      <>
        ברירת המחדל: <b>ללא תמונות פומביות</b>. שיתוף מדיה רק לאחר התאמה הדדית
        ובאישור המקבל/ת. יש מסנן אוטומטי + דיווח מהיר. אין פידים/טיקטוק/לייקים
        ציבוריים.
      </>
    ),
    tag: "מדיה",
  },
  {
    q: "איך מתבצע מענה לשוני (קהילה רוסית, אנגלית ועוד)?",
    a: (
      <>
        תמיכה רב־לשונית (עברית/אנגלית/רוסית) + <b>מתאמי קהילה</b> לגישור
        תרבותי/שפתי. ניתן לבחור שפה בהגדרות החשבון.
      </>
    ),
    tag: "שפות",
  },
  {
    q: "מי עומד מאחורי המערכת?",
    a: (
      <>
        צוות <b>MATY-MUSIC</b> יחד עם רכזי קהילה ושדכנית מלווה. המטרה:{" "}
        <b>קהילה נקייה</b>, רצינית ואיכותית.
      </>
    ),
    tag: "צוות",
  },
  {
    q: "איך מדווחים על משתמש/תוכן?",
    a: (
      <>
        בכל פרופיל/שיחה יש <b>כפתור דיווח</b>. צוות המודרציה יבחן במהירות—כולל
        חסימות, אזהרות או הסרת תוכן. אפשר גם לפנות ל־
        <Link className="underline" href="/contact">
          צור קשר
        </Link>
        .
      </>
    ),
    tag: "דיווח",
  },
];

const TAGS = [
  "הכל",
  "כללי",
  "אלגוריתם",
  "הלכה",
  "אבטחה",
  "תהליך",
  "מסלולים",
  "מדיה",
  "שפות",
  "צוות",
  "דיווח",
] as const;
type TagKey = (typeof TAGS)[number];

export default function MatyDateFaqClient() {
  const [activeTag, setActiveTag] = useState<TagKey>("הכל");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const list = useMemo(
    () => FAQ_ITEMS.filter((f) => activeTag === "הכל" || f.tag === activeTag),
    [activeTag],
  );

  return (
    <main
      dir="rtl"
      className="min-h-dvh section-padding bg-gradient-to-b from-white to-violet-50/30 dark:from-neutral-950 dark:to-violet-950/10"
    >
      {/* רקעי אנימציה עדינים */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes glow { 0%,100%{ filter: drop-shadow(0 0 0 rgba(109,74,255,0)); } 50%{ filter: drop-shadow(0 0 16px rgba(109,74,255,.35)); } }
          @keyframes floaty { 0%{ transform:translateY(0) } 50%{ transform:translateY(-8px) } 100%{ transform:translateY(0) } }
          @keyframes shake { 0%,100%{ transform:translate3d(0,0,0) } 25%{ transform:translate3d(-1px,0,0) } 75%{ transform:translate3d(1px,0,0) } }
          .glow { animation: glow 2.6s ease-in-out infinite; }
          .floaty { animation: floaty 7s ease-in-out infinite; }
          .shake-soft:hover { animation: shake .35s ease-in-out; }
        `,
        }}
      />

      <div className="container-section">
        {/* HERO */}
        <motion.section
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl border dark:border-neutral-800/60 bg-white/90 dark:bg-neutral-950/80 backdrop-blur p-6 sm:p-8"
        >
          <div
            aria-hidden
            className="absolute -z-10 inset-x-0 -top-20 mx-auto h-[220px] w-[min(100%,900px)] rounded-[56px] blur-3xl
                       bg-[radial-gradient(60%_60%_at_50%_50%,rgba(109,74,255,.25),rgba(109,74,255,0)_65%)] glow"
          />
          <div className="flex items-start justify-between gap-4">
            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border dark:border-white/10 bg-white/70 dark:bg-neutral-950/70">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span className="text-xs opacity-80">
                  שאלות ותשובות • MATY-DATE
                </span>
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
                שידוכים—בזהירות, בניקיון, ובטכנולוגיה שמכבדת קהילה
              </h1>
              <p className="opacity-80 mt-1">
                פתרון התאמות לקהילות <b>חרדיות/חסידיות/דתיות</b>—עם אימות ידני,
                מודרציה, וכלים שמונעים תופעות לא רצויות. בלי פיד רועש, בלי
                לייקים, בלי שופוני—רק מה שצריך כדי להכיר <b>למטרת שידוכים</b>.
              </p>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <a
                  href="/date"
                  className="btn bg-brand text-white border-0 hover:opacity-90 inline-flex items-center gap-2"
                >
                  התחל/י רישום <ChevronLeft className="w-4 h-4" />
                </a>
                <Link
                  href="/contact"
                  className="btn inline-flex items-center gap-2"
                >
                  צור קשר <MessageCircleHeart className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="rounded-2xl border dark:border-neutral-800/60 px-4 py-3 bg-white/80 dark:bg-neutral-950/70 floaty">
                <div className="text-xs opacity-70">מצב רשת</div>
                <div className="text-lg font-extrabold flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  <span>קהילה בטוחה</span>
                </div>
                <div className="text-[11px] opacity-70 mt-1">
                  אימות ידני • מודרציה • נהלי צניעות
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3 עקרונות */}
        <section className="grid md:grid-cols-3 gap-4 mt-6">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
              title: "אימות ומשמעת קהילתית",
              text: "כל הצטרפות מאושרת ידנית. דיווחים מטופלים במהירות. אין סובלנות לתוכן/שיח לא הולם.",
            },
            {
              icon: <BrainCircuit className="w-5 h-5 text-violet-600" />,
              title: "אלגוריתם זהיר",
              text: "התאמות לפי מכנים משותפים קהילתיים: זרם/חסידות, הקפדה, עיר/אזור, ועוד. בלי דירוג מראה.",
            },
            {
              icon: <EyeOff className="w-5 h-5 text-sky-600" />,
              title: "פרטיות וצניעות",
              text: "ברירת מחדל ללא תמונות פומביות. פתיחת שיחה/מדיה—רק אחרי התאמה הדדית או דרך שדכנית.",
            },
          ].map((c, i) => (
            <motion.article key={i} {...pop} className="card text-right">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <p className="text-sm opacity-80">{c.text}</p>
                </div>
                <div className="rounded-full p-2 bg-white/70 dark:bg-neutral-900/70 border dark:border-neutral-800/60 glow">
                  {c.icon}
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        {/* איך זה עובד */}
        <motion.section {...fadeUp} className="mt-8 card">
          <header className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-sm opacity-70">התהליך</div>
              <h2 className="text-xl font-extrabold">איך זה עובד?</h2>
            </div>
            <Cpu className="w-6 h-6 opacity-70" />
          </header>

          <ol className="mt-4 grid md:grid-cols-5 gap-3 text-right">
            {[
              {
                t: "הרשמה מאומתת",
                i: <KeyRound className="w-4 h-4" />,
                d: "מילוי פרטים צנועים + אימות טלפון/מייל. בקשה נשלחת לאישור ידני.",
              },
              {
                t: "הגדרות קהילה",
                i: <Filter className="w-4 h-4" />,
                d: "הגדרת זרם/חסידות, רמת הקפדה, תחומי עניין, אזור מגורים ועוד.",
              },
              {
                t: "התאמות זהירות",
                i: <Search className="w-4 h-4" />,
                d: "האלגוריתם מציע התאמות לפי מכנים משותפים; ניתן לבקש שידוך מתווך.",
              },
              {
                t: "פתיחת שיחה עדינה",
                i: <MessageCircleHeart className="w-4 h-4" />,
                d: "שיחה נפתחת רק בהסכמה הדדית/שדכנית. מדיה—רק באישור.",
              },
              {
                t: "ליווי אנושי",
                i: <Handshake className="w-4 h-4" />,
                d: "בכל שלב ניתן לערב שדכנית או רכז/ת קהילה—בדיסקרטיות מלאה.",
              },
            ].map((s, idx) => (
              <li
                key={idx}
                className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{s.t}</div>
                  <div className="rounded-full p-2 bg-violet-500/10 text-violet-600">
                    {s.i}
                  </div>
                </div>
                <p className="text-sm opacity-80 mt-1">{s.d}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* אזור: על מרים פורטנוי */}
        <motion.section {...fadeUp} className="mt-8 card">
          <header className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-sm opacity-70">שדכנית/רכזת קהילה</div>
              <h2 className="text-xl font-extrabול">
                כמה מילים על מרים פורטנוי
              </h2>
            </div>
            <Crown className="w-6 h-6 text-amber-500 glow" />
          </header>

          <div className="mt-3 grid md:grid-cols-[1fr_2fr] gap-4 items-start">
            <div className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70">
              <div className="text-sm opacity-80">
                מרים פורטנוי ידועה בקהילה כמי שמקדישה זמן ומחשבה ל
                <b>חיבורים נכונים</b>, בשקט ובצניעות, עם רגישות גבוהה לרקע
                תרבותי ולשוני—בפרט לקהילה דוברת הרוסית. <br />
                הניסיון הרב שלה בהיכרות ובתיאום ציפיות מסייע להפוך תהליכים
                למדויקים יותר ולחסוך אי-נעימויות.
              </div>
              <div className="text-xs opacity-60 mt-2">
                * תיאור כללי לפי בקשתך; ללא פרטים מזהים/רגישים.
              </div>
            </div>

            <div className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70">
              <ul className="text-sm opacity-90 space-y-1">
                <li className="flex items-center justify-end gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ליווי דיסקרטי ורגיש מבחינה קהילתית</span>
                </li>
                <li className="flex items-center justify	end gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>חיזוק גישור לשוני/תרבותי לקהילה הרוסית</span>
                </li>
                <li className="flex items-center justify-end gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>התאמה בין-קהילתית תוך שמירה על קווי צניעות</span>
                </li>
              </ul>

              <div className="mt-3 flex justify-end">
                <Link href="/contact" className="btn">
                  בקשת תיאום שיחה
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* הלכה/פרטיות/אבטחה */}
        <section className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <BookOpenText className="w-5 h-5" />,
              title: "מסגרת הלכתית וצניעות",
              text: "אין פידים ציבוריים; חשיפה מינימלית; הגדרות צניעות מחמירות זמינות.",
            },
            {
              icon: <LockKeyhole className="w-5 h-5" />,
              title: "פרטיות ואישורים",
              text: "מדיה נפתחת רק בהסכמה; פרטי קשר מוסתרים; אפשר לנעול חשבון לתצוגה חלקית.",
            },
            {
              icon: <ShieldAlert className="w-5 h-5" />,
              title: "מודרציה ודיווח",
              text: "כפתור דיווח בכל פרופיל. הפרות—נחסמות. לוג ביקורת פנימי פעיל.",
            },
          ].map((b, i) => (
            <motion.article
              key={i}
              {...pop}
              className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70"
            >
              <div className="flex items-start justify-between">
                <div className="text-right">
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-sm opacity-80">{b.text}</div>
                </div>
                <div className="rounded-full p-2 bg-violet-500/10 text-violet-600 glow">
                  {b.icon}
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        {/* סינון FAQ לפי תגיות */}
        <motion.section {...fadeUp} className="mt-8 card">
          <header className="flex items-center justify-between">
            <div className="text-right">
              <div className="text-sm opacity-70">שאלות נפוצות</div>
              <h2 className="text-xl font-extrabold">FAQ — הכל על MATY-DATE</h2>
            </div>
            <Stars className="w-6 h-6 opacity-70" />
          </header>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {(TAGS as readonly string[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t as TagKey)}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm border transition",
                  activeTag === t
                    ? "bg-violet-600 text-white border-violet-700 hover:brightness-110"
                    : "bg-white/70 dark:bg-neutral-950/60 border-neutral-200/70 dark:border-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-900/80",
                ].join(" ")}
                aria-pressed={activeTag === t}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {list.map((item, idx) => {
                const open = openIndex === idx;
                return (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl border dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 overflow-hidden"
                  >
                    <button
                      className="w-full text-right flex items-center justify-between gap-3 px-4 py-3 hover:bg-white dark:hover:bg-neutral-900/70 shake-soft"
                      onClick={() => setOpenIndex(open ? null : idx)}
                      aria-expanded={open}
                    >
                      <span className="font-semibold">{item.q}</span>
                      {open ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="px-4 pb-4 text-sm opacity-85"
                        >
                          {item.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* קוד אתיקה קצר */}
        <section className="mt-8 grid md:grid-cols-2 gap-4">
          <motion.article
            {...pop}
            className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70"
          >
            <header className="flex items-center justify-between">
              <div className="font-semibold">קוד קהילתי</div>
              <Heart className="w-5 h-5 text-rose-500 glow" />
            </header>
            <ul className="mt-2 text-sm opacity-90 space-y-1">
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>שיח מכבד בלבד • אין שידול/לחץ אישי</span>
              </li>
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>אין שיתוף פרטים אישיים רגישים ללא צורך</span>
              </li>
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>לא מפרסמים תמונות/וידאו ללא הסכמה מפורשת</span>
              </li>
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>דיווח מיידי על פגיעה/הטרדה • אפס סובלנות</span>
              </li>
            </ul>
          </motion.article>

          <motion.article
            {...pop}
            className="rounded-2xl border dark:border-neutral-800/60 p-4 bg-white/70 dark:bg-neutral-950/70"
          >
            <header className="flex items-center justify-between">
              <div className="font-semibold">פרטיות ואבטחה</div>
              <Shield className="w-5 h-5 text-sky-600 glow" />
            </header>
            <ul className="mt-2 text-sm opacity-90 space-y-1">
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>נתונים רגישים מוצפנים במעבר • גישה מוגבלת בצוות</span>
              </li>
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>יומני ביקורת לפעולות חריגות • חסימות מהירות</span>
              </li>
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>בחירת רמת חשיפה • מסנן מדיה כברירת מחדל</span>
              </li>
              <li className="flex items-center justify-end gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>אפשרות בקשה למחיקה/יצוא נתונים בהתאם חוק</span>
              </li>
            </ul>
          </motion.article>
        </section>

        {/* CTA סיום */}
        <motion.section
          {...fadeUp}
          className="mt-8 rounded-3xl border dark:border-neutral-800/60 bg-white/90 dark:bg-neutral-950/80 backdrop-blur p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="text-right">
              <div className="text-sm opacity-70">מוכנים להתחיל?</div>
              <h3 className="text-xl font-extrabold">
                הצטרפו ל-MATY-DATE — נקי, צנוע, ומדויק
              </h3>
              <p className="text-sm opacity-80">
                הרשמה מאומתת, התאמות זהירות, ושיח מכבד. אפשר לבחור מסלול חינמי
                או תומך, ולעבור בכל שלב לשידוך מתווך עם שדכנית.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href="/date"
                className="btn bg-brand text-white border-0 hover:opacity-90 inline-flex items-center gap-2"
              >
                התחל/י רישום <ChevronLeft className="w-4 h-4" />
              </a>
              <Link
                href="/contact"
                className="btn inline-flex items-center gap-2"
              >
                דברו איתנו <MessageCircleHeart className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* שורה קטנה */}
        <div className="mt-6 text-[11px] opacity-70 text-right">
          * MATY-DATE אינו תחליף לייעוץ הלכתי. מומלץ להתייעץ עם סמכות רבנית
          במידת הצורך.
        </div>
      </div>
    </main>
  );
}
