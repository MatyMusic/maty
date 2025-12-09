"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Video as VideoIcon, Images, Info, ListChecks } from "lucide-react";

type MediaItem = {
  type: "image" | "gif" | "video";
  url: string;
  thumb?: string;
  title?: string;
  source?: string;
};

type RawExercise = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  primaryMuscles?: string[];
  equipment?: string[];
  difficulty?: "" | "beginner" | "intermediate" | "advanced";
  media?: MediaItem[];
  sources?: string[];
};

async function fetchRawByQuery(q: string) {
  const sp = new URLSearchParams();
  sp.set("q", q);
  sp.set("limit", "1");
  sp.set("page", "1");
  sp.set("enrich", "true"); // יביא וידאו/תמונות אם אפשר
  sp.set("include", "raw");

  const res = await fetch(`/api/fit/exercises?${sp.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const j = await res.json();
  const raw = (
    j.raw && Array.isArray(j.raw) ? j.raw[0] : null
  ) as RawExercise | null;
  return raw;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-white/70 px-2 py-1 text-xs dark:bg-white/10">
      {children}
    </span>
  );
}

export default function ExerciseDetailsPage() {
  const params = useParams<{ id: string }>();
  const name = decodeURIComponent(params.id || "");

  const [item, setItem] = React.useState<RawExercise | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"overview" | "media" | "steps">(
    "overview",
  );

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const raw = await fetchRawByQuery(name);
        setItem(raw);
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  const levelLabel =
    item?.difficulty === "beginner"
      ? "קל"
      : item?.difficulty === "intermediate"
        ? "בינוני"
        : item?.difficulty === "advanced"
          ? "מתקדם"
          : "—";

  // פיצול תיאור לשורות "שלבים" נעימים
  const steps = (item?.description || "")
    .split(/[\.\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-amber-50 to-white dark:from-black dark:to-zinc-900"
    >
      <div className="mx-auto max-w-4xl px-4 py-6">
        <header className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70">
          <h1 className="text-2xl font-extrabold">{name}</h1>
          {!loading && item && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Pill>קטגוריה: {item.category || "—"}</Pill>
              <Pill>רמה: {levelLabel}</Pill>
              {!!item.primaryMuscles?.length && (
                <Pill>שרירים: {item.primaryMuscles.join(", ")}</Pill>
              )}
              {!!item.equipment?.length && (
                <Pill>ציוד: {item.equipment.join(", ")}</Pill>
              )}
            </div>
          )}
        </header>

        <section className="mt-4 rounded-2xl border bg-white/80 p-3 shadow-sm backdrop-blur dark:bg-zinc-900/70">
          {/* לשוניות */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("overview")}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg-white/10 ${
                tab === "overview" ? "bg-amber-100 dark:bg-amber-500/20" : ""
              }`}
            >
              <Info size={16} /> סקירה
            </button>
            <button
              onClick={() => setTab("media")}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg-white/10 ${
                tab === "media" ? "bg-amber-100 dark:bg-amber-500/20" : ""
              }`}
            >
              <Images size={16} /> מדיה
            </button>
            <button
              onClick={() => setTab("steps")}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-amber-50 dark:hover:bg:white/10 ${
                tab === "steps" ? "bg-amber-100 dark:bg-amber-500/20" : ""
              }`}
            >
              <ListChecks size={16} /> שלבים
            </button>
          </div>

          {/* תוכן לשוניות */}
          <div className="mt-3">
            {loading && <div className="text-sm opacity-70">טוען…</div>}
            {!loading && !item && (
              <div className="text-sm opacity-70">לא נמצא תרגיל תואם.</div>
            )}

            {!loading && item && tab === "overview" && (
              <div className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap opacity-90">
                  {item.description || "אין תיאור זמין."}
                </p>
              </div>
            )}

            {!loading && item && tab === "media" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(item.media || []).map((m, i) =>
                  m.type === "video" ? (
                    <div key={i} className="overflow-hidden rounded-xl border">
                      <iframe
                        className="h-60 w-full"
                        src={
                          /youtube\.com/.test(m.url)
                            ? m.url.replace("watch?v=", "embed/")
                            : m.url
                        }
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                      <div className="flex items-center gap-2 p-2 text-xs opacity-70">
                        <VideoIcon size={14} />
                        {m.title || "וידאו"}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="overflow-hidden rounded-xl border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumb || m.url}
                        alt={m.title || "תמונה"}
                        className="h-60 w-full object-cover"
                        loading="lazy"
                      />
                      <div className="p-2 text-xs opacity-70">
                        {m.title || m.source || "תמונה"}
                      </div>
                    </div>
                  ),
                )}
                {!item.media?.length && (
                  <div className="text-sm opacity-70">אין מדיה זמינה.</div>
                )}
              </div>
            )}

            {!loading && item && tab === "steps" && (
              <ol className="list-decimal space-y-2 ps-6 text-sm">
                {steps.length ? (
                  steps.map((s, i) => <li key={i}>{s}</li>)
                ) : (
                  <div className="text-sm opacity-70">אין שלבים מפורטים.</div>
                )}
              </ol>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
