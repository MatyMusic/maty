// src/components/layout/Footer.tsx
"use client";

import Maty3DAvatar from "@/components/hero/Maty3DAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const MATY_AVATAR_SRC = "/assets/images/maty_clean_transparent.png";

export default function Footer() {
  const router = useRouter();

  const [now, setNow] = React.useState<string>("");
  const [onlineCount, setOnlineCount] = React.useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = React.useState(0);

  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const currentSlide = sliderItems[sliderIndex];

  /* ⏰ שעון ישראל – רענון כל שנייה (קומפקטי) */
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

  /* 👥 מונה אונליין – /api/presence/count */
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
        // שקט – לא מפילים פוטר
      }
    };

    fetchPresence();
    const id = setInterval(fetchPresence, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /* ▶ סליידר אוטומטי */
  React.useEffect(() => {
    const id = setInterval(
      () => setSliderIndex((prev) => (prev + 1) % sliderItems.length),
      8000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-neutral-800/70 bg-gradient-to-t from-black via-neutral-950 to-neutral-900 text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-stretch md:justify-between">
        {/* עמודה 1 – מותג, תמונה קטנה, זכויות (קומפקטי) */}
        <div className="flex flex-1 flex-col gap-3 md:max-w-sm">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-neutral-900/80 px-3 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            אונליין • יקום MATY
          </div>

          <div className="flex items-center gap-2">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-emerald-400/70 bg-neutral-900 shadow-md shadow-emerald-500/25">
              <img
                src={MATY_AVATAR_SRC}
                alt="MATY – M.G"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-0.5 text-[11px]">
              <p className="text-neutral-300">
                ניהול, פיתוח ומוזיקה:{" "}
                <span className="font-semibold text-emerald-300">
                  מתי גורפינקל · MATY
                </span>
              </p>
              <p className="text-[10px] leading-relaxed text-neutral-400">
                MATY-DEV-MUSIC – דיגיטל, מוזיקה, אימונים וקהילה מחוברים.
              </p>
            </div>
          </div>

          <div className="text-[10px] leading-relaxed text-neutral-300/90">
            <p>
              © {currentYear}{" "}
              <span className="font-semibold text-neutral-50">
                כל הזכויות שמורות למתי גורפינקל · MATY-DEV-MUSIC
              </span>
            </p>
            <p>מוזיקה, אימונים וקהילה – אותו מוח, אותה חתימה, אותו מותג.</p>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-neutral-400/90">
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

        {/* עמודה 2 – תלת מימד + סליידר (יותר נמוך) */}
        <div className="flex flex-1 flex-col items-center gap-2 md:max-w-md">
          <div className="w-full max-w-xs md:max-w-sm">
            <Maty3DAvatar />
          </div>

          <div className="w-full max-w-xs md:max-w-sm rounded-2xl bg-neutral-900/95 p-2.5 ring-1 ring-neutral-700/70">
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>MATY • פינה חכמה</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setSliderIndex((prev) =>
                      prev === 0 ? sliderItems.length - 1 : prev - 1,
                    )
                  }
                  className="rounded-full border border-neutral-600/70 px-2 py-0.5 hover:bg-neutral-800/80"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSliderIndex((prev) => (prev + 1) % sliderItems.length)
                  }
                  className="rounded-full border border-neutral-600/70 px-2 py-0.5 hover:bg-neutral-800/80"
                >
                  ▶
                </button>
              </span>
            </div>
            <div className="mt-1.5">
              <p className="text-xs font-semibold text-emerald-300">
                {currentSlide.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-200">
                {currentSlide.text}
              </p>
            </div>
          </div>
        </div>

        {/* עמודה 3 – שעון, אונליין (כפתור), קיצורי ניווט */}
        <div className="flex flex-1 flex-col justify-between gap-3 md:items-end md:text-right">
          <div className="flex flex-wrap items-stretch gap-2">
            {/* שעון ישראל */}
            <div className="flex-1 min-w-[120px] rounded-2xl bg-neutral-900/90 px-3 py-2 text-[11px] ring-1 ring-neutral-700/70">
              <p className="text-[10px] text-neutral-400">שעון ישראל</p>
              <p className="mt-1 text-sm font-mono tracking-widest text-emerald-300">
                {now || "--:--:--"}
              </p>
            </div>

            {/* מונה אונליין – כפתור למי מסביבי ב-CLUB */}
            <button
              type="button"
              onClick={() => router.push("/club?view=nearby")}
              className="flex-1 min-w-[150px] rounded-2xl bg-neutral-900/90 px-3 py-2 text-left text-[11px] ring-1 ring-emerald-700/70 transition hover:bg-neutral-800/90 hover:ring-emerald-400"
            >
              <p className="text-[10px] text-neutral-400">
                נמצאים כרגע ביקום MATY
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">
                {onlineCount === null ? "..." : onlineCount}
                <span className="ml-1 text-[10px] text-neutral-400">
                  משתמשים מחוברים
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-sky-300/80">
                לחיצה תפתח את CLUB ותראה מי באוויר סביבך.
              </p>
            </button>
          </div>

          {/* קיצורי ניווט – גלילה רוחבית במובייל אם צריך */}
          <div className="mt-1 flex w-full max-w-full gap-2 overflow-x-auto pb-1 text-[11px] text-neutral-200 md:justify-end">
            <Link
              href="/fit"
              className="whitespace-nowrap rounded-full bg-emerald-500/15 px-3 py-1 hover:bg-emerald-500/30"
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
