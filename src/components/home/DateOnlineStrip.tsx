// src/components/home/DateOnlineStrip.tsx
"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

/* ================== Types ================== */

type Goal = "serious" | "marriage" | "friendship";

type OnlineUser = {
  id: string;
  name: string;
  age?: number;
  city?: string;
  avatarUrl?: string | null;
  oneLiner?: string | null;
  goals?: Goal | null;
  judaism_direction?: string | null;
};

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

/* ================== DEMO fallback ================== */

const DEMO_USERS: OnlineUser[] = [
  {
    id: "1",
    name: "דנה",
    age: 27,
    city: "ירושלים",
    avatarUrl: "/assets/images/avatar-soft.png",
    oneLiner: "אוהבת ניגונים שקטים ומקפיצים ביחד 🎧",
    goals: "marriage",
    judaism_direction: "חסידי / חב״ד",
  },
  {
    id: "2",
    name: "אורן",
    age: 30,
    city: "תל אביב",
    avatarUrl: "/assets/images/avatar-fun.png",
    oneLiner: "מחפש קשר רציני עם חיבור למוזיקה",
    goals: "serious",
    judaism_direction: "מסורתי",
  },
  {
    id: "3",
    name: "מיכל",
    age: 24,
    city: "פתח תקווה",
    avatarUrl: "/assets/images/avatar-mizrahi.png",
    oneLiner: "שירים מזרחיים, חסידי ואנרגיות טובות",
    goals: "friendship",
    judaism_direction: "דתי לאומי",
  },
];

/* ================== Helpers ================== */

function goalLabel(goal?: Goal | null): string | null {
  if (!goal) return null;
  if (goal === "marriage") return "מטרה: נישואים";
  if (goal === "serious") return "קשר רציני";
  if (goal === "friendship") return "חברות";
  return null;
}

/* ================== Component ================== */

export function DateOnlineStrip() {
  const [users, setUsers] = useState<OnlineUser[]>(DEMO_USERS);
  const [index, setIndex] = useState(0);
  const [openUser, setOpenUser] = useState<OnlineUser | null>(null);
  const [loading, setLoading] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  /* ----- Toasts + Confetti ----- */

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.3 },
      });
    } catch {
      // SSR / אם אין דפדפן – מתעלמים בשקט
    }
  };

  /* ----- טעינת משתמשים "אמיתיים" מהשרת (אופציונלי) ----- */

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await fetch("/api/maty-date/strip", { cache: "no-store" });
        if (!alive) return;
        if (!r.ok) throw new Error("strip " + r.status);
        const j = await r.json().catch(() => null);
        const rows: OnlineUser[] =
          j?.users ||
          j?.items ||
          j?.list?.map((u: any) => ({
            id: String(u.id || u.userId),
            name: String(u.name || u.displayName || "משתמש"),
            age: typeof u.age === "number" ? u.age : undefined,
            city: u.city ?? null,
            avatarUrl: u.avatarUrl ?? u.photos?.[0] ?? null,
            oneLiner: u.oneLiner ?? u.about_me ?? null,
            goals: u.goals ?? null,
            judaism_direction: u.judaism_direction ?? null,
          })) ||
          [];

        if (rows.length) {
          setUsers(rows);
          setIndex(0);
        }
      } catch {
        // אם יש שגיאה – נשארים על DEMO_USERS
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ----- החלפת משתמש כל כמה שניות ----- */

  useEffect(() => {
    if (!users.length) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % users.length);
    }, 8000);
    return () => clearInterval(id);
  }, [users.length]);

  const current = useMemo(
    () => (users.length ? users[index % users.length] : null),
    [users, index],
  );

  /* ----- Actions (קריצה / בקשת קשר / הודעה) ----- */

  async function sendWink(u: OnlineUser) {
    setLoading(true);
    try {
      const r = await fetch("/api/date/wink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // חשוב כדי להעביר קוקיז / סשן
        body: JSON.stringify({ toUserId: u.id }),
      });

      if (r.status === 401) {
        showToast("צריך להתחבר כדי לשלוח קריצה 🙂", "error");
        return;
      }

      if (!r.ok) throw new Error("wink " + r.status);
      await r.json().catch(() => null);

      showToast(`קריצה נשלחה ל־${u.name} בהצלחה ✨`, "success");
      fireConfetti();
    } catch (e) {
      console.error(e);
      showToast("לא הצלחנו לשלוח קריצה, נסה שוב עוד מעט.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function requestContact(u: OnlineUser) {
    setLoading(true);
    try {
      const r = await fetch("/api/date/contact-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // גם כאן
        body: JSON.stringify({ toUserId: u.id }),
      });

      if (r.status === 401) {
        showToast("צריך להתחבר כדי לבקש יצירת קשר 💡", "error");
        return;
      }

      if (!r.ok) throw new Error("contact " + r.status);
      await r.json().catch(() => null);

      showToast(`הבקשה ליצירת קשר ל־${u.name} נשלחה ✅`, "success");
      fireConfetti();
    } catch (e) {
      console.error(e);
      showToast("משהו השתבש בבקשת יצירת הקשר.", "error");
    } finally {
      setLoading(false);
    }
  }

  function sendMessage(u: OnlineUser) {
    // לעתיד: כאן תפתח צ'אט אמיתי / דף הודעות
    showToast(`הודעה מוכנה לשליחה ל־${u.name} 💬`, "success");
    fireConfetti();
  }

  if (!current) return null;

  const currentGoalLabel = goalLabel(current.goals);

  return (
    <>
      {/* פס עליון באתר – סטריפ גולשים */}
      <section
        className="mx-auto max-w-6xl px-4 pb-3 md:pb-4"
        dir="rtl"
        aria-label="משתמשים מחוברים ב-MATY-DATE"
      >
        <div className="rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-black/10 dark:border-white/10 shadow-sm p-2">
          <button
            type="button"
            onClick={() => setOpenUser(current)}
            className="w-full rounded-2xl bg-black/5 dark:bg-white/5 px-3 py-2 text-[11px] md:text-xs flex items-center gap-3 hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            {/* ימין – תמונה + שם + שורה קצרה */}
            <div className="flex items-center gap-2 min-w-0">
              {current.avatarUrl && (
                <img
                  src={current.avatarUrl}
                  alt={current.name}
                  className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/10 flex-shrink-0"
                />
              )}
              <div className="text-right truncate">
                <div className="font-semibold truncate">
                  {current.name}
                  {current.age ? `, ${current.age}` : ""}{" "}
                  {current.city ? `· ${current.city}` : ""}
                </div>
                <div className="opacity-75 truncate">
                  {current.oneLiner || "מחובר/ת עכשיו ל-MATY-DATE."}
                </div>
              </div>
            </div>

            {/* אמצע – באג'ים ממלאים את הרווח */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center text-[10px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 px-2 py-[2px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>מחובר/ת עכשיו</span>
              </span>

              {currentGoalLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/10 px-2 py-[2px]">
                  🎯
                  <span>{currentGoalLabel}</span>
                </span>
              )}

              {current.judaism_direction && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/10 px-2 py-[2px]">
                  🎧
                  <span>סגנון: {current.judaism_direction}</span>
                </span>
              )}
            </div>

            {/* שמאל – טקסט "לחץ לפתיחה" */}
            <div className="flex items-center gap-1 text-[10px] opacity-80">
              <span>לחץ לפתיחה</span>
              <span aria-hidden>↗</span>
            </div>
          </button>
        </div>
      </section>

      {/* מודאל פרופיל קצר + כפתורי פעולה */}
      <AnimatePresence>
        {openUser && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative mx-3 w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xl p-4"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              dir="rtl"
            >
              <button
                type="button"
                onClick={() => setOpenUser(null)}
                className="absolute left-3 top-3 text-xs opacity-70 hover:opacity-100"
                aria-label="סגירה"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-3">
                {openUser.avatarUrl && (
                  <img
                    src={openUser.avatarUrl}
                    alt={openUser.name}
                    className="h-14 w-14 rounded-full object-cover border border-black/10 dark:border-white/10"
                  />
                )}
                <div className="text-right">
                  <div className="text-base font-extrabold">
                    {openUser.name}
                    {openUser.age ? `, ${openUser.age}` : ""}{" "}
                    {openUser.city ? `· ${openUser.city}` : ""}
                  </div>
                  <div className="text-xs opacity-80">
                    {openUser.oneLiner || "מחובר/ת עכשיו ל-MATY-DATE."}
                  </div>
                  {goalLabel(openUser.goals) && (
                    <div className="mt-1 text-[11px] opacity-80">
                      🎯 {goalLabel(openUser.goals)}
                    </div>
                  )}
                  {openUser.judaism_direction && (
                    <div className="text-[11px] opacity-80">
                      🎧 סגנון: {openUser.judaism_direction}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => sendMessage(openUser)}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-sky-600 text-white px-3 py-2 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  💬
                  <span>שליחת הודעה</span>
                </button>
                <button
                  type="button"
                  onClick={() => sendWink(openUser)}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-amber-500 text-white px-3 py-2 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  👀
                  <span>שליחת קריצה</span>
                </button>
                <button
                  type="button"
                  onClick={() => requestContact(openUser)}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  📞
                  <span>בקשת יצירת קשר</span>
                </button>
              </div>

              <div className="mt-3 text-[10px] opacity-70 text-right">
                אחרי שליחת קריצה/בקשה – הצד השני יקבל התראה במערכת. בהמשך אפשר
                לחבר גם שיחה עם שדכנית אנושית.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts – למעלה במסך */}
      <div
        className="fixed top-4 left-1/2 md:left-4 -translate-x-1/2 md:translate-x-0 z-[100] space-y-2"
        dir="rtl"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`max-w-xs rounded-2xl px-3 py-2 text-xs shadow-lg border ${
                t.type === "success"
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-rose-600 text-white border-rose-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden>{t.type === "success" ? "✅" : "⚠️"}</span>
                <span>{t.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
