// src/app/fit/workouts/page.tsx
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/maty/ui/accordion";
import { Badge } from "@/maty/ui/badge";
import { Button } from "@/maty/ui/Button"; // ✅ fix import path
import { Card, CardContent, CardHeader, CardTitle } from "@/maty/ui/card";
import { Input } from "@/maty/ui/input";
import { Separator } from "@/maty/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/maty/ui/tabs";
import { Textarea } from "@/maty/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Dumbbell,
  GripVertical,
  History,
  Layers3,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

/* -------------------------------------------------------------------------- */
/*                               Types & Models                               */
/* -------------------------------------------------------------------------- */

type Exercise = {
  /** מזהה עם prefix ספק, למשל: "wger:123" / "exdb:0001" */
  id: string;
  provider?: string;
  name: string;
  muscle?: string;
  /** תמונת תצוגה (image מהספק או thumb של YouTube) */
  media?: string | null;
};

type WorkoutItem = {
  /** אותו id מספק (כולל ה־prefix) */
  exerciseId: string;
  name?: string;
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSec?: number;
};

type Workout = {
  _id?: string;
  title: string;
  note?: string;
  items: WorkoutItem[];
  createdAt?: string;
};

/* -------------------------------------------------------------------------- */
/*                             Helper UI utilities                            */
/* -------------------------------------------------------------------------- */

function cn(...arr: Array<string | false | undefined | null>) {
  return arr.filter(Boolean).join(" ");
}

function emitToast(detail: {
  type?: "success" | "error" | "loading" | "info" | "blank";
  text: string;
  id?: string;
  duration?: number;
}) {
  try {
    window.dispatchEvent(new CustomEvent("mm:toast", { detail }));
  } catch {}
}

function mmProgressStart() {
  try {
    window.dispatchEvent(new Event("mm:progress:start"));
  } catch {}
}
function mmProgressDone() {
  try {
    window.dispatchEvent(new Event("mm:progress:done"));
  } catch {}
}

/* -------------------------------------------------------------------------- */
/*                          Constants / Mocked Categories                      */
/* -------------------------------------------------------------------------- */

const MUSCLES = [
  { key: "chest", label: "חזה" },
  { key: "back", label: "גב" },
  { key: "legs", label: "רגליים" },
  { key: "shoulders", label: "כתפיים" },
  { key: "arms", label: "ידיים" },
  { key: "core", label: "ליבה" },
  { key: "full", label: "כל הגוף" },
];

/* -------------------------------------------------------------------------- */
/*                             Fetcher utilities                               */
/* -------------------------------------------------------------------------- */

async function apiJSON<T = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* -------------------------------------------------------------------------- */
/*                                 Page Root                                   */
/* -------------------------------------------------------------------------- */

export default function FitWorkoutsPage() {
  const router = useRouter();

  // Builder state
  const [title, setTitle] = React.useState("אימון אישי");
  const [note, setNote] = React.useState("");
  const [items, setItems] = React.useState<WorkoutItem[]>([]);

  // Saved workouts
  const [saved, setSaved] = React.useState<Workout[]>([]);
  const [loadingSaved, setLoadingSaved] = React.useState(true);

  // Search state
  const [q, setQ] = React.useState("");
  const [muscle, setMuscle] = React.useState<string>("");
  const [results, setResults] = React.useState<Exercise[]>([]);
  const [searching, setSearching] = React.useState(false);

  // UI misc
  const [tab, setTab] = React.useState("builder");

  React.useEffect(() => {
    loadMy().catch(() => {});
  }, []);

  async function loadMy() {
    try {
      setLoadingSaved(true);
      const j = await apiJSON<{ ok: boolean; items: Workout[] }>(
        "/api/fit/workouts",
      );
      if (j.ok) setSaved(j.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSaved(false);
    }
  }

  async function search() {
    try {
      setSearching(true);
      mmProgressStart();
      const url = new URL("/api/fit/exercises", window.location.origin);
      if (q) url.searchParams.set("q", q);
      if (muscle) url.searchParams.set("muscle", muscle);
      url.searchParams.set("sort", "relevance");
      url.searchParams.set("pageSize", "24");

      const j = await apiJSON<{ items: any[] }>(url.toString());

      // ❗ תואם ל־/api/fit/exercises אצלך:
      // item = { id: "wger:123", name, description, muscle, level, provider, images[], youtubeId, videoUrl }
      const arr: Exercise[] = (j.items || []).map((x: any) => {
        const firstImg =
          Array.isArray(x.images) && x.images.length ? x.images[0] : undefined;
        const ytThumb = x.youtubeId
          ? `https://i.ytimg.com/vi/${x.youtubeId}/hqdefault.jpg`
          : undefined;
        return {
          id: String(x.id),
          provider: x.provider,
          name: x.name,
          muscle: x.muscle ?? undefined,
          media: firstImg || ytThumb || null,
        };
      });

      setResults(arr);
    } catch (e: any) {
      emitToast({ type: "error", text: "חיפוש נכשל" });
      console.error(e);
    } finally {
      setSearching(false);
      mmProgressDone();
    }
  }

  function addExercise(ex: Exercise) {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: ex.id, // ✅ משתמשים ב־id המלא (כולל prefix ספק)
        name: ex.name,
        sets: 3,
        reps: 10,
        restSec: 60,
      },
    ]);
    emitToast({ type: "success", text: `נוסף: ${ex.name}` });
    setTab("builder");
  }

  function moveItem(index: number, dir: -1 | 1) {
    setItems((s) => {
      const a = [...s];
      const j = index + dir;
      if (j < 0 || j >= a.length) return s;
      const t = a[index];
      a[index] = a[j];
      a[j] = t;
      return a;
    });
  }

  async function save() {
    const body: Workout = { title, note, items };
    try {
      emitToast({ type: "loading", text: "שומר…", id: "save" });
      const j = await apiJSON<{ ok: boolean; id?: string; error?: string }>(
        "/api/fit/workouts",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      if (!j.ok) throw new Error(j.error || "Failed");
      setTitle("אימון אישי");
      setNote("");
      setItems([]);
      await loadMy();
      emitToast({ type: "success", text: "נשמר!", id: "save", duration: 1500 });
    } catch (e: any) {
      emitToast({
        type: "error",
        text: e?.message || "נכשל בשמירה",
        id: "save",
      });
    }
  }

  function removeItem(idx: number) {
    setItems((s) => s.filter((_, i) => i !== idx));
  }

  return (
    <div className="rtl container mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-fuchsia-500/10 via-blue-500/10 to-emerald-500/10 p-6 md:p-10">
        <div className="absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.300/.2)_1px,transparent_0)] [background-size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.700/.35)_1px,transparent_0)]" />
        </div>
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight md:text-4xl">
              <Dumbbell className="size-7 text-fuchsia-600" /> בונה אימון חכם
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              חפשו תרגילים לפי שריר, גררו/סדרו, ושמרו תכנית אימון מותאמת אישית.
              הכול בעברית ובאהבה.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTab("saved")}
              className="gap-2"
            >
              <History className="size-4" /> האימונים שלי
            </Button>
            <Button onClick={save} className="gap-2">
              <Save className="size-4" /> שמור אימון
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="gap-2">
            <Layers3 className="size-4" /> בנאי אימון
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="size-4" /> תרגילים
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <BookOpenText className="size-4" /> שמורים
          </TabsTrigger>
        </TabsList>

        {/* Builder */}
        <TabsContent value="builder" className="mt-6">
          <div className="grid gap-6 md:grid-cols-5">
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>פרטי האימון</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="כותרת"
                />
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="הערות…"
                />
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {items.length
                      ? `הוספת ${items.length} תרגילים`
                      : "אין עדיין תרגילים"}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTab("search")}
                    className="gap-2"
                  >
                    <Plus className="size-4" /> הוסף תרגיל
                  </Button>
                </div>

                <div className="mt-2 space-y-3">
                  <AnimatePresence>
                    {items.map((it, i) => (
                      <motion.div
                        key={it.exerciseId + i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="grid grid-cols-12 items-center gap-2 rounded-xl border p-3">
                          <div className="col-span-6 truncate text-sm">
                            <span className="font-medium">
                              {it.name || it.exerciseId}
                            </span>
                            <div className="text-xs text-slate-500">
                              {it.exerciseId}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min={1}
                              value={it.sets ?? 3}
                              onChange={(e) => {
                                const v = Number(e.target.value || 0);
                                setItems((s) =>
                                  s.map((x, idx) =>
                                    idx === i ? { ...x, sets: v } : x,
                                  ),
                                );
                              }}
                              placeholder="סטים"
                            />
                            <div className="mt-1 text-center text-[10px] text-slate-500">
                              סטים
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min={1}
                              value={it.reps ?? 10}
                              onChange={(e) => {
                                const v = Number(e.target.value || 0);
                                setItems((s) =>
                                  s.map((x, idx) =>
                                    idx === i ? { ...x, reps: v } : x,
                                  ),
                                );
                              }}
                            />
                            <div className="mt-1 text-center text-[10px] text-slate-500">
                              חזרות
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min={0}
                              value={it.restSec ?? 60}
                              onChange={(e) => {
                                const v = Number(e.target.value || 0);
                                setItems((s) =>
                                  s.map((x, idx) =>
                                    idx === i ? { ...x, restSec: v } : x,
                                  ),
                                );
                              }}
                            />
                            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                              <Clock3 className="size-3" /> מנוחה (ש׳׳)
                            </div>
                          </div>
                          <div className="col-span-12 flex items-center justify-end gap-2 md:col-span-12">
                            <div className="ml-auto flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveItem(i, -1)}
                                aria-label="למעלה"
                              >
                                <ChevronUp className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveItem(i, 1)}
                                aria-label="למטה"
                              >
                                <ChevronDown className="size-4" />
                              </Button>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(i)}
                              className="gap-1"
                            >
                              <Trash2 className="size-4" /> הסר
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Tips & Presets */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>פריסטים מהירים</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "PPL (דחיפה)",
                      build: [
                        { id: "exdb:0001", name: "לחיצת חזה", s: 4, r: 8 },
                        { id: "exdb:0002", name: "לחיצת כתפיים", s: 4, r: 10 },
                        { id: "exdb:0003", name: "שכיבות סמיכה", s: 3, r: 15 },
                      ],
                    },
                    {
                      label: "גב+בייספס",
                      build: [
                        { id: "exdb:0101", name: "חתירה", s: 4, r: 10 },
                        { id: "exdb:0102", name: "משיכת פולי", s: 4, r: 8 },
                        { id: "exdb:0103", name: "כפיפת מרפקים", s: 3, r: 12 },
                      ],
                    },
                    {
                      label: "רגליים",
                      build: [
                        { id: "exdb:0201", name: "סקוואט", s: 5, r: 5 },
                        { id: "exdb:0202", name: "לאנג׳ים", s: 3, r: 12 },
                        { id: "exdb:0203", name: "מכופפי ברך", s: 4, r: 10 },
                      ],
                    },
                    {
                      label: "ליבה זריזה",
                      build: [
                        { id: "exdb:0301", name: "פלאנק", s: 3, r: 30 },
                        { id: "exdb:0302", name: "הרמות רגליים", s: 3, r: 12 },
                        { id: "exdb:0303", name: "קרנצ׳ים", s: 3, r: 20 },
                      ],
                    },
                  ].map((p, idx) => (
                    <Button
                      key={idx}
                      variant="secondary"
                      className="justify-between"
                      onClick={() => {
                        setItems(
                          p.build.map((b) => ({
                            exerciseId: b.id,
                            name: b.name,
                            sets: b.s,
                            reps: b.r,
                            restSec: 60,
                          })),
                        );
                        emitToast({
                          type: "success",
                          text: `נטען פריסט: ${p.label}`,
                        });
                        setTab("builder");
                      }}
                    >
                      {p.label} <Check className="size-4 opacity-60" />
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>טיפ</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  אפשר להגדיר מנוחות קצרות יותר לזרימה גבוהה (HIIT), או יותר
                  ארוכות לכוח מקסימלי. שמרו כמה גרסאות של אותו אימון לפי מטרה.
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Search */}
        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>מצא תרגילים</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && search()}
                      placeholder="חפשו תרגיל (לחיצת חזה, משיכה…)"
                      className="w-full"
                    />
                    <Button
                      onClick={search}
                      className="gap-2"
                      disabled={searching}
                    >
                      <Search className="size-4" /> חפש
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <Badge
                      key={m.key}
                      variant={muscle === m.label ? "default" : "secondary"}
                      className={cn(
                        "cursor-pointer select-none",
                        muscle === m.label && "ring-2 ring-offset-2",
                      )}
                      onClick={() =>
                        setMuscle((v) => (v === m.label ? "" : m.label))
                      }
                    >
                      {m.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories accordion (info only) */}
              <Accordion type="multiple" className="mt-4">
                {MUSCLES.map((m) => (
                  <AccordionItem
                    key={m.key}
                    value={m.key}
                    className="rounded-xl border px-3"
                  >
                    <AccordionTrigger className="text-right">
                      תרגילי {m.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        בחרו קטגוריה או חפשו בשם, ואז לחצו “חפש” כדי להביא
                        תרגילים מהספקים.
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Results grid */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searching &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[140px] animate-pulse rounded-2xl border bg-muted/30"
                    />
                  ))}

                {!searching && results.length === 0 && (
                  <div className="col-span-full rounded-2xl border p-8 text-center text-sm text-slate-600 dark:text-slate-300">
                    אין תוצאות עדיין — נסו לחפש לפי שם או לבחור קטגוריה.
                  </div>
                )}

                {!searching &&
                  results.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="group relative overflow-hidden rounded-2xl border">
                        <div className="relative h-36 w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-neutral-900/50 dark:to-neutral-800">
                          {r.media ? (
                            <Image
                              src={r.media}
                              alt={r.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                              onError={(e) =>
                                ((e.currentTarget as any).style.display =
                                  "none")
                              }
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-slate-400">
                              <Dumbbell className="size-8" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-white">
                            <div className="truncate text-sm font-medium">
                              {r.name}
                            </div>
                            <Badge className="bg-white/90 text-black">
                              {r.muscle || "תרגיל"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="text-xs text-slate-500">
                            {(r.provider || "—").toUpperCase()}
                          </div>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => addExercise(r)}
                          >
                            <Plus className="size-4" /> הוסף
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved */}
        <TabsContent value="saved" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>האימונים שלי</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSaved ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[120px] animate-pulse rounded-2xl border bg-muted/30"
                      />
                    ))}
                  </div>
                ) : saved.length === 0 ? (
                  <div className="rounded-2xl border p-8 text-center text-sm text-slate-600 dark:text-slate-300">
                    אין אימונים שמורים עדיין.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {saved.map((w) => (
                      <motion.div
                        key={w._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-semibold">
                                {w.title}
                              </div>
                              <div className="text-xs text-slate-500">
                                {w.items?.length || 0} תרגילים
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTitle(w.title);
                                setNote(w.note || "");
                                setItems(w.items || []);
                                setTab("builder");
                                emitToast({
                                  type: "success",
                                  text: "נטען לעורך",
                                });
                              }}
                            >
                              ערוך
                            </Button>
                          </div>
                          {w.note && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                              {w.note}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card>
              <CardHeader>
                <CardTitle>סטטיסטיקה זריזה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="text-xs text-slate-500">סה"כ אימונים</div>
                    <div className="text-2xl font-bold">{saved.length}</div>
                  </div>
                  <GripVertical className="size-6 text-slate-400" />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      תרגילים ממוצעים
                    </div>
                    <div className="text-2xl font-bold">
                      {saved.length
                        ? Math.round(
                            (saved.reduce(
                              (a, b) => a + (b.items?.length || 0),
                              0,
                            ) /
                              saved.length) *
                              10,
                          ) / 10
                        : 0}
                    </div>
                  </div>
                  <Layers3 className="size-6 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
