// src/components/maty-date/MatchGrid.tsx
"use client";

import * as React from "react";
import MatchCard, { type MatchItem } from "@/components/maty-date/MatchCard"; // ← נתיב נכון

type JudaismDirection =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

const DIR_LABEL: Record<JudaismDirection, string> = {
  orthodox: "אורתודוקסי",
  haredi: "חרדי",
  chasidic: "חסידי",
  modern: "אורתודוקסי מודרני",
  conservative: "קונסרבטיבי",
  reform: "רפורמי",
  reconstructionist: "רקונסטרוקטיבי",
  secular: "חילוני/תרבותי",
};

function asNum(v: string, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

async function safeJson(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 text-[11px]">
      {children}
    </span>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-2xl font-extrabold">לא נמצאו התאמות</div>
      <p className="mt-2 opacity-80">
        אפשר לנסות להרחיב גיל, להסיר עיר/זרם, או לשנות מטרה.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white"
        >
          איפוס סינון
        </button>
        <a
          href="/maty-date"
          className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
        >
          עריכת פרופיל
        </a>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 p-4 animate-pulse">
      <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-3 h-24 rounded bg-black/10 dark:bg-white/10" />
    </div>
  );
}

export default function MatchGrid() {
  // filters
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [direction, setDirection] = React.useState<JudaismDirection | "">("");
  const [gender, setGender] = React.useState<"male" | "female" | "other" | "">(
    ""
  );
  const [lookingFor, setLookingFor] = React.useState<
    "serious" | "marriage" | "friendship" | ""
  >("");
  const [minAge, setMinAge] = React.useState(20);
  const [maxAge, setMaxAge] = React.useState(40);

  // data
  const [items, setItems] = React.useState<MatchItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [firstLoadDone, setFirstLoadDone] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  async function loadPage(reset = false) {
    setLoading(true);
    try {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const params = new URLSearchParams();
      params.set("limit", "18");
      if (!reset && nextCursor) params.set("cursor", nextCursor);
      if (city) params.set("city", city);
      if (country) params.set("country", country);
      if (direction) params.set("direction", direction);
      if (gender) params.set("gender", gender);
      if (lookingFor) params.set("looking_for", lookingFor);
      params.set("minAge", String(minAge));
      params.set("maxAge", String(maxAge));

      const r = await fetch(`/api/date/matches?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const j = await safeJson(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      setItems((prev) => (reset ? j.items : [...prev, ...j.items]));
      setNextCursor(j.nextCursor || null);
      setFirstLoadDone(true);
    } catch (e) {
      console.error(e);
      setFirstLoadDone(true);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onApply(e: React.FormEvent) {
    e.preventDefault();
    setNextCursor(null);
    loadPage(true);
  }

  function onReset() {
    setCity("");
    setCountry("");
    setDirection("");
    setGender("");
    setLookingFor("");
    setMinAge(20);
    setMaxAge(40);
    setNextCursor(null);
    loadPage(true);
  }

  return (
    <section dir="rtl" className="space-y-6">
      {/* Filter Card */}
      <form
        onSubmit={onApply}
        className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm shadow-md"
      >
        <div className="px-4 py-4 md:px-6 md:py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {/* City */}
            <label className="grid gap-1">
              <span className="text-xs opacity-70">עיר</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="למשל: ירושלים"
                className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              />
            </label>

            {/* Country */}
            <label className="grid gap-1">
              <span className="text-xs opacity-70">מדינה</span>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="ישראל"
                className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              />
            </label>

            {/* Direction */}
            <label className="grid gap-1">
              <span className="text-xs opacity-70">זרם ביהדות</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              >
                <option value="">—</option>
                {(Object.keys(DIR_LABEL) as JudaismDirection[]).map((k) => (
                  <option key={k} value={k}>
                    {DIR_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>

            {/* Gender */}
            <label className="grid gap-1">
              <span className="text-xs opacity-70">מין</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              >
                <option value="">—</option>
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
                <option value="other">אחר</option>
              </select>
            </label>

            {/* Goal */}
            <label className="grid gap-1">
              <span className="text-xs opacity-70">מטרה</span>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value as any)}
                className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              >
                <option value="">—</option>
                <option value="serious">קשר רציני</option>
                <option value="marriage">נישואין</option>
                <option value="friendship">חברות</option>
              </select>
            </label>

            {/* Age */}
            <div className="grid gap-1">
              <span className="text-xs opacity-70">גיל</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={18}
                  value={minAge}
                  onChange={(e) =>
                    setMinAge(Math.max(18, asNum(e.target.value, 18)))
                  }
                  className="h-10 w-20 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                  placeholder="מינ'"
                  aria-label="גיל מינימלי"
                />
                <span className="opacity-50 text-sm">–</span>
                <input
                  type="number"
                  min={minAge}
                  value={maxAge}
                  onChange={(e) =>
                    setMaxAge(Math.max(minAge, asNum(e.target.value, minAge)))
                  }
                  className="h-10 w-20 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                  placeholder="מקס'"
                  aria-label="גיל מקסימלי"
                />
              </div>
            </div>
          </div>

          {/* actions row */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full h-10 px-4 text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white"
            >
              איפוס
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700"
            >
              החל סינון
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-right">
            {city && <Chip>עיר: {city}</Chip>}
            {country && <Chip>מדינה: {country}</Chip>}
            {direction && (
              <Chip>זרם: {DIR_LABEL[direction as JudaismDirection]}</Chip>
            )}
            {gender && (
              <Chip>
                מין:{" "}
                {gender === "male"
                  ? "זכר"
                  : gender === "female"
                  ? "נקבה"
                  : "אחר"}
              </Chip>
            )}
            {lookingFor && (
              <Chip>
                מטרה:{" "}
                {lookingFor === "serious"
                  ? "קשר רציני"
                  : lookingFor === "marriage"
                  ? "נישואין"
                  : "חברות"}
              </Chip>
            )}
            <Chip>
              גיל: {minAge}–{maxAge}
            </Chip>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading && !firstLoadDone ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onReset={onReset} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => {
              const key = it._id ?? `${it.userId}-${it.updatedAt ?? i}`;
              return <MatchCard key={key} item={it} />;
            })}
          </div>

          {/* load more */}
          <div className="mt-6 flex justify-center">
            {nextCursor ? (
              <button
                onClick={() => loadPage(false)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "טוען…" : "טען עוד"}
              </button>
            ) : (
              <div className="text-sm opacity-60">הצגת כל ההתאמות</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
