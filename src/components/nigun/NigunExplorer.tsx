






"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

/** ─────────────── Types ─────────────── */
export type Item = {
  id: string;
  title: string;
  artists?: string[];
  source: "nigunim" | "local" | "youtube" | "spotify";
  url?: string;          // קובץ אודיו לניגון
  link?: string;         // קישור חיצוני
  cover?: string;
  duration?: number;
  tags?: string[];
  mood?: string;
  tempo?: "slow" | "mid" | "fast";
  bpm?: number;
  origin?: string;
  sourceUrl?: string;    // עמוד מקור (לקרדיט)
};

/** ─────────────── Utils ─────────────── */
const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");
const MOODS = ["דביקות", "שמחה", "מרומם", "רגוע"] as const;
const TEMPOS: Array<Item["tempo"]> = ["slow", "mid", "fast"];
const CATEGORIES = [
  { key: "chabad", label: 'חב"ד' },
  { key: "breslov", label: "ברסלב" },
  { key: "carlebach", label: "קרליבך" },
  { key: "shabbat", label: "שבת" },
  { key: "wedding", label: "חתונה" },
  { key: "chasidic", label: "חסידי" },
  { key: "israeli", label: "דתי־לאומי" },
  { key: "soul", label: "שירי נשמה" },
] as const;

const SURPRISE = ["צמאה", "ידיד נפש", "ושמחת", "יגדל", "טאנץ", "כה אמר", "ניא", "יפוצו"];

/** חיפוש גמיש */
function buildSearchLink(title: string, where: "youtube" | "spotify") {
  const q = encodeURIComponent(`${title} ניגון`.trim());
  return where === "youtube"
    ? `https://www.youtube.com/results?search_query=${q}`
    : `https://open.spotify.com/search/${q}`;
}

/** פרוקסי בטוח לניגון */
function proxify(u?: string) {
  if (!u) return "";
  try {
    const parsed = new URL(u);
    if (typeof window !== "undefined" && parsed.origin === window.location.origin) return u;
    if (parsed.protocol === "http:" || parsed.protocol === "https:")
      return `/api/proxy?u=${encodeURIComponent(parsed.toString())}`;
    return u;
  } catch { return u || ""; }
}

/** fetch JSON עם backoff קצר */
async function getJSON(url: string, signal?: AbortSignal, retries = 2) {
  let attempt = 0;
  // נעטוף את כל הלולאה ב־try כדי ללכוד AbortError של fetch
  try {
    while (true) {
      const res = await fetch(url, { cache: "no-store", signal });
      if (!res.ok) {
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await new Promise(r => setTimeout(r, 250 + attempt * 300));
          attempt++; continue;
        }
        return { ok: false, error: `HTTP_${res.status}` };
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return { ok: false, error: "NON_JSON" };
      try { return await res.json(); }
      catch {
        if (attempt < retries) { attempt++; continue; }
        return { ok: false, error: "BAD_JSON" };
      }
    }
  } catch (e: any) {
    // אם זו הפסקה יזומה – נחזיר דגל aborted במקום להפיל חריגה
    if (e?.name === "AbortError") return { ok: false, aborted: true };
    return { ok: false, error: "FETCH_FAIL" };
  }
}

/** דיבאונסר ערך */
function useDebounced<T>(value: T, delay = 350) {
  const [v, set] = useState(value);
  useEffect(() => { const t = setTimeout(() => set(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

/** ─────────────── UI Icons ─────────────── */
const I = ({ children, className }: { children: React.ReactNode; className?: string }) =>
  <span className={className} aria-hidden>{children}</span>;
const Icons = {
  music: (p: any) => <I {...p}>🎵</I>,
  play: (p: any) => <I {...p}>▶️</I>,
  pause: (p: any) => <I {...p}>⏸️</I>,
  search: (p: any) => <I {...p}>🔎</I>,
  shuffle: (p: any) => <I {...p}>🔀</I>,
  db: (p: any) => <I {...p}>🗄️</I>,
  youtube: (p: any) => <I {...p}>▶️</I>,
  spotify: (p: any) => <I {...p}>🟢</I>,
  next: (p: any) => <I {...p}>⏭️</I>,
  prev: (p: any) => <I {...p}>⏮️</I>,
  spark: (p: any) => <I {...p}>✨</I>,
};

/** ─────────────── Component ─────────────── */
export default function NigunExplorer() {
  // פילטרים
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tag, setTag] = useState("");
  const [mood, setMood] = useState("");
  const [tempo, setTempo] = useState<Item["tempo"] | "">("");
  const [bpmMin, setBpmMin] = useState<number | "">("");
  const [bpmMax, setBpmMax] = useState<number | "">("");

  // מקורות
  const [useDb, setUseDb] = useState(true);
  const [useLocal, setUseLocal] = useState(true);
  const [useYT, setUseYT] = useState(false);
  const [useSpotify, setUseSpotify] = useState(false);

  // נתונים
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(60);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // נגן
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const debouncedQ = useDebounced(q, 350);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; abortRef.current?.abort(); }, []);

  // שימור ניקיון refs בין עמודים
  useEffect(() => {
    const alive = new Set(items.map(i => i.id));
    Object.keys(audioRefs.current).forEach(k => { if (!alive.has(k)) delete audioRefs.current[k]; });
  }, [items]);

  // פרמטרים ל־API
  const params = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("page", String(page));
    if (debouncedQ.trim()) sp.set("q", debouncedQ.trim());
    if (category) sp.set("category", category);
    if (tag.trim()) sp.set("tag", tag.trim());
    if (mood) sp.set("mood", mood);
    if (tempo) sp.set("tempo", tempo);
    if (bpmMin !== "" && Number.isFinite(Number(bpmMin))) sp.set("bpmMin", String(bpmMin));
    if (bpmMax !== "" && Number.isFinite(Number(bpmMax))) sp.set("bpmMax", String(bpmMax));

    const sources: string[] = [];
    if (useDb) sources.push("nigunim");
    if (useLocal) sources.push("local");
    if (useYT) sources.push("youtube");
    if (useSpotify) sources.push("spotify");
    sp.set("source", sources.join(",") || "nigunim");
    return sp.toString();
  }, [limit, page, debouncedQ, category, tag, mood, tempo, bpmMin, bpmMax, useDb, useLocal, useYT, useSpotify]);

  /** ───────── fetch עם טיפול נכון ב־AbortError ───────── */
  const fetchPage = useCallback(async () => {
    // מבטלים בקשה קודמת (אם יש)
    try { abortRef.current?.abort(); } catch {}
    const ctl = new AbortController();
    abortRef.current = ctl;

    setLoading(true);
    setError(null);

    let res: any;
    try {
      res = await getJSON(`/api/nigunim?${params}`, ctl.signal);
    } catch (e: any) {
      // ייתכן AbortError שמגיע מ־getJSON (בכל מקרה נתפוס גם שם)
      if (e?.name === "AbortError") { /* שקט */ setLoading(false); return; }
      setLoading(false);
      setHasMore(false);
      setError("FETCH_FAIL");
      toast.error("שגיאה בטעינת ניגונים");
      return;
    }

    // אם הופסקה יזום — לצאת בשקט
    if (res?.aborted) { setLoading(false); return; }

    if (!mountedRef.current) return;

    if (!res?.ok) {
      setLoading(false);
      setHasMore(false);
      if (res?.error) {
        // לא מציגים טוסט על AbortError
        if (res.error !== "FETCH_FAIL" && !res.aborted) toast.error("שגיאה בטעינת ניגונים");
      }
      setError(res?.error || "fetch_failed");
      return;
    }

    const newItems: Item[] = res.items || [];
    setItems(prev => {
      const seen = new Set(prev.map(x => x.id));
      const merged = [...prev];
      for (const it of newItems) if (!seen.has(it.id)) merged.push(it);
      return merged;
    });
    setHasMore(newItems.length >= limit);
    setLoading(false);
  }, [params, limit]);

  // reset בעת שינוי פילטרים
  useEffect(() => {
    setItems([]); setPage(1); setHasMore(true); setError(null);
  }, [debouncedQ, category, tag, mood, tempo, bpmMin, bpmMax, useDb, useLocal, useYT, useSpotify]);

  // טעינת דף
  useEffect(() => { fetchPage(); }, [fetchPage]);

  // אינפיניט־סקול
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading && hasMore) setPage(p => p + 1);
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, hasMore]);

  /** ─────────────── Player ─────────────── */
  const current = useMemo(() => items.find(x => x.id === playingId), [items, playingId]);

  const stopAll = () => Object.values(audioRefs.current).forEach(a => { try { a?.pause(); } catch {} });

  const playId = async (id: string) => {
    stopAll();
    const el = audioRefs.current[id];
    if (!el) return;
    const ensureCanPlay = () => new Promise<void>((resolve, reject) => {
      if (el.readyState >= 2) return resolve();
      const onReady = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); reject(new Error("audio_error")); };
      const cleanup = () => { el.removeEventListener("canplay", onReady); el.removeEventListener("error", onErr); };
      try { el.load(); } catch {}
      el.addEventListener("canplay", onReady, { once: true });
      el.addEventListener("error", onErr, { once: true });
      setTimeout(() => { if (el.readyState >= 2) { cleanup(); resolve(); } }, 1500);
    });
    try {
      await ensureCanPlay();
      await el.play();
      setPlayingId(id);
    } catch {
      toast.error("לא ניתן לנגן את הרצועה");
    }
  };

  const pauseId = (id: string) => { try { audioRefs.current[id]?.pause(); } catch {} if (playingId === id) setPlayingId(null); };
  const togglePlay = (id: string) => { const el = audioRefs.current[id]; if (!el) return; el.paused ? void playId(id) : pauseId(id); };

  const onEnded = (id: string) => {
    if (playingId !== id) return;
    const cur = items.findIndex(x => x.id === id);
    for (let i = cur + 1; i < items.length; i++) if (items[i].url) { void playId(items[i].id); return; }
    setPlayingId(null);
  };

  // התקדמות
  useEffect(() => {
    const el = playingId ? audioRefs.current[playingId] : null;
    if (!el) return;
    const onTU = () => { if (el.duration > 0) setProgress(el.currentTime / el.duration); };
    const onDC = () => { if (el.duration > 0) setProgress(el.currentTime / el.duration); };
    el.addEventListener("timeupdate", onTU); el.addEventListener("durationchange", onDC);
    return () => { el.removeEventListener("timeupdate", onTU); el.removeEventListener("durationchange", onDC); };
  }, [playingId]);

  // קיצורי מקשים
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag && ["input","textarea","select"].includes(tag)) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if (k === " ") { if (playingId) { e.preventDefault(); togglePlay(playingId); } }
      if (k === "j") {
        const cur = items.findIndex(x => x.id === playingId);
        for (let i = cur - 1; i >= 0; i--) if (items[i].url) { void playId(items[i].id); return; }
      }
      if (k === "k") {
        const cur = items.findIndex(x => x.id === playingId);
        for (let i = cur + 1; i < items.length; i++) if (items[i].url) { void playId(items[i].id); return; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingId, items]);

  const clearFilters = () => { setCategory(""); setTag(""); setMood(""); setTempo(""); setBpmMin(""); setBpmMax(""); };

  /** ─────────────── Render ─────────────── */
  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">ניגונים</h1>
            <p className="text-xs opacity-70">אלפי שירים אמיתיים מה־DB והטמעות • חיפוש/פילטרים • נגן תחתון</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQ(SURPRISE[Math.floor(Math.random()*SURPRISE.length)])}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-3 py-2 text-sm shadow hover:opacity-90"
            >
              <Icons.shuffle /> הפתיעו אותי
            </button>
          </div>
        </div>
      </div>

      {/* Sticky controls */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Icons.search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              ref={searchRef}
              dir="rtl"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-10 py-2 outline-none focus:border-fuchsia-400"
              placeholder="חיפוש — שם/אומן/אלבום (Ctrl/Cmd+K)"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* קטגוריות */}
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(v => v === c.key ? "" : c.key)}
                aria-pressed={category === c.key}
                className={cx(
                  "rounded-full border px-3 py-1 text-sm",
                  category === c.key ? "bg-fuchsia-600 border-fuchsia-600" : "bg-white/10 border-white/10"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="col-span-full flex flex-wrap items-center gap-2 pt-1">
            {/* BPM */}
            <input type="number" min={40} max={220} value={bpmMin}
              onChange={e => setBpmMin(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-24 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm" placeholder="BPM מ-" dir="ltr" />
            <input type="number" min={40} max={220} value={bpmMax}
              onChange={e => setBpmMax(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-24 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm" placeholder="עד BPM" dir="ltr" />

            {/* מצב רוח */}
            <select value={mood} onChange={e => setMood(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm">
              <option value="">מצב־רוח</option>
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {/* טמפו */}
            <select value={tempo || ""} onChange={e => setTempo((e.target.value || "") as Item["tempo"] | "")}
              className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm">
              <option value="">טמפו</option>
              {TEMPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* תג */}
            <input dir="rtl" className="w-36 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm"
              placeholder="תג (למשל: ריקוד)" value={tag} onChange={e => setTag(e.target.value)} />

            <button onClick={() => { setCategory(""); setTag(""); setMood(""); setTempo(""); setBpmMin(""); setBpmMax(""); }}
              className="rounded-lg border border-white/10 px-3 py-1 text-sm">נקה</button>

            {/* מקורות */}
            <SourceChip active={useDb} onClick={() => setUseDb(v => !v)} icon={<Icons.db />} label="DB" />
            <SourceChip active={useLocal} onClick={() => setUseLocal(v => !v)} icon={<Icons.music />} label="Local" />
            <SourceChip active={useYT} onClick={() => setUseYT(v => !v)} icon={<Icons.youtube />} label="YouTube" />
            <SourceChip active={useSpotify} onClick={() => setUseSpotify(v => !v)} icon={<Icons.spotify />} label="Spotify" />
          </div>
        </div>
      </div>

      {/* Errors */}
      {!!error && (
        <div className="mx-auto mt-4 max-w-7xl px-4">
          <div className="rounded-xl border border-red-900/40 bg-red-900/20 p-3 text-sm text-red-200">
            תקלה בטעינה: {error}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && items.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))
            : items.map((it, idx) => (
                <TrackCard
                  key={it.id}
                  it={it}
                  idx={idx}
                  playing={playingId === it.id && audioRefs.current[it.id]?.paused === false}
                  onPlay={() => togglePlay(it.id)}
                  registerAudio={(el) => (audioRefs.current[it.id] = el)}
                  onEnded={() => onEnded(it.id)}
                />
              ))}
        </div>

        {/* Sentinel & bottom states */}
        <div ref={sentinelRef} className="h-12" />
        {loading && items.length > 0 && (
          <div className="mt-4 text-center text-sm opacity-70">טוען עוד…</div>
        )}
        {!hasMore && !loading && items.length > 0 && (
          <div className="mt-4 text-center text-sm opacity-70">הגעת לסוף 🎉</div>
        )}
        {!loading && !items.length && !error && (
          <div className="mt-6 text-center text-sm opacity-70">אין תוצאות.</div>
        )}
      </div>

      {/* Mini Player */}
      {current && (
        <MiniPlayer
          item={current}
          progress={progress}
          onSeek={(ratio) => {
            const el = playingId ? audioRefs.current[playingId] : null;
            if (!el || !Number.isFinite(el.duration)) return;
            el.currentTime = Math.max(0, Math.min(el.duration - 0.25, el.duration * ratio));
          }}
          onPlay={() => playingId && void playId(playingId)}
          onPause={() => playingId && pauseId(playingId)}
          onPrev={() => {
            const cur = items.findIndex(x => x.id === playingId);
            for (let i = cur - 1; i >= 0; i--) if (items[i].url) { void playId(items[i].id); return; }
          }}
          onNext={() => {
            const cur = items.findIndex(x => x.id === playingId);
            for (let i = cur + 1; i < items.length; i++) if (items[i].url) { void playId(items[i].id); return; }
          }}
        />
      )}
    </div>
  );
}

/** ─────────────── Sub-components ─────────────── */

function SourceChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
        active ? "bg-fuchsia-600 border-fuchsia-600" : "bg-white/10 border-white/10"
      )}
      title={label}
    >
      {icon}<span>{label}</span>
    </button>
  );
}

function TrackCard({
  it, idx, playing, onPlay, registerAudio, onEnded,
}: {
  it: Item; idx: number; playing: boolean; onPlay: () => void;
  registerAudio: (el: HTMLAudioElement | null) => void; onEnded: () => void;
}) {
  const playable = !!it.url;
  const proxied = proxify(it.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.02, 0.18) }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px]">
          {badgeForSource(it.source)}
          <span className="opacity-70">{it.source}</span>
        </span>
        <div className="flex items-center gap-2 text-[11px] opacity-70">
          {typeof it.bpm === "number" && <span>BPM {it.bpm}</span>}
          {it.tempo && <span>{it.tempo}</span>}
          {it.mood && <span>{it.mood}</span>}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        {it.cover ? (
          <img src={it.cover} alt="" className="h-20 w-20 rounded-xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-200/20 to-purple-200/20">
            <Icons.music className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold" title={it.title}>{it.title}</div>
          <div className="truncate text-sm opacity-70">{it.artists?.join(", ")}</div>
        </div>
      </div>

      {!!it.tags?.length && (
        <div className="mb-3 flex flex-wrap gap-1">
          {it.tags.slice(0, 6).map(t => (
            <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{t}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2">
        {playable ? (
          <button
            onClick={onPlay}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm hover:opacity-90"
          >
            {playing ? <Icons.pause /> : <Icons.play />} {playing ? "Pause" : "Play"}
          </button>
        ) : it.link ? (
          <a href={it.link} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-3 py-2 text-sm hover:opacity-90">
            <Icons.music /> פתיחה בקישור
          </a>
        ) : (
          <div className="flex gap-2">
            <a href={buildSearchLink(it.title, "youtube")} target="_blank" rel="noopener noreferrer"
               className="rounded-xl bg-red-500 px-3 py-2 text-sm hover:opacity-90"><Icons.youtube /> YouTube</a>
            <a href={buildSearchLink(it.title, "spotify")} target="_blank" rel="noopener noreferrer"
               className="rounded-xl bg-green-600 px-3 py-2 text-sm hover:opacity-90"><Icons.spotify /> Spotify</a>
          </div>
        )}

        {playable && (
          <audio
            key={it.id + ":" + proxied}
            ref={registerAudio}
            src={proxied}
            crossOrigin="anonymous"
            preload="metadata"
            playsInline
            onEnded={onEnded}
            onError={(e) => {
              toast.error("שגיאת ניגון — נסה קישור חיצוני");
              console.warn("[audio.error]", it.title, (e.currentTarget as HTMLAudioElement).error?.code);
            }}
            className="hidden"
          />
        )}
      </div>

      <div className="mt-2 text-xs opacity-60">
        מקור: {it.origin ? it.origin : it.source}{" "}
        {it.sourceUrl && (
          <>
            • <a className="underline" href={it.sourceUrl} target="_blank">עמוד מקור</a>
          </>
        )}
      </div>
    </motion.div>
  );
}

function badgeForSource(src: Item["source"]) {
  switch (src) {
    case "nigunim": return <Icons.db className="h-3.5 w-3.5" />;
    case "youtube": return <Icons.youtube className="h-3.5 w-3.5" />;
    case "spotify": return <Icons.spotify className="h-3.5 w-3.5" />;
    default: return <Icons.music className="h-3.5 w-3.5" />;
  }
}

function MiniPlayer({
  item, progress, onSeek, onPlay, onPause, onPrev, onNext,
}: {
  item: Item; progress: number;
  onSeek: (ratio: number) => void; onPlay: () => void; onPause: () => void;
  onPrev: () => void; onNext: () => void;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(960px,94%)] rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur">
      <div className="flex items-center gap-3 p-3">
        {item.cover ? (
          <img src={item.cover} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10"><Icons.music /></div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.title}</div>
          <div className="truncate text-xs opacity-70">{item.artists?.join(", ")}</div>

          <div
            className="mt-2 h-2 w-full cursor-pointer overflow-hidden rounded-full bg-white/10"
            onClick={(e) => {
              const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              onSeek((e.clientX - r.left) / r.width);
            }}
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
          >
            <div className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 pl-1">
          <button onClick={onPrev} className="rounded-xl border border-white/10 px-2 py-1 text-sm hover:bg-white/10" title="קודם (J)"><Icons.prev /></button>
          <button onClick={onPlay} className="rounded-xl bg-white px-3 py-1.5 text-sm text-black hover:opacity-90" title="Play/Pause (Space)"><Icons.play /></button>
          <button onClick={onPause} className="rounded-xl border border-white/10 px-2 py-1 text-sm hover:bg-white/10" title="Pause"><Icons.pause /></button>
          <button onClick={onNext} className="rounded-xl border border-white/10 px-2 py-1 text-sm hover:bg-white/10" title="הבא (K)"><Icons.next /></button>
        </div>
      </div>
    </div>
  );
}
