// src/components/maty-date/ProfileEditor.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ProfileProgress from "./ProfileProgress";
import { computeProfileCompleteness } from "@/lib/date/completeness";

type Level = "strict" | "partial" | "none";
type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

function safeJson(res: Response) {
  return res.text().then((t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  });
}

const DIR_LABEL: Record<Direction, string> = {
  orthodox: "אורתודוקסי",
  haredi: "חרדי",
  chasidic: "חסידי",
  modern: "אורתודוקסי מודרני",
  conservative: "קונסרבטיבי",
  reform: "רפורמי",
  reconstructionist: "רקונסטרוקטיבי",
  secular: "חילוני/תרבותי",
};
const LVL_LABEL: Record<Level, string> = {
  strict: "מחמיר/ה",
  partial: "חלקית",
  none: "לא",
};

export default function ProfileEditor() {
  const router = useRouter();

  // שדות
  const [displayName, setDisplayName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [gender, setGender] = React.useState<"male" | "female" | "other" | "">(
    ""
  );
  const [country, setCountry] = React.useState("");
  const [city, setCity] = React.useState("");
  const [languages, setLanguages] = React.useState<string>(""); // comma list
  const [judaism_direction, setDir] = React.useState<Direction | "">("");
  const [kashrut_level, setKashrut] = React.useState<Level | "">("");
  const [shabbat_level, setShabbat] = React.useState<Level | "">("");
  const [goals, setGoals] = React.useState<
    "serious" | "marriage" | "friendship" | ""
  >("");
  const [about_me, setAbout] = React.useState("");

  // מצבים
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [toast, setToast] = React.useState<{
    open: boolean;
    kind: "ok" | "err";
    msg: string;
  }>({ open: false, kind: "ok", msg: "" });

  // שליפה ראשונית
  React.useEffect(() => {
    (async () => {
      const r = await fetch("/api/date/profile", { cache: "no-store" });
      const j = await safeJson(r);
      if (r.ok && j?.ok) {
        const p = j.profile || {};
        setDisplayName(p.displayName || "");
        setBirthDate(p.birthDate || "");
        setGender(p.gender || "");
        setCountry(p.country || "");
        setCity(p.city || "");
        setLanguages((p.languages || []).join(", "));
        setDir(p.judaism_direction || "");
        setKashrut(p.kashrut_level || "");
        setShabbat(p.shabbat_level || "");
        setGoals(p.goals || "");
        setAbout(p.about_me || "");
      }
      setLoading(false);
    })();
  }, []);

  // ולידציות (inline)
  const langsArr = React.useMemo(
    () =>
      languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [languages]
  );

  const profileObject = React.useMemo(
    () => ({
      displayName,
      birthDate,
      gender: gender || null,
      country,
      city,
      languages: langsArr,
      judaism_direction: (judaism_direction || null) as any,
      kashrut_level: (kashrut_level || null) as any,
      shabbat_level: (shabbat_level || null) as any,
      goals: (goals || null) as any,
      about_me,
    }),
    [
      displayName,
      birthDate,
      gender,
      country,
      city,
      langsArr,
      judaism_direction,
      kashrut_level,
      shabbat_level,
      goals,
      about_me,
    ]
  );

  const { percent, missingLabels } = React.useMemo(
    () => computeProfileCompleteness(profileObject),
    [profileObject]
  );

  const must = {
    displayName: !displayName.trim(),
    birthDate: !(birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)),
    gender: !gender,
    country: !country.trim(),
    city: !city.trim(),
    languages: langsArr.length === 0,
    judaism_direction: !judaism_direction,
    kashrut_level: !kashrut_level,
    shabbat_level: !shabbat_level,
    goals: !goals,
  };

  const showErr = (k: keyof typeof must) => must[k] && touched[k as string];

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    // מסמן הכל כ־touched אם יש שדות חסרים
    if (Object.values(must).some(Boolean)) {
      const all: Record<string, boolean> = {};
      Object.keys(must).forEach((k) => (all[k] = true));
      setTouched((t) => ({ ...t, ...all }));
    }

    setSaving(true);
    try {
      const payload = {
        ...profileObject,
      };
      const r = await fetch("/api/date/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await safeJson(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      setToast({
        open: true,
        kind: "ok",
        msg: percent >= 60 ? "נשמר! מעביר להתאמות…" : "נשמר בהצלחה ✓",
      });

      // אם הושלם יפה — מעבירים אוטומטית להתאמות
      if (percent >= 60) {
        setTimeout(() => router.push("/maty-date"), 900);
      }
    } catch (err: any) {
      setToast({
        open: true,
        kind: "err",
        msg: err?.message || "שגיאה בשמירה",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-center">טוען…</div>;

  return (
    <form onSubmit={save} dir="rtl" className="space-y-6">
      {/* טוסט */}
      {toast.open && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 -translate-x-1/2 z-[4000] rounded-xl px-4 py-2 text-sm shadow-lg border ${
            toast.kind === "ok"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-rose-600 text-white border-rose-500"
          }`}
          onAnimationEnd={() =>
            setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200)
          }
        >
          {toast.msg}
        </div>
      )}

      {/* התקדמות */}
      <ProfileProgress percent={percent} missing={missingLabels} minOK={60} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* שם */}
        <label className="grid gap-1">
          <span className="text-sm">שם מלא</span>
          <input
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("displayName") ? "border-rose-400" : ""
            }`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
            placeholder="למשל: מתן כהן"
          />
          {showErr("displayName") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* DOB */}
        <label className="grid gap-1">
          <span className="text-sm">תאריך לידה</span>
          <input
            type="date"
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("birthDate") ? "border-rose-400" : ""
            }`}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, birthDate: true }))}
          />
          {showErr("birthDate") && (
            <p className="text-xs text-rose-600">פורמט לא תקין (YYYY-MM-DD)</p>
          )}
        </label>

        {/* gender */}
        <label className="grid gap-1">
          <span className="text-sm">מין</span>
          <select
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("gender") ? "border-rose-400" : ""
            }`}
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            onBlur={() => setTouched((t) => ({ ...t, gender: true }))}
          >
            <option value="">—</option>
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
            <option value="other">אחר</option>
          </select>
          {showErr("gender") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* country */}
        <label className="grid gap-1">
          <span className="text-sm">מדינה</span>
          <input
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("country") ? "border-rose-400" : ""
            }`}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, country: true }))}
            placeholder="ישראל"
          />
          {showErr("country") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* city */}
        <label className="grid gap-1">
          <span className="text-sm">עיר</span>
          <input
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("city") ? "border-rose-400" : ""
            }`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
            placeholder="ירושלים"
          />
          {showErr("city") && <p className="text-xs text-rose-600">שדה חובה</p>}
        </label>

        {/* languages */}
        <label className="grid gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-sm">שפות (מופרד בפסיקים)</span>
          <input
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("languages") ? "border-rose-400" : ""
            }`}
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, languages: true }))}
            placeholder="עברית, אנגלית"
          />
          {showErr("languages") && (
            <p className="text-xs text-rose-600">יש להזין לפחות שפה אחת</p>
          )}
        </label>

        {/* direction */}
        <label className="grid gap-1">
          <span className="text-sm">זרם ביהדות</span>
          <select
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("judaism_direction") ? "border-rose-400" : ""
            }`}
            value={judaism_direction}
            onChange={(e) => setDir(e.target.value as any)}
            onBlur={() =>
              setTouched((t) => ({ ...t, judaism_direction: true }))
            }
          >
            <option value="">—</option>
            {Object.keys(DIR_LABEL).map((k) => (
              <option key={k} value={k}>
                {DIR_LABEL[k as Direction]}
              </option>
            ))}
          </select>
          {showErr("judaism_direction") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* kashrut */}
        <label className="grid gap-1">
          <span className="text-sm">כשרות</span>
          <select
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("kashrut_level") ? "border-rose-400" : ""
            }`}
            value={kashrut_level}
            onChange={(e) => setKashrut(e.target.value as any)}
            onBlur={() => setTouched((t) => ({ ...t, kashrut_level: true }))}
          >
            <option value="">—</option>
            <option value="strict">{LVL_LABEL.strict}</option>
            <option value="partial">{LVL_LABEL.partial}</option>
            <option value="none">{LVL_LABEL.none}</option>
          </select>
          {showErr("kashrut_level") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* shabbat */}
        <label className="grid gap-1">
          <span className="text-sm">שמירת שבת</span>
          <select
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("shabbat_level") ? "border-rose-400" : ""
            }`}
            value={shabbat_level}
            onChange={(e) => setShabbat(e.target.value as any)}
            onBlur={() => setTouched((t) => ({ ...t, shabbat_level: true }))}
          >
            <option value="">—</option>
            <option value="strict">{LVL_LABEL.strict}</option>
            <option value="partial">{LVL_LABEL.partial}</option>
            <option value="none">{LVL_LABEL.none}</option>
          </select>
          {showErr("shabbat_level") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* goals */}
        <label className="grid gap-1">
          <span className="text-sm">מטרה</span>
          <select
            className={`h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90 ${
              showErr("goals") ? "border-rose-400" : ""
            }`}
            value={goals}
            onChange={(e) => setGoals(e.target.value as any)}
            onBlur={() => setTouched((t) => ({ ...t, goals: true }))}
          >
            <option value="">—</option>
            <option value="serious">קשר רציני</option>
            <option value="marriage">נישואין</option>
            <option value="friendship">חברות</option>
          </select>
          {showErr("goals") && (
            <p className="text-xs text-rose-600">שדה חובה</p>
          )}
        </label>

        {/* about */}
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">על עצמי</span>
          <textarea
            rows={4}
            className="rounded-xl border px-3 py-2 bg-white/90 dark:bg-neutral-900/90"
            value={about_me}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="כמה מילים על עצמך (מומלץ 40+ תווים)"
          />
          <div className="text-xs opacity-70 text-left">
            {about_me.length} תווים
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm opacity-70">
          {percent >= 60
            ? "מוכן/ה לצאת לדרך"
            : "השלים/י את השדות החסרים כדי לפתוח התאמות"}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
          >
            {saving ? "שומר…" : "שמור"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/maty-date")}
            disabled={percent < 60}
            className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50"
            title={percent < 60 ? "נפתח לאחר 60% השלמה" : "לרשימת התאמות"}
          >
            המשך להתאמות
          </button>
        </div>
      </div>
    </form>
  );
}
