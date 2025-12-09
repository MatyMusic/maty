"use client";

/**
 * MATY-DATE · Video Page (Webcam + Talking Avatar) — PRO UX
 * ----------------------------------------------------------
 * - כותרת נקייה (מציג שם פרטי/תצוגה במקום userId מקודד)
 * - לשונית "אווטאר מדבר" + "מצלמה" (תצוגה עצמית)
 * - בונה סקריפט היכרות בעברית מתוך נתוני הנמען + שמירה מקומית
 * - דיבור בקול (SpeechSynthesis) עם onboundary לסנכרון “פה”
 * - פאנל בחירה עשיר לאווטאר: סוג/רגש/צבע/רקע/תאורה/סביבה
 * - תמיכה ב־Upload תמונה למצב "photo" (לוקאלי, בלי העלאה לשרת)
 */

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TalkingAvatar, {
  type AvatarKind,
  type AvatarEmotion,
} from "@/components/maty-date/TalkingAvatar";
import {
  Video as VideoIcon,
  MessageCircle,
  Mic,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  User2,
  Upload,
  Wand2,
} from "lucide-react";

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
  birthDate?: string | null; // YYYY-MM-DD
  gender?: "male" | "female" | "other" | null;
  judaism_direction?: Direction | null;
  goals?: "serious" | "marriage" | "friendship" | null;
  about_me?: string | null;
  subscription?: { status: SubStatus; tier: Tier } | null;
};

type ApiResp = { ok: true; profile: Profile } | { ok: false; error: string };

function yearsFromBirth(b?: string | null) {
  if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return "";
  const now = new Date();
  const y = now.getFullYear() - parseInt(b.slice(0, 4));
  const mday = b.slice(5);
  return (
    mday >
    `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`
      ? y - 1
      : y
  ).toString();
}

function Button({
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
        "border border-white/10 bg-white/10 hover:bg-white/15",
        "text-white backdrop-blur transition disabled:opacity-50",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function VideoClient() {
  const params = useSearchParams();
  const toRaw = params.get("to") || "";
  const toUserId = decodeURIComponent(toRaw); // שלא יוצג seed%3A...

  const [tab, setTab] = useState<"avatar" | "webcam">("avatar");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ----- Webcam preview (self) -----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camOn, setCamOn] = useState(false);

  // ----- Avatar state -----
  const [kind, setKind] = useState<AvatarKind>("emoji");
  const [emotion, setEmotion] = useState<AvatarEmotion>("happy");
  const [color, setColor] = useState("#8b5cf6");
  const [bg, setBg] = useState<"violet" | "pink" | "indigo" | "teal" | "none">(
    "violet"
  );
  const [light, setLight] = useState<"studio" | "warm" | "cool">("studio");
  const [env, setEnv] = useState<
    "studio" | "city" | "sunset" | "dawn" | "night" | "forest"
  >("studio");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // ----- Avatar Speech -----
  const [script, setScript] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voiceName, setVoiceName] = useState<string>("");
  const [viseme, setViseme] = useState(0); // 0..1 open

  // --- load profile for "to"
  useEffect(() => {
    if (!toUserId) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(
          `/api/date/profile/${encodeURIComponent(toUserId)}`,
          { cache: "no-store" }
        );
        const j: ApiResp = await r.json();
        if (!r.ok || !("ok" in j) || !j.ok) {
          throw new Error((j as any).error || `HTTP ${r.status}`);
        }
        setProfile(j.profile);
      } catch (e: any) {
        setErr(e?.message || "שגיאה בטעינת הפרופיל");
      } finally {
        setLoading(false);
      }
    })();
  }, [toUserId]);

  // --- build default script from profile + storage
  useEffect(() => {
    const saved = localStorage.getItem("matydate:video:script");
    if (saved) {
      setScript(saved);
      return;
    }
    const p = profile;
    const age = yearsFromBirth(p?.birthDate);
    const chunks: string[] = [];
    chunks.push(`היי! נעים מאוד, אני ${p?.displayName || "אורח/ת"}.`);
    if (age) chunks.push(`בן/בת ${age}.`);
    if (p?.judaism_direction)
      chunks.push(`בזרם ${dirHeb(p.judaism_direction)}.`);
    if (p?.city || p?.country)
      chunks.push(`גר/ה ב${[p.city, p.country].filter(Boolean).join(", ")}.`);
    if (p?.goals)
      chunks.push(
        `מחפש/ת ${
          p.goals === "serious"
            ? "קשר רציני"
            : p.goals === "marriage"
            ? "נישואין"
            : "חברות"
        }.`
      );
    chunks.push("אוהב/ת מוזיקה טובה, לטייל, ולהכיר אנשים איכותיים.");
    chunks.push("אם נראה לך מתאים — בוא/י נדבר 😊");
    setScript(chunks.join(" "));
  }, [profile]);

  // persist script + avatar selections
  useEffect(() => {
    try {
      localStorage.setItem("matydate:video:script", script || "");
      localStorage.setItem(
        "matydate:video:prefs",
        JSON.stringify({ kind, emotion, color, bg, light, env })
      );
    } catch {}
  }, [script, kind, emotion, color, bg, light, env]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("matydate:video:prefs");
      if (raw) {
        const p = JSON.parse(raw);
        setKind(p.kind || "emoji");
        setEmotion(p.emotion || "happy");
        setColor(p.color || "#8b5cf6");
        setBg(p.bg || "violet");
        setLight(p.light || "studio");
        setEnv(p.env || "studio");
      }
    } catch {}
  }, []);

  // Speech voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
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

  // --- speaking controls
  function speak() {
    if (!script.trim()) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(script);
      const v = voices.find((x) => x.name === voiceName);
      if (v) u.voice = v;
      u.lang = v?.lang || "he-IL";
      u.rate = 1;
      u.pitch = 1;
      // sync-ish mouth using boundary events
      u.onstart = () => {
        setSpeaking(true);
      };
      u.onboundary = () => {
        setViseme((x) => (x > 0.5 ? 0.1 : 1)); // סוויטש מהיר
      };
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
    try {
      window.speechSynthesis.cancel();
    } finally {
      setSpeaking(false);
      setViseme(0);
    }
  }

  // --- webcam
  async function toggleCam() {
    if (camOn) {
      const v = videoRef.current;
      const s = v?.srcObject as MediaStream | null;
      s?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch (e: any) {
      setErr(e?.message || "שגיאה בהפעלת מצלמה");
    }
  }

  // Upload image (for "photo" mode)
  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setKind("photo");
  }

  const headline =
    profile?.displayName ||
    (toUserId && !toUserId.startsWith("seed")
      ? toUserId
      : "וידאו / אווטאר מדבר");

  return (
    <div
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-[#0c0c12] to-[#0c0c12] text-white"
      style={{
        backgroundImage:
          "radial-gradient(1200px 400px at 50% -10%, rgba(136,84,208,.18), transparent), radial-gradient(800px 300px at 80% 10%, rgba(255,20,147,.10), transparent)",
      }}
    >
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-sm opacity-70">MATY-DATE · וידאו</div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2">
              {headline}
              <Sparkles className="h-6 w-6 text-fuchsia-400" />
            </h1>
            {loading ? (
              <div className="mt-1 text-xs opacity-70">טוען פרופיל…</div>
            ) : err ? (
              <div className="mt-1 text-xs text-rose-300">{err}</div>
            ) : profile ? (
              <div className="mt-1 text-xs opacity-80 flex items-center gap-2">
                <User2 className="h-4 w-4" />
                <span>
                  {[profile.displayName, profile.city, profile.country]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => (window.location.href = "/date/matches")}>
              <MessageCircle className="h-4 w-4" /> חזרה להתאמות
            </Button>
            <Button onClick={() => (window.location.href = "/date/chat")}>
              <VideoIcon className="h-4 w-4" /> לצ׳אט
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <section className="mt-6">
          <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10 backdrop-blur">
            <button
              className={`h-10 px-5 rounded-full ${
                tab === "avatar" ? "bg-white/15 font-semibold" : ""
              }`}
              onClick={() => setTab("avatar")}
            >
              אווטאר מדבר
            </button>
            <button
              className={`h-10 px-5 rounded-full ${
                tab === "webcam" ? "bg-white/15 font-semibold" : ""
              }`}
              onClick={() => setTab("webcam")}
            >
              מצלמה (תצוגה עצמית)
            </button>
          </div>
        </section>

        {/* Content */}
        {tab === "avatar" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr,1.1fr]">
            {/* Canvas + controls */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                <div className="aspect-video">
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
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!speaking ? (
                  <Button
                    onClick={speak}
                    className="bg-fuchsia-600/80 hover:bg-fuchsia-600"
                  >
                    <Play className="h-4 w-4" /> השמע סקריפט
                  </Button>
                ) : (
                  <Button
                    onClick={stopSpeak}
                    className="bg-rose-600/80 hover:bg-rose-600"
                  >
                    <Pause className="h-4 w-4" /> עצור
                  </Button>
                )}

                <div className="ms-2 text-sm opacity-80 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  קול:
                  <select
                    className="h-9 rounded-full px-3 bg-white/10 border border-white/15"
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

                <label className="ms-auto inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickImage}
                    className="hidden"
                  />
                  <span className="h-9 px-3 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    תמונת אווטאר
                  </span>
                </label>
              </div>
            </div>

            {/* Controls + Script editor */}
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur space-y-6">
              {/* Avatar Controls */}
              <div>
                <div className="text-lg font-bold flex items-center gap-2">
                  <Wand2 className="h-5 w-5" /> התאמה אישית של האווטאר
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {/* kind */}
                  <label className="grid gap-1">
                    <span className="text-sm opacity-80">סוג</span>
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value as AvatarKind)}
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-3"
                    >
                      <option value="emoji">אימוג'י</option>
                      <option value="blob">בלוב אנרגטי</option>
                      <option value="bot">רובוט</option>
                      <option value="photo">תמונה</option>
                    </select>
                  </label>

                  {/* emotion */}
                  <label className="grid gap-1">
                    <span className="text-sm opacity-80">רגש</span>
                    <select
                      value={emotion}
                      onChange={(e) =>
                        setEmotion(e.target.value as AvatarEmotion)
                      }
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-3"
                    >
                      <option value="happy">שמח/ה</option>
                      <option value="neutral">נייטרלי/ת</option>
                      <option value="sad">עצוב/ה</option>
                      <option value="excited">נרגש/ת</option>
                    </select>
                  </label>

                  {/* color */}
                  <label className="grid gap-1">
                    <span className="text-sm opacity-80">צבע</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-2"
                    />
                  </label>

                  {/* bg */}
                  <label className="grid gap-1">
                    <span className="text-sm opacity-80">רקע</span>
                    <select
                      value={bg}
                      onChange={(e) => setBg(e.target.value as any)}
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-3"
                    >
                      <option value="violet">סגול</option>
                      <option value="pink">ורוד</option>
                      <option value="indigo">אינדיגו</option>
                      <option value="teal">טיל</option>
                      <option value="none">כהה חלק</option>
                    </select>
                  </label>

                  {/* light */}
                  <label className="grid gap-1">
                    <span className="text-sm opacity-80">תאורה</span>
                    <select
                      value={light}
                      onChange={(e) => setLight(e.target.value as any)}
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-3"
                    >
                      <option value="studio">סטודיו</option>
                      <option value="warm">חם</option>
                      <option value="cool">קריר</option>
                    </select>
                  </label>

                  {/* env */}
                  <label className="grid gap-1">
                    <span className="text-sm opacity-80">סביבה</span>
                    <select
                      value={env}
                      onChange={(e) => setEnv(e.target.value as any)}
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-3"
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

              {/* Script Editor */}
              <div>
                <div className="text-lg font-bold">סקריפט הודעת היכרות</div>
                <p className="mt-1 text-sm opacity-80">
                  ערוך/י את הטקסט — האווטאר יקרא אותו בעברית (TTS דפדפן).
                </p>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={10}
                  className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 p-3 leading-7"
                  placeholder="כתוב/כתבי כאן את מה שתרצה/י שהאווטאר יאמר…"
                />
                <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                  <span>טיפ: נשמר אוטומטית בדפדפן.</span>
                  <Button
                    onClick={() => setScript("")}
                    title="נקה"
                    className="h-8 px-3"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> נקה
                  </Button>
                </div>
              </div>
            </aside>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
            {/* Webcam preview */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 grid place-items-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!camOn && (
                  <div className="absolute text-sm opacity-60">
                    המצלמה כבויה
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Button
                  onClick={toggleCam}
                  className="bg-violet-600/80 hover:bg-violet-600"
                >
                  <VideoIcon className="h-4 w-4" />
                  {camOn ? "כיבוי מצלמה" : "הפעל מצלמה"}
                </Button>
              </div>
            </div>

            {/* Helper box */}
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="text-lg font-bold">טיפים לצילום</div>
              <ul className="mt-2 list-disc ps-5 text-sm space-y-1 opacity-90">
                <li>אור רך מלפנים (חלון/מנורה), רקע נקי.</li>
                <li>דבר/י ברור וקצר — 30–45 שניות.</li>
                <li>חייך/חי! :) זה משדר ביטחון וחיוביות.</li>
              </ul>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
