"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile, Direction } from "@/types/date";
import { DIR_LABEL } from "@/types/date";

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function ageFromDOB(dob?: string) {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  const mNow = now.getMonth() + 1;
  const dNow = now.getDate();
  if (mNow < m || (mNow === m && dNow < d)) age--;
  return age;
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-2">
      <div className="w-28 shrink-0 text-xs text-neutral-500">{label}</div>
      <div className="text-sm leading-5">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border",
        tone === "ok" &&
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40",
        tone === "warn" &&
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40",
        tone === "default" &&
          "bg-white/80 text-neutral-700 border-black/10 dark:bg-neutral-900/70 dark:text-neutral-200 dark:border-white/10"
      )}
    >
      {children}
    </span>
  );
}

function ImageLightbox({
  urls,
  openIndex,
  onClose,
}: {
  urls: string[];
  openIndex: number;
  onClose: () => void;
}) {
  const [i, setI] = React.useState(openIndex);
  React.useEffect(() => setI(openIndex), [openIndex]);

  function next() {
    setI((p) => (p + 1) % urls.length);
  }
  function prev() {
    setI((p) => (p - 1 + urls.length) % urls.length);
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm">
      <button
        className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
        title="סגור"
      >
        ✕
      </button>
      <div className="h-full grid place-items-center p-4">
        <div className="relative max-w-5xl w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[i]}
            alt=""
            className="w-full max-h-[80vh] object-contain rounded-2xl"
          />
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <button
              onClick={prev}
              className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              title="הקודם"
            >
              ←
            </button>
            <button
              onClick={next}
              className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              title="הבא"
            >
              →
            </button>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs">
            {i + 1} / {urls.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileView({
  profile,
  onLike,
  onWink,
  onMessage,
  onVideo,
  onReport,
  onBlock,
}: {
  profile: Profile;
  onLike?: (userId: string) => void;
  onWink?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onVideo?: (userId: string) => void;
  onReport?: (userId: string) => void;
  onBlock?: (userId: string) => void;
}) {
  const age = ageFromDOB(profile.birthDate);
  const [openLightbox, setOpenLightbox] = React.useState<null | number>(null);

  const infoChips = [
    age ? `${age}` : null,
    profile.city ? profile.city : null,
    profile.country ? profile.country : null,
  ].filter(Boolean) as string[];

  return (
    <div
      dir="rtl"
      className="rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-gradient-to-b from-white to-violet-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      {/* כותרת */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl || "/avatar-fallback.png"}
            alt={profile.displayName}
            className="size-20 sm:size-24 rounded-2xl object-cover border border-black/10 dark:border-white/10"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold">{profile.displayName}</h1>
              {profile.verified && <Pill tone="ok">מאומת/ת</Pill>}
              {profile.online ? (
                <Pill tone="ok">מחובר/ת עכשיו</Pill>
              ) : (
                <Pill tone="default">
                  נראה/ית לאחרונה:{" "}
                  {profile.lastActive
                    ? new Date(profile.lastActive).toLocaleString()
                    : "—"}
                </Pill>
              )}
              {typeof profile.matchScore === "number" && (
                <Pill tone={profile.matchScore >= 70 ? "ok" : "default"}>
                  התאמה {profile.matchScore}%
                </Pill>
              )}
              {profile.tier && <Pill>דרגה: {profile.tier.toUpperCase()}</Pill>}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {infoChips.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full border text-[11px] bg-white/80 dark:bg-neutral-900/70 border-black/10 dark:border-white/10"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* כפתורי פעולה */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="h-10 px-4 rounded-full bg-pink-600 text-white hover:bg-pink-700"
                onClick={() => onLike?.(profile.userId)}
              >
                ❤️ לייק
              </button>
              <button
                className="h-10 px-4 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
                onClick={() => onWink?.(profile.userId)}
              >
                😉 קריצה
              </button>
              <button
                className="h-10 px-4 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
                onClick={() => onMessage?.(profile.userId)}
              >
                💬 הודעה
              </button>
              <button
                className="h-10 px-4 rounded-full bg-violet-600 text-white hover:bg-violet-700"
                onClick={() => onVideo?.(profile.userId)}
              >
                🎥 וידאו
              </button>
              <button
                className="h-10 px-4 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10"
                onClick={() => {
                  navigator.clipboard
                    .writeText(window.location.href)
                    .catch(() => {});
                }}
              >
                🔗 שיתוף קישור
              </button>
              <div className="flex-1" />
              <button
                className="h-10 px-4 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:text-rose-600"
                onClick={() => onReport?.(profile.userId)}
                title="דיווח"
              >
                🚩 דווח/י
              </button>
              <button
                className="h-10 px-4 rounded-full border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:text-rose-600"
                onClick={() => onBlock?.(profile.userId)}
                title="חסימה"
              >
                ⛔ חסום/י
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* גלריה */}
      {!!profile.photos?.length && (
        <div className="px-5 sm:px-6 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {profile.photos.map((u, i) => (
              <button
                key={u}
                className="group relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70"
                onClick={() => setOpenLightbox(i)}
                title="להגדלה"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u}
                  alt=""
                  className="aspect-square w-full object-cover group-hover:scale-[1.02] transition"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* פרטים */}
      <div className="p-5 sm:p-6">
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4">
          <FieldRow label="עליי">
            <div className="text-sm whitespace-pre-wrap">
              {profile.about_me || "—"}
            </div>
          </FieldRow>

          <FieldRow label="זרם">
            <div>
              {profile.judaism_direction
                ? DIR_LABEL[profile.judaism_direction as Direction]
                : "—"}
            </div>
          </FieldRow>

          <FieldRow label="כשרות / שבת">
            <div className="flex flex-wrap gap-2">
              <Pill>
                {profile.kashrut_level
                  ? `כשרות: ${labelLevel(profile.kashrut_level)}`
                  : "—"}
              </Pill>
              <Pill>
                {profile.shabbat_level
                  ? `שבת: ${labelLevel(profile.shabbat_level)}`
                  : "—"}
              </Pill>
            </div>
          </FieldRow>

          <FieldRow label="מטרה">
            <div>{profile.goals ? goalLabel(profile.goals) : "—"}</div>
          </FieldRow>

          <FieldRow label="שפות">
            <div className="flex flex-wrap gap-1.5">
              {profile.languages?.length
                ? profile.languages.map((l) => <Pill key={l}>{l}</Pill>)
                : "—"}
            </div>
          </FieldRow>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {openLightbox !== null && profile.photos?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ImageLightbox
              urls={profile.photos}
              openIndex={openLightbox}
              onClose={() => setOpenLightbox(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function labelLevel(l?: string | null) {
  if (!l) return "";
  if (l === "strict") return "קפדני";
  if (l === "partial") return "חלקי";
  return "לא שומר/ת";
}
function goalLabel(g?: string | null) {
  if (!g) return "";
  if (g === "serious") return "קשר רציני";
  if (g === "marriage") return "נישואין";
  return "חברות";
}
