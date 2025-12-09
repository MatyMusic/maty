// src/app/club/my-posts/MyPostsClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Images,
  Music4,
  Film,
  MapPin,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from "lucide-react";
import { type ClubPost } from "@/lib/clubStore";

type Props = {
  initialItems: ClubPost[];
};

type Filter = "all" | "approved" | "pending" | "rejected";

function StatusPill({ status }: { status: ClubPost["status"] }) {
  const map: Record<
    ClubPost["status"],
    { text: string; cls: string; icon: React.ReactNode }
  > = {
    approved: {
      text: "מאושר",
      cls: "text-emerald-700 border-emerald-300/60",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    pending: {
      text: "ממתין",
      cls: "text-amber-700 border-amber-300/60",
      icon: <Hourglass className="w-3.5 h-3.5" />,
    },
    rejected: {
      text: "נדחה",
      cls: "text-rose-700 border-rose-300/60",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${m.cls}`}
    >
      {m.icon}
      {m.text}
    </span>
  );
}

function VisibilityPill({ v }: { v: ClubPost["visibility"] }) {
  const isVis = v === "visible";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]">
      {isVis ? (
        <Eye className="w-3.5 h-3.5" />
      ) : (
        <EyeOff className="w-3.5 h-3.5" />
      )}
      {isVis ? "נראה בפיד" : "שמור פרטית"}
    </span>
  );
}

function AudiencePill({ a }: { a: ClubPost["audience"] }) {
  const txt =
    a === "public"
      ? "ציבורי"
      : a === "community"
        ? "קהילה"
        : a === "private"
          ? "פרטי"
          : "שדכנית";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]">
      {txt}
    </span>
  );
}

function ModeBadge({ m }: { m: ClubPost["mode"] }) {
  const map: Record<ClubPost["mode"], { icon: React.ReactNode; text: string }> =
    {
      post: { icon: <Images className="w-3.5 h-3.5" />, text: "פוסט" },
      audio: { icon: <Music4 className="w-3.5 h-3.5" />, text: "אודיו" },
      poll: { icon: <Hash className="w-3.5 h-3.5" />, text: "סקר" },
    };
  const mapp = map[m];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]">
      {mapp.icon}
      {mapp.text}
    </span>
  );
}

export default function MyPostsClient({ initialItems }: Props) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const counts = React.useMemo(() => {
    const base = {
      all: initialItems.length,
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    for (const p of initialItems) {
      // @ts-expect-error narrow
      base[p.status] += 1;
    }
    return base;
  }, [initialItems]);

  const items = React.useMemo(() => {
    if (filter === "all") return initialItems;
    return initialItems.filter((p) => p.status === filter);
  }, [filter, initialItems]);

  return (
    <div className="grid gap-3">
      {/* Filters */}
      <div className="rounded-2xl border dark:border-white/10 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold">סינון</div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1 text-xs border ${filter === "all" ? "bg-violet-600 text-white border-violet-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
            >
              הכל ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilter("approved")}
              className={`rounded-full px-3 py-1 text-xs border ${filter === "approved" ? "bg-violet-600 text-white border-violet-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
            >
              מאושרים ({counts.approved})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-full px-3 py-1 text-xs border ${filter === "pending" ? "bg-violet-600 text-white border-violet-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
            >
              ממתינים ({counts.pending})
            </button>
            <button
              type="button"
              onClick={() => setFilter("rejected")}
              className={`rounded-full px-3 py-1 text-xs border ${filter === "rejected" ? "bg-violet-600 text-white border-violet-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
            >
              נדחים ({counts.rejected})
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-2xl border dark:border-white/10 p-6 text-center text-sm opacity-80">
          אין פוסטים להצגה במסנן הנוכחי.
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border dark:border-white/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModeBadge m={p.mode} />
                    <StatusPill status={p.status} />
                    <VisibilityPill v={p.visibility} />
                    <AudiencePill a={p.audience} />
                    {p.scheduleISO ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        מתוזמן ל־
                        {new Date(p.scheduleISO)
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 16)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-sm whitespace-pre-wrap break-words">
                    {p.text || <span className="opacity-60">— ללא טקסט —</span>}
                  </div>

                  {p.hashtags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.hashtags.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] rounded-full border px-2 py-0.5"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {p.location ? (
                    <div className="mt-2 text-xs opacity-80 inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      lat {p.location.lat.toFixed(5)} • lon{" "}
                      {p.location.lon.toFixed(5)}
                    </div>
                  ) : null}

                  {p.videoUrl ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs">
                      <Film className="w-3.5 h-3.5" />
                      <a
                        href={p.videoUrl}
                        target="_blank"
                        className="underline"
                      >
                        קישור לווידאו
                      </a>
                    </div>
                  ) : null}
                  {p.audioUrl ? (
                    <div className="mt-2">
                      <audio controls src={p.audioUrl} className="w-full">
                        הדפדפן לא תומך בנגן האודיו.
                      </audio>
                    </div>
                  ) : null}
                </div>

                <div className="text-xs whitespace-nowrap opacity-70 text-left">
                  נוצר:{" "}
                  {new Date(p.createdAt)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 16)}
                </div>
              </div>

              {p.images?.length ? (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {p.images.map((src, i) => (
                    <div
                      key={src + i}
                      className="rounded-xl overflow-hidden border dark:border-white/10"
                    >
                      <img
                        src={src}
                        alt={`img ${i + 1}`}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* Bottom nav */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Link
          href="/club"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          ← חזרה לפיד
        </Link>
        <Link
          href="/club/compose"
          className="rounded-xl bg-violet-600 text-white px-3 py-2 text-sm hover:brightness-110"
        >
          + כתיבת פוסט
        </Link>
      </div>
    </div>
  );
}
