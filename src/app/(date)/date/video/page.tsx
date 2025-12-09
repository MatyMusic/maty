// src/app/(date)/date/video/page.tsx
"use client";

/**
 * MATY-DATE · Video / Avatar / Story (2025)
 * - טאבים: אווטאר מדבר / מצלמה / סטורי
 * - TalkingAvatar (3D/2D) + TTS דפדפן
 * - העלאת תמונת אווטאר + Drag&Drop
 * - מצלמה חיה עם פילטרים (CSS + אימוג'י מצחיקים)
 * - הקלטת סטורי (וידאו+אודיו) + שמירה מקומית + מחיקה
 * - טעינת פרופיל לפי ?to= + תמיכת אדמין (x-maty-admin)
 */

import TalkingAvatar, {
  type AvatarEmotion,
  type AvatarKind,
  type BgStyle,
} from "@/components/maty-date/TalkingAvatar";
import {
  Camera,
  MessageCircle,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  User2,
  Video as VideoIcon,
  Wand2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

type Tier = "free" | "plus" | "pro" | "vip";
type SubStatus = "active" | "inactive";
type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

type Profile = {
  userId: string;
  displayName?: string | null;
  city?: string | null;
  country?: string | null;
  birthDate?: string | null;
  gender?: "male" | "female" | "other" | null;
  judaism_direction?: Direction | null;
  goals?: "serious" | "marriage" | "friendship" | null;
  about_me?: string | null;
  subscription?: { status: SubStatus; tier: Tier } | null;
};

type ApiResp = { ok: true; profile: Profile } | { ok: false; error: string };

type VideoFilter =
  | "none"
  | "bw"
  | "warm"
  | "cool"
  | "blur"
  | "funky"
  | "glasses"
  | "mustache";

type Story = {
  id: string;
  url: string;
  createdAt: string;
  durationSec?: number;
  title?: string;
};

const STORIES_KEY = "matydate:stories:v1";
const SCRIPT_KEY = "matydate:video:script";
const PREFS_KEY = "matydate:video:prefs";

function yearsFromBirth(b?: string | null) {
  if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return "";
  const now = new Date();
  const y = now.getFullYear() - parseInt(b.slice(0, 4));
  const mday = b.slice(5);
  return (
    mday >
    `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`
      ? y - 1
      : y
  ).toString();
}

function dirHeb(d?: Direction | null) {
  if (!d) return "";
  const map: Record<Direction, string> = {
    orthodox: "אורתודוקסי",
    haredi: "חרדי",
    chasidic: "חסידי",
    modern: "אורתודוקסי מודרני",
    conservative: "קונסרבטיבי",
    reform: "רפורמי",
    reconstructionist: "רקונסטרוקטיבי",
    secular: "חילוני/תרבותי",
  };
  return map[d] || String(d);
}

function loadLocalStories(): Story[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORIES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Story[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocalStories(stories: Story[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  } catch {}
}

/* ---------- UI Atoms ---------- */

function GlassButton({
  children,
  onClick,
  className = "",
  disabled,
  title,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "h-10 px-4 rounded-full inline-flex items-center gap-2",
        "border border-white/15 bg-white/10 hover:bg-white/15",
        "text-white backdrop-blur transition disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/12 bg-white/6 backdrop-blur-md",
        "bg-white/6 dark:bg-white/4 text-white/95",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function VideoPage() {
  const params = useSearchParams();
  const toRaw = params.get("to") || "";
  const toUserId = decodeURIComponent(toRaw);

  const [tab, setTab] = useState<"avatar" | "webcam" | "story">("avatar");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // אדמין
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag =
      (window as any).__MM_IS_ADMIN__ === true ||
      (document?.documentElement?.dataset as any)?.admin === "1";
    setIsAdmin(!!flag);
  }, []);
  const adminHeaders = useMemo(
    () => (isAdmin ? { "x-maty-admin": "1" } : {}),
    [isAdmin],
  );

  // ---------- Avatar state ----------

  const [kind, setKind] = useState<AvatarKind>("emoji");
  const [emotion, setEmotion] = useState<AvatarEmotion>("happy");
  const [color, setColor] = useState<string>("#8b5cf6");
  const [bg, setBg] = useState<BgStyle>("violet");
  const [light, setLight] = useState<"studio" | "warm" | "cool">("studio");
  const [env, setEnv] = useState<
    "studio" | "city" | "sunset" | "dawn" | "night" | "forest"
  >("studio");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const prevAvatarUrlRef = useRef<string | null>(null);

  // ---------- TTS / Script ----------

  const [script, setScript] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [viseme, setViseme] = useState(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string>("");

  // ---------- Webcam (live) ----------

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [videoFilter, setVideoFilter] = useState<VideoFilter>("none");

  // ---------- Story recording ----------

  const storyCamRef = useRef<HTMLVideoElement | null>(null);
  const storyStreamRef = useRef<MediaStream | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recState, setRecState] = useState<"idle" | "rec" | "saving">("idle");
  const [stories, setStories] = useState<Story[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState("");

  // ---------- Load profile ----------

  useEffect(() => {
    if (!toUserId) return;
    let dead = false;
    (async () => {
      setLoadingProfile(true);
      setErr(null);
      try {
        const r = await fetch(
          `/api/date/profile/${encodeURIComponent(toUserId)}`,
          {
            cache: "no-store",
            headers: { ...adminHeaders },
          },
        );
        const j: ApiResp = await r.json().catch(() => {
          throw new Error(`HTTP ${r.status}`);
        });
        if (!r.ok || !j.ok) throw new Error((j as any).error || "bad_profile");
        if (!dead) setProfile(j.profile);
      } catch (e: any) {
        if (!dead)
          setErr(e?.message || "שגיאה בטעינת הפרופיל. נסה/י שוב מאוחר יותר.");
      } finally {
        if (!dead) setLoadingProfile(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [toUserId, adminHeaders]);

  // ---------- Init script + avatar prefs ----------

  useEffect(() => {
    // prefs
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.kind) setKind(p.kind);
        if (p.emotion) setEmotion(p.emotion);
        if (p.color) setColor(p.color);
        if (p.bg) setBg(p.bg);
        if (p.light) setLight(p.light);
        if (p.env) setEnv(p.env);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // script
    const saved = window.localStorage.getItem(SCRIPT_KEY);
    if (saved && saved.trim()) {
      setScript(saved);
      return;
    }
    const p = profile;
    if (!p) return;
    const age = yearsFromBirth(p.birthDate);
    const chunks: string[] = [];
    chunks.push(`היי! נעים מאוד, אני ${p.displayName || "אורח/ת"}.`);
    if (age) chunks.push(`בן/בת ${age}.`);
    if (p.judaism_direction)
      chunks.push(`בזרם ${dirHeb(p.judaism_direction)}.`);
    if (p.city || p.country)
      chunks.push(`גר/ה ב${[p.city, p.country].filter(Boolean).join(", ")}.`);
    if (p.goals) {
      chunks.push(
        `מחפש/ת ${
          p.goals === "serious"
            ? "קשר רציני"
            : p.goals === "marriage"
              ? "נישואין"
              : "חברות"
        }.`,
      );
    }
    chunks.push("אוהב/ת מוזיקה טובה, לטייל ולהכיר אנשים איכותיים.");
    chunks.push("אם נראה לך מתאים — בוא/י נדבר 😊");
    setScript(chunks.join(" "));
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SCRIPT_KEY, script || "");
      window.localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ kind, emotion, color, bg, light, env }),
      );
    } catch {}
  }, [script, kind, emotion, color, bg, light, env]);

  // ---------- TTS voices ----------

  useEffect(() => {
    if (typeof window === "undefined") return;
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (!voiceName && v.length) {
        const he =
          v.find((x) => /he-|Hebrew|Ivrit/i.test(`${x.lang} ${x.name}`)) ||
          v[0];
        setVoiceName(he?.name || v[0]?.name || "");
      }
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [voiceName]);

  function speak() {
    if (!script.trim() || typeof window === "undefined") return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(script);
      const v = voices.find((x) => x.name === voiceName);
      if (v) u.voice = v;
      u.lang = v?.lang || "he-IL";
      u.rate = 1;
      u.pitch = 1;
      u.onstart = () => setSpeaking(true);
      u.onboundary = () => setViseme((x) => (x > 0.5 ? 0.1 : 1));
      u.onend = () => {
        setSpeaking(false);
        setViseme(0);
      };
      u.onerror = () => {
        setSpeaking(false);
        setViseme(0);
      };
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch {
      setSpeaking(false);
    }
  }

  function stopSpeak() {
    if (typeof window !== "undefined") {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setSpeaking(false);
    setViseme(0);
  }

  // ---------- Avatar image upload / drag ----------

  function onPickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (prevAvatarUrlRef.current) {
      URL.revokeObjectURL(prevAvatarUrlRef.current);
    }
    const url = URL.createObjectURL(f);
    prevAvatarUrlRef.current = url;
    setImageUrl(url);
    setKind("photo");
  }

  function onDropAvatar(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (prevAvatarUrlRef.current) {
      URL.revokeObjectURL(prevAvatarUrlRef.current);
    }
    const url = URL.createObjectURL(f);
    prevAvatarUrlRef.current = url;
    setImageUrl(url);
    setKind("photo");
  }

  function onDragOverAvatar(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  useEffect(() => {
    return () => {
      if (prevAvatarUrlRef.current) {
        URL.revokeObjectURL(prevAvatarUrlRef.current);
      }
    };
  }, []);

  // ---------- Webcam live ----------

  const filterClass =
    {
      none: "",
      bw: "filter grayscale",
      warm: "filter sepia",
      cool: "filter hue-rotate-180",
      blur: "filter blur-sm",
      funky: "filter contrast-150 saturate-150 hue-rotate-15",
      glasses: "",
      mustache: "",
    }[videoFilter] || "";

  async function toggleLiveCam() {
    if (camOn) {
      // כיבוי
      const s = liveStreamRef.current;
      s?.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = null;
      }
      setCamOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // בלי אודיו בלייב כדי לא לקבל פידבק
      });
      liveStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
      setCamOn(true);
    } catch (e: any) {
      setErr(e?.message || "שגיאה בהפעלת מצלמה");
    }
  }

  useEffect(
    () => () => {
      const s1 = liveStreamRef.current;
      s1?.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
      const s2 = storyStreamRef.current;
      s2?.getTracks().forEach((t) => t.stop());
      storyStreamRef.current = null;
    },
    [],
  );

  // ---------- Stories: init from localStorage ----------

  useEffect(() => {
    setStories(loadLocalStories());
  }, []);

  useEffect(() => {
    saveLocalStories(stories);
  }, [stories]);

  // ---------- Story camera + recording ----------

  async function ensureStoryCam() {
    if (storyStreamRef.current && storyCamRef.current?.srcObject) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      storyStreamRef.current = stream;
      if (storyCamRef.current) {
        storyCamRef.current.srcObject = stream;
        await storyCamRef.current.play();
      }
    } catch (e: any) {
      setErr(e?.message || "שגיאה בהפעלת מצלמה לסטורי");
    }
  }

  async function toggleRecord() {
    if (recState === "rec") {
      // עצירת הקלטה
      setRecState("saving");
      mediaRecRef.current?.stop();
      return;
    }
    if (recState !== "idle") return;

    await ensureStoryCam();
    const s = storyStreamRef.current;
    if (!s) return;

    chunksRef.current = [];
    const rec = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp9" });
    mediaRecRef.current = rec;

    const startedAt = Date.now();

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });

      const durationSec = (Date.now() - startedAt) / 1000;
      const id = `story-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      // אפשרות: שליחה לשרת /api/date/video-story (אם קיים)
      try {
        const fd = new FormData();
        fd.append("file", blob, `${id}.webm`);
        fd.append("title", storyTitle || "");
        const r = await fetch("/api/date/video-story", {
          method: "POST",
          body: fd,
          headers: { ...adminHeaders },
        }).catch(() => null);
        if (r && r.ok) {
          // נניח שהשרת מחזיר URL קבוע
          const j = await r.json().catch(() => null);
          const remoteUrl = j?.url || url;
          setStories((prev) => [
            {
              id,
              url: remoteUrl,
              createdAt: new Date().toISOString(),
              durationSec,
              title: storyTitle || "",
            },
            ...prev,
          ]);
        } else {
          setStories((prev) => [
            {
              id,
              url,
              createdAt: new Date().toISOString(),
              durationSec,
              title: storyTitle || "",
            },
            ...prev,
          ]);
        }
      } catch {
        setStories((prev) => [
          {
            id,
            url,
            createdAt: new Date().toISOString(),
            durationSec,
            title: storyTitle || "",
          },
          ...prev,
        ]);
      } finally {
        setRecState("idle");
        setStoryTitle("");
      }
    };

    rec.start();
    setRecState("rec");
  }

  function deleteStory(id: string) {
    const st = stories.find((s) => s.id === id);
    if (st && st.url.startsWith("blob:")) {
      URL.revokeObjectURL(st.url);
    }
    setStories((prev) => prev.filter((s) => s.id !== id));

    // אופציונלי: מחיקה מהשרת
    fetch(`/api/date/video-story/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { ...adminHeaders },
    }).catch(() => {});
  }

  // ---------- Layout helpers ----------

  const headline =
    profile?.displayName ||
    (toUserId && !toUserId.startsWith("seed")
      ? toUserId
      : "וידאו / אווטאר / סטורי");

  const subtitle = [profile?.displayName, profile?.city, profile?.country]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      dir="rtl"
      className="min-h-dvh bg-[#050511] text-white"
      style={{
        backgroundImage:
          "radial-gradient(600px 260px at 50% -10%, rgba(136,84,208,.26), transparent), radial-gradient(520px 260px at 90% 0%, rgba(255,20,147,.20), transparent), radial-gradient(520px 260px at 0% 0%, rgba(56,189,248,.18), transparent)",
      }}
    >
      <main className="mx-auto max-w-6xl px-4 py-7 md:py-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm opacity-70 mb-1">
              MATY-DATE · וידאו · 2025
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center gap-2">
              {headline}
              <Sparkles className="h-6 w-6 text-fuchsia-400" />
            </h1>
            {loadingProfile ? (
              <div className="mt-1 text-xs opacity-70">טוען פרופיל… רגע…</div>
            ) : err ? (
              <div className="mt-1 text-xs text-rose-300 max-w-md">{err}</div>
            ) : subtitle ? (
              <div className="mt-1 text-xs sm:text-sm opacity-80 flex items-center gap-2">
                <User2 className="h-4 w-4" />
                <span className="truncate max-w-xs sm:max-w-md">
                  {subtitle}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <GlassButton
              onClick={() => (window.location.href = "/date/matches")}
              title="חזור להתאמות"
            >
              <MessageCircle className="h-4 w-4" />
              להתאמות
            </GlassButton>
            <GlassButton
              onClick={() => (window.location.href = "/date/chat")}
              title="צ׳אט"
            >
              <Camera className="h-4 w-4" />
              לצ׳אט
            </GlassButton>
          </div>
        </header>

        {/* Tabs */}
        <section className="mt-5">
          <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10 backdrop-blur">
            <button
              className={`h-9 px-4 sm:h-10 sm:px-5 rounded-full text-sm sm:text-base ${
                tab === "avatar" ? "bg-white/15 font-semibold" : "opacity-75"
              }`}
              onClick={() => setTab("avatar")}
            >
              אווטאר מדבר
            </button>
            <button
              className={`h-9 px-4 sm:h-10 sm:px-5 rounded-full text-sm sm:text-base ${
                tab === "webcam" ? "bg-white/15 font-semibold" : "opacity-75"
              }`}
              onClick={() => setTab("webcam")}
            >
              מצלמה חיה
            </button>
            <button
              className={`h-9 px-4 sm:h-10 sm:px-5 rounded-full text-sm sm:text-base ${
                tab === "story" ? "bg-white/15 font-semibold" : "opacity-75"
              }`}
              onClick={() => setTab("story")}
            >
              סטורי אישי
            </button>
          </div>
        </section>

        {/* Content per tab */}
        {tab === "avatar" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr,0.9fr]">
            {/* Avatar canvas */}
            <GlassCard className="p-3 sm:p-4">
              <div className="rounded-2xl overflow-hidden border border-white/12 bg-black/40">
                <div className="aspect-[7/9] sm:aspect-[16/9]">
                  <TalkingAvatar
                    kind={kind}
                    emotion={emotion}
                    color={color}
                    speaking={speaking}
                    viseme={viseme}
                    imageUrl={imageUrl}
                    light={light}
                    bg={bg}
                    env={env}
                    dpr={[1, 2]}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!speaking ? (
                  <GlassButton
                    onClick={speak}
                    className="bg-fuchsia-600/80 hover:bg-fuchsia-600 border-fuchsia-300/40"
                  >
                    <Play className="h-4 w-4" />
                    השמע סקריפט
                  </GlassButton>
                ) : (
                  <GlassButton
                    onClick={stopSpeak}
                    className="bg-rose-600/80 hover:bg-rose-600 border-rose-300/40"
                  >
                    <Pause className="h-4 w-4" />
                    עצור
                  </GlassButton>
                )}

                <div className="ms-1 text-xs sm:text-sm opacity-80 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  קול:
                  <select
                    className="h-8 rounded-full px-3 bg-black/40 border border-white/20 text-xs sm:text-sm"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                  >
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} · {v.lang}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="ms-auto inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickAvatar}
                    className="hidden"
                  />
                  <span className="h-9 px-3 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    תמונת אווטאר
                  </span>
                </label>
              </div>

              <div
                onDrop={onDropAvatar}
                onDragOver={onDragOverAvatar}
                className="mt-2 text-xs opacity-70 border border-dashed border-white/20 rounded-xl px-3 py-2"
              >
                אפשר גם לגרור לכאן תמונה מהמחשב כדי להפוך אותה לאווטאר.
              </div>
            </GlassCard>

            {/* Avatar controls + script */}
            <GlassCard className="p-4 space-y-5">
              <div>
                <div className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  התאמה אישית של האווטאר
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs sm:text-sm opacity-80">סוג</span>
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value as AvatarKind)}
                      className="h-10 rounded-xl bg-black/40 border border-white/20 px-3 text-sm"
                    >
                      <option value="emoji">אימוג׳י</option>
                      <option value="blob">בלוב אנרגטי</option>
                      <option value="bot">רובוט</option>
                      <option value="photo">תמונה</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs sm:text-sm opacity-80">רגש</span>
                    <select
                      value={emotion}
                      onChange={(e) =>
                        setEmotion(e.target.value as AvatarEmotion)
                      }
                      className="h-10 rounded-xl bg-black/40 border border-white/20 px-3 text-sm"
                    >
                      <option value="happy">שמח/ה</option>
                      <option value="neutral">נייטרלי/ת</option>
                      <option value="sad">עצוב/ה</option>
                      <option value="excited">נרגש/ת</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs sm:text-sm opacity-80">צבע</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 rounded-xl bg-black/40 border border-white/20 px-2"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs sm:text-sm opacity-80">רקע</span>
                    <select
                      value={bg}
                      onChange={(e) => setBg(e.target.value as BgStyle)}
                      className="h-10 rounded-xl bg-black/40 border border-white/20 px-3 text-sm"
                    >
                      <option value="violet">סגול</option>
                      <option value="pink">ורוד</option>
                      <option value="indigo">אינדיגו</option>
                      <option value="teal">טיל</option>
                      <option value="none">כהה חלק</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs sm:text-sm opacity-80">תאורה</span>
                    <select
                      value={light}
                      onChange={(e) =>
                        setLight(e.target.value as "studio" | "warm" | "cool")
                      }
                      className="h-10 rounded-xl bg-black/40 border border-white/20 px-3 text-sm"
                    >
                      <option value="studio">סטודיו</option>
                      <option value="warm">חמה</option>
                      <option value="cool">קרירה</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs sm:text-sm opacity-80">סביבה</span>
                    <select
                      value={env}
                      onChange={(e) =>
                        setEnv(
                          e.target.value as
                            | "studio"
                            | "city"
                            | "sunset"
                            | "dawn"
                            | "night"
                            | "forest",
                        )
                      }
                      className="h-10 rounded-xl bg-black/40 border border-white/20 px-3 text-sm"
                    >
                      <option value="studio">סטודיו</option>
                      <option value="city">עיר</option>
                      <option value="sunset">שקיעה</option>
                      <option value="dawn">זריחה</option>
                      <option value="night">לילה</option>
                      <option value="forest">יער</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <div className="text-base sm:text-lg font-bold">
                  סקריפט היכרות
                </div>
                <p className="mt-1 text-xs sm:text-sm opacity-80">
                  ערוך/י את מה שהאווטאר אומר. נשמר אוטומטית בדפדפן.
                </p>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={7}
                  className="mt-3 w-full rounded-2xl bg-black/50 border border-white/20 p-3 text-sm leading-7"
                  placeholder="כתוב/י כאן טקסט היכרות קצר…"
                />
                <div className="mt-2 flex items-center gap-2 text-[11px] opacity-70">
                  <span>טיפ: 30–45 שניות זה מושלם לוידאו היכרות.</span>
                  <GlassButton
                    onClick={() => setScript("")}
                    className="h-8 px-3 text-[11px]"
                    title="נקה טקסט"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    נקה
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </section>
        )}

        {tab === "webcam" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr,0.9fr]">
            {/* Live camera */}
            <GlassCard className="p-3 sm:p-4">
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/12 bg-black/60 relative">
                <div className="relative w-full h-full">
                  <video
                    ref={liveVideoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${filterClass}`}
                  />
                  {!camOn && (
                    <div className="absolute inset-0 grid place-items-center text-sm sm:text-base opacity-60">
                      המצלמה כבויה · לחץ/י על "הפעל מצלמה"
                    </div>
                  )}

                  {videoFilter === "glasses" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl sm:text-7xl">🤓</span>
                    </div>
                  )}

                  {videoFilter === "mustache" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center translate-y-6 sm:translate-y-8">
                      <span className="text-6xl sm:text-7xl">😎</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <GlassButton
                  onClick={toggleLiveCam}
                  className="bg-violet-600/80 hover:bg-violet-600 border-violet-300/50"
                >
                  <VideoIcon className="h-4 w-4" />
                  {camOn ? "כיבוי מצלמה" : "הפעל מצלמה"}
                </GlassButton>

                <div className="text-xs sm:text-sm opacity-80">
                  * בשידור החי אין אודיו כדי למנוע פידבק. בסטורי יש הקלטת קול
                  מלאה.
                </div>
              </div>
            </GlassCard>

            {/* Filters & tips */}
            <GlassCard className="p-4 space-y-5">
              <div>
                <div className="text-base sm:text-lg font-bold">
                  פילטרים לוידאו
                </div>
                <p className="mt-1 text-xs sm:text-sm opacity-80">
                  בחר/י פילטר ויזואלי או אוברליי מצחיק למצלמה החיה.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm">
                  {[
                    { id: "none", label: "רגיל" },
                    { id: "bw", label: "שחור־לבן" },
                    { id: "warm", label: "חם" },
                    { id: "cool", label: "קר" },
                    { id: "blur", label: "טשטוש עדין" },
                    { id: "funky", label: "Funky" },
                    { id: "glasses", label: "משקפיים 🤓" },
                    { id: "mustache", label: "שפם 😁" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setVideoFilter(f.id as VideoFilter)}
                      className={[
                        "h-8 px-3 rounded-full border text-xs sm:text-sm",
                        videoFilter === f.id
                          ? "bg-fuchsia-500/80 border-fuchsia-200 text-white"
                          : "bg-black/40 border-white/30 hover:bg-black/60",
                      ].join(" ")}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-base sm:text-lg font-bold">
                  טיפים למצולם טוב
                </div>
                <ul className="mt-2 list-disc ps-5 text-xs sm:text-sm space-y-1 opacity-90">
                  <li>אור רך מלפנים (חלון/מנורה), לא מאחור.</li>
                  <li>המצלמה בגובה העיניים, לא מלמטה.</li>
                  <li>חיוך, מבט לעדשה, טקסט קצר וברור.</li>
                </ul>
              </div>
            </GlassCard>
          </section>
        )}

        {tab === "story" && (
          <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
            {/* Story recorder */}
            <GlassCard className="p-3 sm:p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-base sm:text-lg font-bold">
                    הקלטת סטורי אישי
                  </div>
                  <p className="text-xs sm:text-sm opacity-80">
                    וידאו קצר (15–30 שניות) שישב אצלך בפרופיל כמו סטורי
                    באפליקציות הגדולות.
                  </p>
                </div>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden border border-white/12 bg-black/70 relative">
                <video
                  ref={storyCamRef}
                  playsInline
                  muted={recState !== "idle"} // בזמן הקלטה שקט בלייב למניעת פידבק
                  className={`w-full h-full object-cover ${filterClass}`}
                />
                {recState === "idle" && !storyStreamRef.current && (
                  <div className="absolute inset-0 grid place-items-center text-sm sm:text-base opacity-70 px-4 text-center">
                    לחץ/י על "הפעל מצלמת סטורי" ואז "הקלט/י סטורי" כדי להתחיל.
                  </div>
                )}

                {videoFilter === "glasses" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl sm:text-7xl">🤓</span>
                  </div>
                )}

                {videoFilter === "mustache" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center translate-y-6 sm:translate-y-8">
                    <span className="text-6xl sm:text-7xl">😎</span>
                  </div>
                )}

                {recState === "rec" && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 text-xs sm:text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>מקליט/ה…</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <GlassButton
                  onClick={ensureStoryCam}
                  className="bg-violet-600/80 hover:bg-violet-600 border-violet-300/50"
                >
                  <VideoIcon className="h-4 w-4" />
                  הפעל מצלמת סטורי
                </GlassButton>

                <GlassButton
                  onClick={toggleRecord}
                  className={
                    recState === "rec"
                      ? "bg-rose-600/80 hover:bg-rose-600 border-rose-300/50"
                      : "bg-emerald-600/80 hover:bg-emerald-600 border-emerald-300/50"
                  }
                >
                  {recState === "rec" ? (
                    <>
                      <Pause className="h-4 w-4" />
                      עצור הקלטה
                    </>
                  ) : recState === "saving" ? (
                    <>
                      <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
                      שומר…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      הקלט/י סטורי
                    </>
                  )}
                </GlassButton>

                <div className="text-[11px] sm:text-xs opacity-75">
                  הטוב ביותר: 15–30 שניות, מבט לעדשה, משפט של היכרות.
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)] items-center">
                <input
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="כותרת לסטורי (לא חובה)…"
                  className="h-9 rounded-full bg-black/50 border border-white/20 px-3 text-xs sm:text-sm"
                />
                <div className="text-[11px] sm:text-xs opacity-70">
                  הכותרת תופיע מתחת לסרטון בפרופיל (אם תבחר/י להשתמש בה).
                </div>
              </div>

              {previewUrl && (
                <div className="mt-2">
                  <div className="text-xs sm:text-sm font-semibold mb-1 flex items-center gap-2">
                    תצוגה מוקדמת:
                  </div>
                  <video
                    src={previewUrl}
                    controls
                    className="w-full rounded-2xl border border-white/15 bg-black"
                  />
                </div>
              )}
            </GlassCard>

            {/* Story list */}
            <GlassCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base sm:text-lg font-bold">
                  הסטוריז שלי
                </div>
                <div className="text-xs opacity-70">
                  {stories.length
                    ? `${stories.length} סטוריז שמורים`
                    : "אין סטוריז שמורים עדיין"}
                </div>
              </div>

              {stories.length === 0 ? (
                <div className="flex-1 grid place-items-center text-xs sm:text-sm opacity-75 text-center px-4">
                  אחרי שתקליט/י סטורי הוא יופיע כאן וניתן יהיה למחוק אותו או
                  לצפות בו.
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pe-1">
                  {stories.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-white/15 bg-black/40 p-2 flex gap-3 items-center"
                    >
                      <video
                        src={s.url}
                        className="h-20 w-32 rounded-xl object-cover bg-black"
                        controls
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold truncate">
                          {s.title || "סטורי ללא כותרת"}
                        </div>
                        <div className="text-[11px] opacity-70 mt-0.5">
                          {new Date(s.createdAt).toLocaleString()} ·{" "}
                          {s.durationSec
                            ? `${Math.round(s.durationSec)} שניות`
                            : "משך לא ידוע"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteStory(s.id)}
                        className="h-8 w-8 rounded-full border border-white/25 bg-black/40 hover:bg-rose-600/70 hover:border-rose-200 grid place-items-center text-rose-100"
                        title="מחק סטורי"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] sm:text-xs opacity-70 mt-1">
                * בקוד הזה הסטוריז נשמרים לוקאלית (localStorage) ובאופן ניסיוני
                נשלחים גם ל־
                <code className="px-1 bg-white/10 rounded">
                  /api/date/video-story
                </code>{" "}
                אם קיים אצלך שרת מתאים.
              </div>
            </GlassCard>
          </section>
        )}
      </main>
    </div>
  );
}
