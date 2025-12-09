// src/components/club/LiveFeedBar.tsx
"use client";

import { useClubSocket } from "@/hooks/useClubSocket";
import type { ClubSocketLiveItem } from "@/lib/club/socket-types";
import * as React from "react";

type Props = {
  onJoinLive?: (item: ClubSocketLiveItem) => void;
  title?: string;
  subtitle?: string;
};

function formatDistance(d?: number | null): string | null {
  if (d == null || !Number.isFinite(d)) return null;
  if (d < 0.1) return "מאוד קרוב";
  if (d < 1) return `${(d * 1000).toFixed(0)} מ׳`;
  if (d < 10) return `${d.toFixed(1)} ק״מ`;
  return `${Math.round(d)} ק״מ`;
}

function formatKind(kind?: "public" | "one_to_one" | "friends"): string {
  if (kind === "friends") return "חברים";
  if (kind === "one_to_one") return "1 על 1";
  return "פומבי";
}

export default function LiveFeedBar({ onJoinLive, title, subtitle }: Props) {
  const {
    status: socketStatus,
    liveItems: socketLiveItems,
    liveUpdatedAt,
    lastError,
  } = useClubSocket({
    page: "club",
    autoConnect: true,
  });

  const [httpLiveItems, setHttpLiveItems] = React.useState<
    ClubSocketLiveItem[]
  >([]);
  const [httpLoading, setHttpLoading] = React.useState(false);
  const [httpError, setHttpError] = React.useState<string | null>(null);

  // פולבק ל-HTTP – אם אין עדיין נתונים מסוקט
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setHttpLoading(true);
        setHttpError(null);
        const res = await fetch("/api/club/live/list", {
          method: "GET",
          cache: "no-store",
        });

        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!ct.includes("application/json")) {
          console.error("[LIVE.FEED.BAR] non JSON:", res.status, raw);
          throw new Error("שרת החזיר תוכן לא תקין (LIVE LIST)");
        }

        let j: {
          ok: boolean;
          items?: ClubSocketLiveItem[];
          error?: string;
        };
        try {
          j = JSON.parse(raw);
        } catch (e) {
          console.error("[LIVE.FEED.BAR] json parse error:", raw);
          throw new Error("שגיאה בפענוח LIVE LIST");
        }

        if (!j.ok) {
          throw new Error(j.error || "שגיאה בטעינת שידורים חיים");
        }

        if (!cancelled) {
          setHttpLiveItems(j.items || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setHttpError(e?.message || "שגיאה בטעינת שידורים חיים (HTTP)");
        }
      } finally {
        if (!cancelled) setHttpLoading(false);
      }
    };

    load();
    const id = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const liveItems = socketLiveItems.length ? socketLiveItems : httpLiveItems;
  const hasLive = liveItems.length > 0;

  if (!hasLive && !httpLoading && socketStatus !== "connecting") {
    return null;
  }

  const finalTitle =
    title ||
    (hasLive
      ? "🎥 שידורים חיים מהמכבים עכשיו"
      : "🎥 מחפש שידורים חיים בסביבה…");

  const finalSubtitle =
    subtitle ||
    (hasLive
      ? "בחר מכבי / משתמש בשידור כדי להצטרף לחדר וידאו 1 על 1 או צ׳אט לייב."
      : "ברגע שמישהו מהבולם 6 / מהאזור שלך יוצא לשידור חי – זה יופיע כאן.");

  // פונקציה מרכזית – כשמשתמש לוחץ על אחד מהלייבים
  const handleJoinClick = (u: ClubSocketLiveItem) => {
    // 1. אם העברת onJoinLive מבחוץ – נקרא לה
    if (onJoinLive) {
      onJoinLive(u);
    }
    // 2. נשלח אירוע גלובלי ש-RightSidebar יאזין לו
    if (typeof window !== "undefined") {
      const ev = new CustomEvent("mm:club:open-live", { detail: u });
      window.dispatchEvent(ev);
    }
  };

  return (
    <section className="mb-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900/90 text-neutral-100 px-4 py-3 shadow-lg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -right-16 -top-24 w-64 h-64 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-sky-500/25 blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-red-500/70 bg-red-600/90 px-2 text-[11px] font-semibold uppercase tracking-wide shadow-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
            <span className="text-[13px] font-semibold">{finalTitle}</span>
          </div>
          <p className="text-[11px] opacity-80 max-w-md">{finalSubtitle}</p>
          <div className="mt-0.5 text-[10px] opacity-60 flex flex-wrap gap-2">
            <span>
              סטטוס סוקט:{" "}
              <b>
                {socketStatus === "open"
                  ? "מחובר"
                  : socketStatus === "connecting"
                    ? "מתחבר…"
                    : socketStatus === "error"
                      ? "שגיאה"
                      : socketStatus === "closed"
                        ? "מנותק"
                        : "ממתין"}
              </b>
            </span>
            {liveUpdatedAt && (
              <span>
                רשימת לייב עודכנה:{" "}
                {liveUpdatedAt.toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {lastError && (
              <span className="text-red-300">שגיאת סוקט: {lastError}</span>
            )}
            {httpError && (
              <span className="text-red-300">שגיאת HTTP: {httpError}</span>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1 text-[10px] opacity-80">
          <span>הצטרפות לוידאו רק בהסכמה, אין פתיחת מצלמה אוטומטית.</span>
          <span>בהמשך נוסיף AI שיציע שידורים חמים / נושאים.</span>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-600/60 scrollbar-track-transparent py-1">
        {httpLoading && !hasLive ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-40 h-16 rounded-2xl bg-neutral-800/70 animate-pulse flex-shrink-0"
              />
            ))}
          </>
        ) : !hasLive ? (
          <div className="text-[11px] opacity-80">
            עדיין אין שידורים חיים. ברגע שמכבי יוצא לשידור – נראה אותו כאן.
          </div>
        ) : (
          liveItems.map((u) => {
            const dist = formatDistance(u.distanceKm ?? null);
            const kindLabel = formatKind(u.kind);

            return (
              <button
                key={u._id}
                type="button"
                onClick={() => handleJoinClick(u)}
                className="group flex-shrink-0 w-44 rounded-2xl border border-neutral-600/70 bg-neutral-900/80 hover:bg-neutral-800/90 hover:border-emerald-400/80 transition-colors shadow-md px-2.5 py-2 text-right"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 text-black flex items-center justify-center text-[11px] font-semibold overflow-hidden">
                      {u.userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.userImage}
                          alt={u.userName || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (u.userName || "??").slice(0, 2)
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -left-0.5 px-1 rounded-full bg-red-600 text-[9px] text-white shadow-sm">
                      LIVE
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] font-semibold truncate">
                      {u.userName || "מכבי ללא שם"}
                    </span>
                    <span className="text-[10px] opacity-80 truncate">
                      {u.areaName || "אזור לא ידוע"}
                      {dist ? ` · ${dist}` : ""}
                    </span>
                    <span className="text-[10px] opacity-70">
                      סוג שידור: {kindLabel}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] opacity-75">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:bg-emerald-300 animate-pulse" />
                    <span>הצטרף לשיחת וידאו</span>
                  </span>
                  <span className="group-hover:text-emerald-300">
                    לחץ להצטרפות
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
