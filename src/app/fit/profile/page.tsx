// src/app/fit/profile/page.tsx
"use client";

import {
  Activity,
  ChevronRight,
  CloudSun,
  Dumbbell,
  HeartPulse,
  Loader2,
  MapPin,
  Moon,
  Save,
  Sparkles,
  Sun,
  Target,
  Users2,
} from "lucide-react";
import * as React from "react";

type TrainDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type TrainTime = "morning" | "noon" | "evening" | "flex";
type TrainStyle =
  | "gym"
  | "home"
  | "outdoor"
  | "crossfit"
  | "run"
  | "combat"
  | "yoga";
type Goal = "fat_loss" | "muscle" | "performance" | "health" | "rehab";
type PartnerIntent = "partner_only" | "group" | "both";

type FitProfile = {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  goals: Goal[];
  primaryMuscles: string[];
  difficulty?: "" | "beginner" | "intermediate" | "advanced";
  trainDays: TrainDay[];
  trainTime: TrainTime;
  styles: TrainStyle[];
  preferIndoor: boolean;
  preferOutdoor: boolean;
  locationArea?: string;
  radiusKm?: number;
  partnerIntent: PartnerIntent;
  partnerGenderPref?: "male" | "female" | "any";
  partnerMinAge?: number;
  partnerMaxAge?: number;
  note?: string;
  updatedAt?: string;
};

const GOALS: { id: Goal; label: string }[] = [
  { id: "fat_loss", label: "ירידה בשומן" },
  { id: "muscle", label: "עליה במסת שריר" },
  { id: "performance", label: "ביצועים (ריצה, כוח)" },
  { id: "health", label: "בריאות כללית" },
  { id: "rehab", label: "שיקום / פציעות" },
];

const DAYS: { id: TrainDay; label: string }[] = [
  { id: "sun", label: "א'" },
  { id: "mon", label: "ב'" },
  { id: "tue", label: "ג'" },
  { id: "wed", label: "ד'" },
  { id: "thu", label: "ה'" },
  { id: "fri", label: "ו'" },
  { id: "sat", label: "שבת" },
];

const TIMES: { id: TrainTime; label: string; icon: React.ReactNode }[] = [
  { id: "morning", label: "בוקר", icon: <Sun className="w-4 h-4" /> },
  { id: "noon", label: "צהריים", icon: <CloudSun className="w-4 h-4" /> },
  { id: "evening", label: "ערב", icon: <Moon className="w-4 h-4" /> },
  { id: "flex", label: "גמיש", icon: <Activity className="w-4 h-4" /> },
];

const STYLES: { id: TrainStyle; label: string }[] = [
  { id: "gym", label: "חדר כושר" },
  { id: "home", label: "בית" },
  { id: "outdoor", label: "חוץ / פארק" },
  { id: "crossfit", label: "קרוספיט" },
  { id: "run", label: "ריצה" },
  { id: "combat", label: "קרב מגע / אגרוף" },
  { id: "yoga", label: "יוגה / נשימה" },
];

const MUSCLES: string[] = [
  "חזה",
  "גב",
  "רגליים",
  "כתפיים",
  "יד קדמית",
  "יד אחורית",
  "בטן",
  "קרדיו",
];

const AREAS: string[] = [
  "מרכז",
  "ירושלים והסביבה",
  "שפלה",
  "צפון",
  "דרום",
  "שרון",
];

const DIFF_OPTIONS: {
  id: NonNullable<FitProfile["difficulty"]>;
  label: string;
}[] = [
  { id: "beginner", label: "מתחיל" },
  { id: "intermediate", label: "בינוני" },
  { id: "advanced", label: "מתקדם" },
];

function clsx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

export default function FitProfilePage() {
  const [profile, setProfile] = React.useState<FitProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/fit/profile", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const j = await res.json();
        if (!cancelled) {
          setProfile(j.profile as FitProfile);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "שגיאה בטעינת הפרופיל");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      const { userId, updatedAt, ...payload } = profile;
      const res = await fetch("/api/fit/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setProfile(j.profile as FitProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message || "שגיאה בשמירת הפרופיל");
    } finally {
      setSaving(false);
    }
  }

  function toggleGoal(id: Goal) {
    if (!profile) return;
    const exists = profile.goals.includes(id);
    setProfile({
      ...profile,
      goals: exists
        ? profile.goals.filter((g) => g !== id)
        : [...profile.goals, id],
    });
  }

  function toggleDay(id: TrainDay) {
    if (!profile) return;
    const exists = profile.trainDays.includes(id);
    setProfile({
      ...profile,
      trainDays: exists
        ? profile.trainDays.filter((d) => d !== id)
        : [...profile.trainDays, id],
    });
  }

  function toggleStyle(id: TrainStyle) {
    if (!profile) return;
    const exists = profile.styles.includes(id);
    setProfile({
      ...profile,
      styles: exists
        ? profile.styles.filter((s) => s !== id)
        : [...profile.styles, id],
    });
  }

  function toggleMuscle(m: string) {
    if (!profile) return;
    const exists = profile.primaryMuscles.includes(m);
    setProfile({
      ...profile,
      primaryMuscles: exists
        ? profile.primaryMuscles.filter((x) => x !== m)
        : [...profile.primaryMuscles, m],
    });
  }

  function setDifficulty(d?: FitProfile["difficulty"]) {
    if (!profile) return;
    setProfile({ ...profile, difficulty: d });
  }

  if (loading && !profile) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-amber-50 to-white dark:from-black dark:to-zinc-900 px-4 py-8"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-zinc-900/70 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">טוען פרופיל כושר…</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-amber-50 to-white dark:from-black dark:to-zinc-900 px-4 py-8"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border bg-red-50 p-6 text-red-800 dark:bg-red-500/10 dark:text-red-200">
          לא הצלחתי לטעון את הפרופיל. נסה להתחבר מחדש.
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-amber-50 to-white dark:from-black dark:to-zinc-900 px-4 py-8"
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {/* כותרת עליונה */}
        <header className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white font-black text-lg">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                פרופיל MATY-FIT
              </h1>
              <p className="mt-1 text-xs md:text-sm opacity-70">
                הגדר יעדים, ימים וסגנון אימון – ונוכל למצוא לך שותפים ו־DATE
                פעיל דרך MATY-DATE.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <div className="inline-flex items-center gap-1 rounded-full border bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Sparkles className="w-4 h-4" />
              חינם · שמירה מאובטחת
            </div>
            {profile.updatedAt && (
              <div className="opacity-70">
                עודכן:{" "}
                {new Date(profile.updatedAt).toLocaleString("he-IL", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-300/60 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5" autoComplete="off">
          {/* בלוק בסיסי: שם, אזור, טווח גיל */}
          <section className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70 space-y-4">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-base md:text-lg font-bold">
                מי אתה מחפש וכמה רחוק?
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>איך לקרוא לך (בכרטיסים)?</span>
                <input
                  className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
                  value={profile.displayName || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="מתי / MATY / חוגי השמן…"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span>אזור בארץ</span>
                <select
                  className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
                  value={profile.locationArea || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      locationArea: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">בחר אזור…</option>
                  {AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span>רדיוס חיפוש (ק״מ)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={60}
                    value={profile.radiusKm || 10}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        radiusKm: Number(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="w-10 text-xs text-right">
                    {profile.radiusKm || 10}
                  </span>
                </div>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3 text-xs md:text-sm">
              <label className="flex flex-col gap-1">
                <span>למי פתוח?</span>
                <select
                  className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
                  value={profile.partnerIntent}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      partnerIntent:
                        (e.target.value as PartnerIntent) || "both",
                    })
                  }
                >
                  <option value="partner_only">שותף/ה אימון</option>
                  <option value="group">קבוצות בלבד</option>
                  <option value="both">הכול (שותף + קבוצות)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span>העדפת מגדר</span>
                <select
                  className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
                  value={profile.partnerGenderPref || "any"}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      partnerGenderPref:
                        (e.target.value as "male" | "female" | "any") || "any",
                    })
                  }
                >
                  <option value="any">לא משנה</option>
                  <option value="male">גברים</option>
                  <option value="female">נשים</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span>גיל מינימלי</span>
                  <input
                    type="number"
                    min={16}
                    max={90}
                    value={profile.partnerMinAge || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        partnerMinAge: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>גיל מקסימלי</span>
                  <input
                    type="number"
                    min={16}
                    max={99}
                    value={profile.partnerMaxAge || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        partnerMaxAge: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* יעדים, ימים, סגנון */}
          <section className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70 space-y-5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              <h2 className="text-base md:text-lg font-bold">
                יעדים, ימים וסגנון אימון
              </h2>
            </div>

            {/* יעדים */}
            <div className="space-y-2">
              <div className="text-xs md:text-sm opacity-70">
                מה המטרה שלך כרגע? אפשר לבחור כמה.
              </div>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const active = profile.goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs md:text-sm transition",
                        active
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white/70 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-zinc-800",
                      )}
                    >
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ימים */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <HeartPulse className="w-4 h-4 text-pink-500" />
                <span>באילו ימים נוח לך להתאמן?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const active = profile.trainDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={clsx(
                        "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs md:text-sm w-10 text-center transition",
                        active
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white/70 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-zinc-800",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* שעות וסגנון */}
            <div className="grid gap-4 md:grid-cols-[1.2fr,1.5fr]">
              <div className="space-y-2">
                <div className="text-xs md:text-sm opacity-70">
                  מתי במהלך היום לרוב נוח לך?
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => {
                    const active = profile.trainTime === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            trainTime: t.id,
                          })
                        }
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs md:text-sm transition",
                          active
                            ? "bg-indigo-500 text-white border-indigo-500"
                            : "bg-white/70 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs md:text-sm opacity-70">
                  איפה ואיך אתה אוהב להתאמן?
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => {
                    const active = profile.styles.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStyle(s.id)}
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs md:text-sm transition",
                          active
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white/70 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <label className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-2.5 py-1 dark:bg-zinc-900">
                    <input
                      type="checkbox"
                      className="h-3 w-3 accent-amber-500"
                      checked={profile.preferIndoor}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          preferIndoor: e.target.checked,
                        })
                      }
                    />
                    <span>מקומות סגורים (חדר כושר / בית)</span>
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-2.5 py-1 dark:bg-zinc-900">
                    <input
                      type="checkbox"
                      className="h-3 w-3 accent-emerald-500"
                      checked={profile.preferOutdoor}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          preferOutdoor: e.target.checked,
                        })
                      }
                    />
                    <span>חוץ / פארקים / מסלולים</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* שרירים ורמת קושי */}
          <section className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70 space-y-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-amber-500" />
              <h2 className="text-base md:text-lg font-bold">
                על אילו שרירים אתה עובד? ומה הרמה שלך?
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.5fr,1fr]">
              <div className="space-y-2">
                <div className="text-xs md:text-sm opacity-70">
                  בחר שרירים מרכזיים (משפיע על התאמות אימון).
                </div>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => {
                    const active = profile.primaryMuscles.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMuscle(m)}
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs md:text-sm transition",
                          active
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-white/70 dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs md:text-sm opacity-70">
                  רמת קושי מוערכת
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIFF_OPTIONS.map((d) => {
                    const active = profile.difficulty === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDifficulty(d.id)}
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs md:text-sm transition",
                          active
                            ? "bg-sky-500 text-white border-sky-500"
                            : "bg-white/70 dark:bg-zinc-900 hover:bg-sky-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setDifficulty("")}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs md:text-sm bg-white/70 hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    איפוס
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* הערה חופשית */}
          <section className="rounded-3xl border bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/70 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <h2 className="text-base md:text-lg font-bold">
                הערות מיוחדות / בקשות
              </h2>
            </div>
            <p className="text-xs md:text-sm opacity-70">
              לדוגמה: &quot;אני אחרי פציעה בכתף&quot;, &quot;אני עושה ריצות
              ארוכות&quot;, &quot;מעדיף אימונים עם מוזיקה חזקה&quot; וכו'.
            </p>
            <textarea
              className="mt-2 min-h-[80px] w-full rounded-2xl border bg-white/70 px-3 py-2 text-sm dark:bg-zinc-900"
              value={profile.note || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  note: e.target.value,
                })
              }
              placeholder="תכתוב מה שחשוב שנדע בשביל התאמות חכמות…"
            />
          </section>

          {/* כפתור שמירה + קישור למאצ'ים */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <button
              type="submit"
              disabled={saving}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition",
                "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שומר…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  שמירה
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
              {saved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  נשמר! עכשיו אפשר לחפש שותפים דרך MATY-DATE.
                </span>
              )}
              <a
                href="/date/fit-matches"
                className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-3 py-1.5 text-xs md:text-sm hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="w-4 h-4" />
                לעמוד שידוכי כושר (MATY-DATE)
              </a>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
