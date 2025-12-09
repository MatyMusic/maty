// src/app/admin/media/page.tsx
"use client";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/* טיפוסים                                                             */
/* ------------------------------------------------------------------ */

type Kind = "image" | "video" | "audio";

type Row = {
  _id: string;
  kind: Kind;
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  tags?: string[];
  createdAt?: string;
};

type SortOpt = "new" | "old" | "title" | "big" | "small";

type MediaApiResponse = {
  ok: boolean;
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

/* ------------------------------------------------------------------ */
/* הוקים ועוזרים                                                       */
/* ------------------------------------------------------------------ */

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function toast(msg: string, type: "success" | "error" | "info" = "success") {
  if (typeof window !== "undefined") {
    const method = type === "error" ? "error" : "log";
    console[method]("[MEDIA]", msg);
  }
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* קומפוננטת עמוד                                                      */
/* ------------------------------------------------------------------ */

export default function AdminMediaPage() {
  const admin = useIsAdmin();

  const [q, setQ] = useState("");
  const debQ = useDebounced(q, 400);
  const [kind, setKind] = useState<"" | Kind>("");
  const [sort, setSort] = useState<SortOpt>("new");
  const [pageSize, setPageSize] = useState(30);
  const [page, setPage] = useState(1);

  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (debQ) p.set("q", debQ);
    if (kind) p.set("kind", kind);
    if (sort) p.set("sort", sort);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [debQ, kind, sort, page, pageSize]);

  const filteredRows = useMemo(() => {
    if (!tagFilter) return rows;
    return rows.filter((r) => (r.tags || []).includes(tagFilter));
  }, [rows, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(() => {
    const totalCount = rows.length;
    const images = rows.filter((r) => r.kind === "image").length;
    const videos = rows.filter((r) => r.kind === "video").length;
    const audios = rows.filter((r) => r.kind === "audio").length;
    const totalBytes = rows.reduce((acc, r) => acc + (r.bytes ?? 0), 0);
    const totalDuration = rows.reduce((acc, r) => acc + (r.duration ?? 0), 0);
    return {
      totalCount,
      images,
      videos,
      audios,
      totalBytes,
      totalDuration,
    };
  }, [rows]);

  const resetAndLoad = useCallback(() => {
    setRows([]);
    setPage(1);
  }, []);

  /* ------------------------------------------------------------------ */
  /* fetch נתונים                                                       */
  /* ------------------------------------------------------------------ */

  const fetchPage = useCallback(
    async (append = false) => {
      if (admin === false) return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(`/api/admin/media?${qs}`, {
          cache: "no-store",
          signal: ctrl.signal,
          credentials: "same-origin",
        });

        const j = (await r
          .json()
          .catch(() => ({}))) as Partial<MediaApiResponse>;

        if (!r.ok || !j?.ok) {
          throw new Error(j?.error || `HTTP ${r.status}`);
        }

        const nextTotal = j.total ?? 0;
        const nextPage = j.page ?? page;
        const nextPageSize = j.pageSize ?? pageSize;
        const nextRows = j.rows ?? [];

        setTotal(nextTotal);
        setHasMore(nextPage < Math.ceil(nextTotal / nextPageSize));

        if (append) {
          setRows((prev) => [...prev, ...nextRows]);
        } else {
          setRows(nextRows);
        }

        setPage(nextPage);
        setPageSize(nextPageSize);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          const msg = e?.message || "load_failed";
          setErr(msg);
          toast(msg, "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [admin, page, pageSize, qs],
  );

  useEffect(() => {
    if (admin === null) return;
    fetchPage(false);
  }, [admin, fetchPage]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !loading) {
            setPage((p) => p + 1);
          }
        }
      },
      { rootMargin: "600px 0px 600px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchPage(true);
    }
  }, [page, fetchPage]);

  /* ------------------------------------------------------------------ */
  /* פעולות                                                             */
  /* ------------------------------------------------------------------ */

  const onUploaded = useCallback(() => {
    toast("העלאה הושלמה — מרענן…", "info");
    resetAndLoad();
    setTimeout(() => fetchPage(false), 80);
  }, [fetchPage, resetAndLoad]);

  // מחיקה ישירה בלי confirm/alert
  const deleteOneNow = useCallback(async (publicId: string) => {
    try {
      const r = await fetch(
        `/api/admin/media?publicId=${encodeURIComponent(publicId)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "מחיקה נכשלה");
      toast("🗑️ נמחק בהצלחה");
      setRows((prev) => prev.filter((x) => x.publicId !== publicId));
      setTotal((t) => Math.max(0, t - 1));
      setSelected((s) => {
        const ns = new Set([...s]);
        ns.delete(publicId);
        return ns;
      });
    } catch (e: any) {
      toast(e?.message || "שגיאה במחיקה", "error");
    }
  }, []);

  const deleteSelectedNow = useCallback(async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await deleteOneNow(id);
    }
  }, [selected, deleteOneNow]);

  function toggleSel(publicId: string) {
    setSelected((s) => {
      const ns = new Set([...s]);
      if (ns.has(publicId)) ns.delete(publicId);
      else ns.add(publicId);
      return ns;
    });
  }

  function selectAllCurrent() {
    const ids = filteredRows.map((r) => r.publicId);
    setSelected(new Set(ids));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function copyToClipboard(text: string, label = "הועתק") {
    try {
      await navigator.clipboard.writeText(text);
      toast(`📋 ${label}`);
    } catch {
      toast("נכשל העתקה", "error");
    }
  }

  const tagChips = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      for (const t of r.tags || []) {
        m.set(t, (m.get(t) || 0) + 1);
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
  }, [rows]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        (
          document.getElementById("media-search") as HTMLInputElement | null
        )?.focus();
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Inline Editor                                                      */
  /* ------------------------------------------------------------------ */

  function InlineEditor({ row }: { row: Row }) {
    const [title, setTitle] = useState(row.title || "");
    const [tagsStr, setTagsStr] = useState((row.tags || []).join(", "));

    useEffect(() => {
      setTitle(row.title || "");
      setTagsStr((row.tags || []).join(", "));
    }, [row.publicId, row.title, row.tags]);

    const handleSave = async () => {
      const tags = tagsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      try {
        const r = await fetch(`/api/admin/media`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: row.publicId,
            patch: { title, tags },
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) throw new Error(j?.error || "עדכון נכשל");
        toast("💾 נשמר");
        setRows((prev) =>
          prev.map((x) =>
            x.publicId === row.publicId ? { ...x, title, tags } : x,
          ),
        );
      } catch (e: any) {
        toast(e?.message || "עדכון נכשל", "error");
      }
    };

    const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    };

    return (
      <div className="grid gap-1 text-sm">
        <input
          className="mm-input input-rtl border border-sky-200/60 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/70"
          value={title}
          placeholder={row.publicId}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          aria-label="כותרת"
        />
        <input
          className="mm-input input-rtl border border-violet-200/60 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/70"
          value={tagsStr}
          placeholder="תגיות (מופרדות בפסיקים)"
          onChange={(e) => setTagsStr(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          aria-label="תגיות"
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* מצבי הרשאה / טעינה                                                */
  /* ------------------------------------------------------------------ */

  if (admin === false) {
    return (
      <div
        className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-black flex items-center justify-center"
        dir="rtl"
      >
        <div className="m-6 mm-card p-6 text-center bg-gradient-to-br from-red-50 via-amber-50 to-white dark:from-red-950 dark:via-amber-950/40 dark:to-neutral-950 rounded-2xl border border-red-500/40 shadow-xl max-w-lg">
          <h1 className="text-2xl font-extrabold mb-2">
            🔒 ספריית מדיה — נעול
          </h1>
          <p className="opacity-80 text-sm">
            נדרש חשבון אדמין. אם יש לך סיסמת bypass — הפעל אותה ואז רענן את הדף.
          </p>
          <div className="mt-4">
            <a
              href="/auth"
              className="mm-btn mm-pressable px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:brightness-110"
            >
              כניסה למערכת
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (admin === null) {
    return (
      <div
        className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50"
        dir="rtl"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="m-6 mm-card p-6">
            <div className="h-6 w-48 bg-black/10 rounded mb-3 animate-pulse" />
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-2 animate-pulse">
                  <div className="aspect-video bg-black/10 rounded-lg" />
                  <div className="mt-2 h-4 bg-black/10 rounded" />
                  <div className="mt-1 h-3 bg-black/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Empty = (
    <div className="mm-card p-8 text-center space-y-3 bg-gradient-to-br from-sky-50 via-purple-50 to-emerald-50 dark:from-sky-950/60 dark:via-purple-950/40 dark:to-emerald-950/50 border border-sky-200/60 dark:border-sky-900/50 rounded-2xl">
      <div className="text-lg font-bold">עדיין אין לך מדיה 😊</div>
      <div className="opacity-80 text-sm">
        העלה תמונות, וידאו או אודיו — והם יופיעו כאן לניהול מהיר.
      </div>
      <div className="flex justify-center">
        <CloudinaryUploadButton onUploaded={onUploaded} tags={["admin"]} />
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* JSX ראשי                                                           */
  /* ------------------------------------------------------------------ */

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8 space-y-5">
        {/* כותרת + סטטיסטיקות */}
        <header className="rounded-2xl border border-black/20 dark:border-white/10 bg-gradient-to-r from-sky-600 via-violet-600 to-emerald-500 text-white px-4 py-4 md:px-6 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              🎛️ ספריית מדיה
            </h1>
            <p className="text-xs md:text-sm text-white/80">
              ניהול כל קבצי התמונות / וידאו / אודיו של MATY – חיפוש, סינון,
              עריכה ומחיקה.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] mt-1">
              <span className="px-2 py-0.5 rounded-full bg-black/25">
                סה״כ: {stats.totalCount} פריטים
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/70">
                🖼️ תמונות: {stats.images}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/70">
                🎬 וידאו: {stats.videos}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/70">
                🎵 אודיו: {stats.audios}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-black/25">
                💾 נפח מוצג: {formatBytes(stats.totalBytes)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-black/20 p-1 border border-white/30">
              <button
                className={[
                  "px-3 py-1.5 text-xs md:text-sm rounded-full font-medium transition",
                  view === "grid"
                    ? "bg-white text-sky-700 shadow"
                    : "text-white/80 hover:bg-white/10",
                ].join(" ")}
                onClick={() => setView("grid")}
              >
                🔳 Grid
              </button>
              <button
                className={[
                  "px-3 py-1.5 text-xs md:text-sm rounded-full font-medium transition",
                  view === "list"
                    ? "bg-white text-violet-700 shadow"
                    : "text-white/80 hover:bg-white/10",
                ].join(" ")}
                onClick={() => setView("list")}
              >
                📋 List
              </button>
            </div>
            <CloudinaryUploadButton onUploaded={onUploaded} tags={["admin"]} />
          </div>
        </header>

        {/* פס שגיאה */}
        {err && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50/90 text-red-800 px-3 py-2 text-sm flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>שגיאה בטעינה: {err}</span>
          </div>
        )}

        {/* סרגל חיפוש / פילטרים */}
        <section className="mm-card p-3 md:p-4 space-y-3 bg-gradient-to-br from-white via-sky-50 to-violet-50 dark:from-neutral-950 dark:via-sky-950/40 dark:to-violet-950/40 border border-sky-100/80 dark:border-sky-900/50 rounded-2xl">
          <div className="grid gap-2 md:grid-cols-8 md:items-end">
            <div className="md:col-span-3 space-y-1">
              <label
                htmlFor="media-search"
                className="text-[11px] font-medium text-sky-900 dark:text-sky-100"
              >
                🔍 חיפוש
              </label>
              <input
                id="media-search"
                className="mm-input input-rtl border border-sky-200/70 focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70 bg-white/90 dark:bg-neutral-950/80"
                placeholder="חיפוש (כותרת / ID / תג)…"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-sky-900 dark:text-sky-100">
                🎚️ סוג מדיה
              </label>
              <select
                className="mm-select border border-purple-200/70 bg-white/90 dark:bg-neutral-950/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-400/60"
                value={kind}
                onChange={(e) => {
                  setPage(1);
                  setKind(e.target.value as any);
                }}
              >
                <option value="">כל הסוגים</option>
                <option value="image">🖼️ תמונות</option>
                <option value="video">🎬 וידאו</option>
                <option value="audio">🎵 אודיו</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-sky-900 dark:text-sky-100">
                ↕️ סדר
              </label>
              <select
                className="mm-select border border-emerald-200/70 bg-white/90 dark:bg-neutral-950/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/60"
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value as SortOpt);
                }}
              >
                <option value="new">חדשים קודם</option>
                <option value="old">ישנים קודם</option>
                <option value="title">לפי כותרת</option>
                <option value="big">קבצים גדולים</option>
                <option value="small">קבצים קטנים</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-sky-900 dark:text-sky-100">
                📦 כמות בעמוד
              </label>
              <select
                className="mm-select border border-amber-200/70 bg-white/90 dark:bg-neutral-950/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/60"
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
              >
                {[30, 60, 100, 150, 200].map((n) => (
                  <option key={n} value={n}>
                    {n} בעמוד
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 md:col-span-2">
              <button
                className="mm-btn mm-pressable flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold shadow hover:brightness-110 disabled:opacity-60"
                onClick={() => {
                  setPage(1);
                  fetchPage(false);
                }}
                disabled={loading}
              >
                {loading ? "טוען…" : "🔄 רענון"}
              </button>
              <button
                className="mm-btn mm-pressable flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-semibold shadow hover:brightness-110 disabled:opacity-50"
                onClick={deleteSelectedNow}
                disabled={selected.size === 0}
                title="מחיקה מרוכזת"
              >
                🗑️ מחק נבחרים ({selected.size})
              </button>
            </div>
          </div>

          {/* תגיות מהירות */}
          {tagChips.length > 0 && (
            <div className="pt-2 border-t border-black/5 dark:border-white/10 mt-2">
              <div className="text-[11px] font-medium text-sky-900 dark:text-sky-100 mb-1.5">
                🏷️ תגיות נפוצות
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`mm-chip ${
                    !tagFilter ? "mm-chip-active" : ""
                  } bg-neutral-100 dark:bg-neutral-800`}
                  onClick={() => setTagFilter(null)}
                >
                  כל התגיות
                </button>
                {tagChips.map(([t, n]) => (
                  <button
                    key={t}
                    className={`mm-chip ${
                      tagFilter === t ? "mm-chip-active" : ""
                    } bg-sky-100/90 dark:bg-sky-900/50 text-sky-800 dark:text-sky-100`}
                    onClick={() => setTagFilter(tagFilter === t ? null : t)}
                    title={`${n} פריטים`}
                  >
                    #{t}{" "}
                    <span className="opacity-70 ml-1 text-[10px]">({n})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] opacity-70 mt-1">
            נמצאו {total} פריטים בסה״כ • מציג {filteredRows.length} בעמוד {page}
            /{totalPages}
          </div>
        </section>

        {/* שלד טעינה */}
        {loading && rows.length === 0 && !err && (
          <div
            className={
              view === "grid"
                ? "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "mm-card"
            }
          >
            {Array.from({ length: view === "grid" ? 8 : 3 }).map((_, i) => (
              <div key={i} className="card p-2 animate-pulse">
                <div className="aspect-video bg-black/10 rounded-lg" />
                <div className="mt-2 h-4 bg-black/10 rounded" />
                <div className="mt-1 h-3 bg-black/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* ריק */}
        {!loading && !err && rows.length === 0 && Empty}

        {/* רשימה בפועל */}
        {!loading && rows.length > 0 && (
          <>
            {view === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredRows.map((r) => (
                  <article
                    key={r._id || r.publicId}
                    className={`card p-0 overflow-hidden border border-black/5 dark:border-white/10 rounded-2xl shadow-sm ${
                      selected.has(r.publicId)
                        ? "ring-2 ring-sky-400 shadow-md"
                        : ""
                    }`}
                  >
                    {/* פס עליון */}
                    <div
                      className={[
                        "px-3 py-1.5 text-[11px] flex items-center justify-between",
                        r.kind === "image"
                          ? "bg-sky-500/90 text-white"
                          : r.kind === "video"
                            ? "bg-purple-600/90 text-white"
                            : "bg-emerald-600/90 text-white",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-1">
                        <span>
                          {r.kind === "image"
                            ? "🖼️ תמונה"
                            : r.kind === "video"
                              ? "🎬 וידאו"
                              : "🎵 אודיו"}
                        </span>
                        <span className="opacity-80">
                          {r.format?.toUpperCase() || ""}
                        </span>
                      </span>
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={selected.has(r.publicId)}
                          onChange={() => toggleSel(r.publicId)}
                        />
                        <span className="truncate max-w-[14ch]">
                          {r.publicId}
                        </span>
                      </label>
                    </div>

                    {/* תצוגה מקדימה */}
                    <div className="mt-0 aspect-video bg-black/5 rounded-none overflow-hidden grid place-items-center">
                      {r.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.thumbUrl || r.url}
                          alt={r.title || r.publicId}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : r.kind === "video" ? (
                        <video
                          src={r.url}
                          muted
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <audio src={r.url} controls className="w-full" />
                      )}
                    </div>

                    {/* גוף הכרטיס */}
                    <div className="p-3 space-y-2 bg-white/90 dark:bg-neutral-950/90">
                      <InlineEditor row={r} />

                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {(r.tags || []).map((t) => (
                          <span
                            key={t}
                            className="mm-chip bg-sky-50 dark:bg-sky-900/40 text-sky-800 dark:text-sky-100 border border-sky-200/70 dark:border-sky-800/70"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] opacity-70 flex flex-wrap gap-2">
                        {r.bytes && (
                          <span className="inline-flex items-center gap-1">
                            💾 {formatBytes(r.bytes)}
                          </span>
                        )}
                        {r.width && r.height && (
                          <span className="inline-flex items-center gap-1">
                            📐 {r.width}×{r.height}px
                          </span>
                        )}
                        {r.duration && (
                          <span className="inline-flex items-center gap-1">
                            ⏱ {formatDuration(Math.round(r.duration))}
                          </span>
                        )}
                      </div>

                      {/* כפתורי פעולה */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <a
                          href={r.url}
                          target="_blank"
                          className="mm-btn mm-pressable text-xs rounded-xl bg-sky-500 text-white px-3 py-1 shadow hover:brightness-110"
                          rel="noreferrer"
                        >
                          🔗 פתח
                        </a>
                        <button
                          className="mm-btn mm-pressable text-xs rounded-xl bg-violet-500 text-white px-3 py-1 shadow hover:brightness-110"
                          onClick={() => copyToClipboard(r.url, "URL הועתק")}
                        >
                          📋 URL
                        </button>
                        <button
                          className="mm-btn mm-pressable text-xs rounded-xl bg-amber-500 text-white px-3 py-1 shadow hover:brightness-110"
                          onClick={() =>
                            copyToClipboard(r.publicId, "publicId הועתק")
                          }
                        >
                          🧾 ID
                        </button>
                        <button
                          className="mm-btn mm-pressable text-xs rounded-xl bg-rose-500 text-white px-3 py-1 shadow hover:brightness-110"
                          onClick={() => deleteOneNow(r.publicId)}
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              // מצב List
              <div className="mm-card overflow-x-auto bg-white/95 dark:bg-neutral-950/95 border border-black/5 dark:border-white/10 rounded-2xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right text-[11px] border-b bg-gradient-to-r from-sky-600 to-violet-600 text-white">
                      <th className="p-2">✓</th>
                      <th className="p-2">תצוגה</th>
                      <th className="p-2">כותרת / תגיות</th>
                      <th className="p-2 whitespace-nowrap">
                        סוג / פורמט / משך
                      </th>
                      <th className="p-2">גודל / ממדים</th>
                      <th className="p-2">ID</th>
                      <th className="p-2">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => (
                      <tr
                        key={r._id || r.publicId}
                        className="border-t even:bg-sky-50/40 dark:even:bg-neutral-900/60"
                      >
                        <td className="p-2 align-middle">
                          <input
                            type="checkbox"
                            checked={selected.has(r.publicId)}
                            onChange={() => toggleSel(r.publicId)}
                          />
                        </td>
                        <td className="p-2">
                          <div className="w-40 aspect-video bg-black/5 rounded-lg overflow-hidden grid place-items-center">
                            {r.kind === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={r.thumbUrl || r.url}
                                alt={r.title || r.publicId}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : r.kind === "video" ? (
                              <video
                                src={r.url}
                                muted
                                controls
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <audio src={r.url} controls className="w-full" />
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <InlineEditor row={r} />
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {(r.tags || []).map((t) => (
                              <span
                                key={t}
                                className="mm-chip text-[11px] bg-sky-50 dark:bg-sky-900/40 text-sky-800 dark:text-sky-100 border border-sky-200/60 dark:border-sky-800/60"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 whitespace-nowrap text-[12px] opacity-80">
                          {r.kind === "image"
                            ? "🖼️ תמונה"
                            : r.kind === "video"
                              ? "🎬 וידאו"
                              : "🎵 אודיו"}{" "}
                          • {r.format || ""}{" "}
                          {r.duration
                            ? `• ${formatDuration(Math.round(r.duration))}`
                            : ""}
                        </td>
                        <td className="p-2 text-[12px] opacity-80">
                          {r.bytes && <div>💾 {formatBytes(r.bytes)}</div>}
                          {r.width && r.height && (
                            <div>
                              📐 {r.width}×{r.height}px
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <div
                            className="truncate max-w-[22ch] text-[12px]"
                            title={r.publicId}
                          >
                            {r.publicId}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1.5">
                            <a
                              href={r.url}
                              target="_blank"
                              className="mm-btn mm-pressable text-xs rounded-xl bg-sky-500 text-white px-3 py-1 shadow hover:brightness-110"
                              rel="noreferrer"
                            >
                              🔗 פתח
                            </a>
                            <button
                              className="mm-btn mm-pressable text-xs rounded-xl bg-violet-500 text-white px-3 py-1 shadow hover:brightness-110"
                              onClick={() =>
                                copyToClipboard(r.url, "URL הועתק")
                              }
                            >
                              📋 URL
                            </button>
                            <button
                              className="mm-btn mm-pressable text-xs rounded-xl bg-amber-500 text-white px-3 py-1 shadow hover:brightness-110"
                              onClick={() =>
                                copyToClipboard(r.publicId, "publicId הועתק")
                              }
                            >
                              🧾 ID
                            </button>
                            <button
                              className="mm-btn mm-pressable text-xs rounded-xl bg-rose-500 text-white px-3 py-1 shadow hover:brightness-110"
                              onClick={() => deleteOneNow(r.publicId)}
                            >
                              🗑️ מחק
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* בר תחתון לבחירה מרובה */}
            <div className="mm-card p-3 flex flex-wrap items-center justify-between gap-3 mt-3 bg-gradient-to-r from-neutral-50 via-sky-50 to-violet-50 dark:from-neutral-950 dark:via-sky-950/40 dark:to-violet-950/40 border border-black/5 dark:border-white/10 rounded-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="mm-btn mm-pressable rounded-xl bg-neutral-900 text-white text-xs px-3 py-1.5 hover:brightness-110"
                  onClick={selectAllCurrent}
                >
                  ✅ סמן הכל (תוצאה נוכחית)
                </button>
                <button
                  className="mm-btn mm-pressable rounded-xl bg-neutral-200 text-neutral-900 text-xs px-3 py-1.5 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700"
                  onClick={clearSelection}
                >
                  🧹 נקה סימון
                </button>
                <button
                  className="mm-btn mm-pressable rounded-xl bg-rose-500 text-white text-xs px-3 py-1.5 hover:brightness-110 disabled:opacity-50"
                  onClick={deleteSelectedNow}
                  disabled={selected.size === 0}
                >
                  🗑️ מחק נבחרים ({selected.size})
                </button>
              </div>
              <div className="text-xs opacity-80">
                נמצאו {total} פריטים • מציג {filteredRows.length} (עמוד {page}/
                {totalPages})
              </div>
            </div>

            {/* טען עוד / סנטינל */}
            {hasMore && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  className="mm-btn mm-pressable rounded-xl bg-sky-500 text-white text-xs px-4 py-1.5 hover:brightness-110 disabled:opacity-60"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? "טוען…" : "⬇️ טען עוד"}
                </button>
                <div
                  ref={sentinelRef}
                  className="h-4 w-full opacity-0"
                  aria-hidden
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
