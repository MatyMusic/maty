// src/components/layout/Footer.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import * as React from "react";

type SliderItem = {
  id: string;
  title: string;
  text: string;
};

const sliderItems: SliderItem[] = [
  {
    id: "fit",
    title: "MATY-FIT",
    text: "אימונים חכמים לפי הגוף והזמן שיש לך – בלי חפירות, רק תוצאה.",
  },
  {
    id: "music",
    title: "MATY-MUSIC",
    text: "נגן, ביטים והופעות – הכל במקום אחד עם חוויית 3D.",
  },
  {
    id: "club",
    title: "MATY-CLUB",
    text: "קהילה, לייבים, פוסטים ותגובות – מכאן יוצאת האש.",
  },
];

type PresenceResp = {
  ok: boolean;
  count?: number;
};

export default function Footer() {
  const { data: session } = useSession();

  const [now, setNow] = React.useState<string>("");
  const [onlineCount, setOnlineCount] = React.useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = React.useState(0);

  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const currentSlide = sliderItems[sliderIndex];

  // ⏰ שעון ישראל – רענון כל שנייה
  React.useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const s = d.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jerusalem",
      });
      setNow(s);
    };

    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  // 👥 מונה אונליין – מבוסס /api/presence/count
  React.useEffect(() => {
    let cancelled = false;

    const fetchPresence = async () => {
      try {
        const res = await fetch("/api/presence/count");
        if (!res.ok) return;
        const data: PresenceResp = await res.json();
        if (!cancelled && data.ok && typeof data.count === "number") {
          setOnlineCount(data.count);
        }
      } catch {
        // שקט, לא חייב ליפול על זה
      }
    };

    fetchPresence();
    const id = setInterval(fetchPresence, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ▶ סליידר אוטומטי
  React.useEffect(() => {
    const id = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % sliderItems.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // 📸 תמונה שלך – קודם מה-session, אחרת fallback סטטי
  const matyImageUrl =
    (session?.user?.image as string | undefined) ||
    "/assets/avatars/maty-fit.png"; // תדאג שיהיה קובץ כזה ב-public

  return (
    <footer className="border-t border-neutral-800/70 bg-gradient-to-t from-black via-neutral-950 to-neutral-900 text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:items-stretch md:justify-between">
        {/* עמודה 1 – מותג וזכויות */}
        <div className="flex flex-1 flex-col gap-3 md:max-w-xs">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-neutral-900/80 px-3 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/40">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            אונליין • יקום MATY
          </div>

          <div>
            <h2 className="mt-1 text-base font-semibold tracking-tight md:text-lg">
              MATY-MUSIC · MATY-FIT · MATY-CLUB
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-300/90">
              © {currentYear} כל הזכויות שמורות למתי גורפינקל (MATY).
              <br />
              מוזיקה, אימונים וקהילה – אותו מוח, אותה חתימה.
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400/90">
            <span>תנאי שימוש</span>
            <span className="h-1 w-1 rounded-full bg-neutral-600" />
            <span>מדיניות פרטיות</span>
            <span className="h-1 w-1 rounded-full bg-neutral-600" />
            <span>
              קשר:{" "}
              <a
                href="mailto:mtyg7702@gmail.com"
                className="underline underline-offset-2"
              >
                mtyg7702@gmail.com
              </a>
            </span>
          </div>
        </div>

        {/* עמודה 2 – תמונה + סליידר (במרכז במובייל) */}
        <div className="flex flex-1 flex-col items-center gap-3 md:max-w-sm">
          {/* תמונה שלך + טקסט קצר */}
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-emerald-400/60 bg-neutral-900 shadow-lg shadow-emerald-500/25">
              <img
                src={matyImageUrl}
                alt="MATY"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-0.5 text-center text-xs sm:text-right">
              <p className="text-neutral-300">ניהול ויצירה:</p>
              <p className="text-sm font-semibold text-emerald-300">
                מתי גורפינקל · MATY
              </p>
              <p className="text-[11px] text-neutral-400">
                בונה לך יקום של מוזיקה, אימונים וחבר׳ה – הכל מחובר.
              </p>
            </div>
          </div>

          {/* כרטיס סליידר קטן */}
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900/90 p-3 ring-1 ring-neutral-700/70">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>פינה חכמה</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setSliderIndex((prev) =>
                      prev === 0 ? sliderItems.length - 1 : prev - 1,
                    )
                  }
                  className="rounded-full border border-neutral-600/70 px-2 py-0.5"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSliderIndex((prev) => (prev + 1) % sliderItems.length)
                  }
                  className="rounded-full border border-neutral-600/70 px-2 py-0.5"
                >
                  ▶
                </button>
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-semibold text-emerald-300">
                {currentSlide.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-200">
                {currentSlide.text}
              </p>
            </div>
          </div>
        </div>

        {/* עמודה 3 – שעון, אונליין, קיצורי ניווט */}
        <div className="flex flex-1 flex-col justify-between gap-3 md:items-end md:text-right">
          {/* קופסה: שעון + אונליין אחד ליד השני במובייל */}
          <div className="flex flex-wrap items-stretch gap-3">
            <div className="flex-1 min-w-[120px] rounded-2xl bg-neutral-900/90 px-3 py-2 text-xs ring-1 ring-neutral-700/70">
              <p className="text-[11px] text-neutral-400">שעון ישראל</p>
              <p className="mt-1 text-base font-mono tracking-widest text-emerald-300">
                {now || "--:--:--"}
              </p>
            </div>

            <div className="flex-1 min-w-[140px] rounded-2xl bg-neutral-900/90 px-3 py-2 text-xs ring-1 ring-emerald-700/70">
              <p className="text-[11px] text-neutral-400">נמצאים כרגע באתר</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">
                {onlineCount === null ? "..." : onlineCount}
                <span className="ml-1 text-[11px] text-neutral-400">
                  משתמשים מחוברים
                </span>
              </p>
            </div>
          </div>

          {/* קיצורי ניווט – גלילה רוחבית במובייל אם צריך */}
          <div className="mt-1 flex w-full max-w-full gap-2 overflow-x-auto pb-1 text-[11px] text-neutral-200 md:justify-end">
            <Link
              href="/fit"
              className="whitespace-nowrap rounded-full bg-emerלד-500/15 px-3 py-1 hover:bg-emerald-500/30"
            >
              כניסה ל-MATY-FIT
            </Link>
            <Link
              href="/music"
              className="whitespace-nowrap rounded-full bg-sky-500/15 px-3 py-1 hover:bg-sky-500/30"
            >
              נגן המוזיקה
            </Link>
            <Link
              href="/club"
              className="whitespace-nowrap rounded-full bg-fuchsia-500/15 px-3 py-1 hover:bg-fuchsia-500/30"
            >
              מה חדש ב-CLUB
            </Link>
            <Link
              href="/about"
              className="whitespace-nowrap rounded-full bg-neutral-700/40 px-3 py-1 hover:bg-neutral-600/70"
            >
              על MATY
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
