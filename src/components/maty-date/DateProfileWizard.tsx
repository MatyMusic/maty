// src/app/(date)/date/profile/wizard/page.tsx  ← עדכן לנתיב שלך
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import ProfileProgress from "@/components/maty-date/ProfileProgress";
import {
  computeProfileProgress,
  type ProfilePatch,
} from "@/components/maty-date/useProfileProgress";

/* ================= helpers ================= */
async function safeJson(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
const DRAFT_KEY = "maty-date:profile-draft";

/** טיוטה בלוקאל־סטורג׳ עם שחזור/שמירה */
function useDraftState(initial: ProfilePatch) {
  const [form, setForm] = React.useState<ProfilePatch>(initial);

  // שחזור טיוטה – ריצה חד-פעמית
  const didLoadDraft = React.useRef(false);
  React.useEffect(() => {
    if (didLoadDraft.current) return;
    didLoadDraft.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<ProfilePatch>;
      setForm((p) => ({ ...p, ...draft }));
    } catch {}
  }, []);

  // שמירת טיוטה (דבילט)
  React.useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  return [form, setForm] as const;
}

/* ================= component ================= */
export default function DateProfileWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState<0 | 1 | 2 | 3>(0); // 0..2 טפסים, 3 סיום
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{
    open: boolean;
    type: "success" | "error" | "info";
    text: string;
  }>({ open: false, type: "success", text: "" });

  const [form, setForm] = useDraftState({
    displayName: null,
    birthDate: null,
    gender: null,
    country: null,
    city: null,
    languages: [],
    judaism_direction: null,
    kashrut_level: null,
    shabbat_level: null,
    goals: null,
    about_me: null,
    avatarUrl: null,
  });

  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const { percent, missing } = computeProfileProgress(form);
  const minOK = 60;

  /* ====== טעינה ראשונית מהשרת (guard נגד StrictMode) ====== */
  const didInit = React.useRef(false);
  React.useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      const r = await fetch("/api/date/profile", { cache: "no-store" });
      const j = await safeJson(r);
      if (j?.ok && j.profile) {
        const p = j.profile as Partial<ProfilePatch>;
        setForm((prev) => ({ ...prev, ...p }));
      } else if (r.status === 401) {
        window.location.href = "/auth?mode=login";
        return;
      }
      setLoading(false);
    })();
  }, [setForm]);

  /* ====== ולידציות לכל שלב ====== */
  const validStep0 =
    !!form.displayName?.trim() &&
    !!form.birthDate?.trim() &&
    !!form.gender &&
    !!form.country?.trim() &&
    !!form.city?.trim() &&
    Array.isArray(form.languages) &&
    form.languages.length > 0;

  const validStep1 =
    !!form.judaism_direction &&
    !!form.kashrut_level &&
    !!form.shabbat_level &&
    !!form.goals;

  const validStep2 =
    typeof form.about_me === "string" && form.about_me.trim().length >= 20;

  const stepOK = [validStep0, validStep1, validStep2][step] ?? true;

  function set<K extends keyof ProfilePatch>(k: K, v: ProfilePatch[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/user/avatar", { method: "POST", body: fd });
    const j = await safeJson(r);
    if (r.ok && j?.ok && j.url) {
      set("avatarUrl", String(j.url));
      setToast({ open: true, type: "success", text: "התמונה עלתה ✓" });
    } else {
      throw new Error(j?.error || `upload ${r.status}`);
    }
  }

  async function saveAndNext() {
    if (saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/date/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await safeJson(r);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      setToast({ open: true, type: "success", text: "נשמר בהצלחה ✅" });

      if (step < 2) {
        setStep((s) => (s + 1) as any);
      } else {
        // סוף תהליך
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setStep(3);
        if (percent >= minOK) {
          // ודא שהנתיב עקבי אצלך: "/maty-date/matches" או "/date/matches"
          setTimeout(() => router.push("/maty-date/matches"), 1200);
        }
      }
    } catch (e: any) {
      setToast({
        open: true,
        type: "error",
        text: e?.message || "שגיאת שמירה",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-center">טוען…</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <Toast
        open={toast.open}
        type={toast.type}
        text={toast.text}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {step !== 3 && (
        <ProfileProgress percent={percent} missing={missing} minOK={minOK} />
      )}

      {/* ניווט צעדים */}
      {step !== 3 && (
        <div className="flex items-center justify-center gap-2">
          {["פרטים", "אורח חיים", "על עצמי"].map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => setStep(i as any)}
              className={[
                "px-3 py-1.5 rounded-full text-sm border transition",
                step === i
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                  : "bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* STEP 0: פרטים */}
      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm">שם תצוגה</span>
            <input
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.displayName ?? ""}
              onChange={(e) => set("displayName", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
            />
            {touched.displayName && !(form.displayName || "").trim() && (
              <div className="text-xs text-rose-600 mt-1">שדה זה נדרש</div>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm">תאריך לידה</span>
            <input
              type="date"
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.birthDate ?? ""}
              onChange={(e) => set("birthDate", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, birthDate: true }))}
            />
            {touched.birthDate && !form.birthDate && (
              <div className="text-xs text-rose-600 mt-1">שדה זה נדרש</div>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm">מין</span>
            <select
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.gender ?? ""}
              onChange={(e) => set("gender", (e.target.value || null) as any)}
              onBlur={() => setTouched((t) => ({ ...t, gender: true }))}
            >
              <option value="">—</option>
              <option value="male">זכר</option>
              <option value="female">נקבה</option>
              <option value="other">אחר</option>
            </select>
            {touched.gender && !form.gender && (
              <div className="text-xs text-rose-600 mt-1">שדה זה נדרש</div>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm">מדינה</span>
            <input
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.country ?? ""}
              onChange={(e) => set("country", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, country: true }))}
            />
            {touched.country && !(form.country || "").trim() && (
              <div className="text-xs text-rose-600 mt-1">שדה זה נדרש</div>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm">עיר</span>
            <input
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, city: true }))}
            />
            {touched.city && !(form.city || "").trim() && (
              <div className="text-xs text-rose-600 mt-1">שדה זה נדרש</div>
            )}
          </label>

          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm">שפות (מופרד בפסיקים)</span>
            <input
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              placeholder="עברית, אנגלית…"
              value={(form.languages ?? []).join(", ")}
              onChange={(e) =>
                set(
                  "languages",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              onBlur={() => setTouched((t) => ({ ...t, languages: true }))}
            />
            {touched.languages &&
              (!Array.isArray(form.languages) ||
                form.languages.length === 0) && (
                <div className="text-xs text-rose-600 mt-1">
                  נא להוסיף לפחות שפה אחת
                </div>
              )}
          </label>
        </div>
      )}

      {/* STEP 1: אורח חיים */}
      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm">זרם ביהדות</span>
            <select
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.judaism_direction ?? ""}
              onChange={(e) =>
                set("judaism_direction", (e.target.value || null) as any)
              }
              onBlur={() =>
                setTouched((t) => ({ ...t, judaism_direction: true }))
              }
            >
              <option value="">—</option>
              <option value="orthodox">אורתודוקסי</option>
              <option value="haredi">חרדי</option>
              <option value="chasidic">חסידי</option>
              <option value="modern">אורתודוקסי מודרני</option>
              <option value="conservative">קונסרבטיבי</option>
              <option value="reform">רפורמי</option>
              <option value="reconstructionist">רקונסטרוקטיבי</option>
              <option value="secular">חילוני/תרבותי</option>
            </select>
          </label>

          {(["kashrut_level", "shabbat_level"] as const).map((k) => (
            <label key={k} className="grid gap-1">
              <span className="text-sm">
                {k === "kashrut_level" ? "כשרות" : "שבת"}
              </span>
              <select
                className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
                value={(form as any)[k] ?? ""}
                onChange={(e) => set(k, (e.target.value || null) as any)}
                onBlur={() => setTouched((t) => ({ ...t, [k]: true }))}
              >
                <option value="">—</option>
                <option value="strict">מחמיר/ה</option>
                <option value="partial">בינוני/ת</option>
                <option value="none">לא שומר/ת</option>
              </select>
            </label>
          ))}

          <label className="grid gap-1">
            <span className="text-sm">מטרה</span>
            <select
              className="h-10 rounded-xl border px-3 bg-white/90 dark:bg-neutral-900/90"
              value={form.goals ?? ""}
              onChange={(e) => set("goals", (e.target.value || null) as any)}
              onBlur={() => setTouched((t) => ({ ...t, goals: true }))}
            >
              <option value="">—</option>
              <option value="serious">קשר רציני</option>
              <option value="marriage">נישואין</option>
              <option value="friendship">חברות</option>
            </select>
          </label>
        </div>
      )}

      {/* STEP 2: על עצמי + תמונה */}
      {step === 2 && (
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm">על עצמי</span>
            <textarea
              className="min-h-[110px] rounded-xl border px-3 py-2 bg-white/90 dark:bg-neutral-900/90"
              placeholder="כמה מילים שיעזרו להכיר… (לפחות 20 תווים)"
              value={form.about_me ?? ""}
              onChange={(e) => set("about_me", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, about_me: true }))}
            />
            {touched.about_me && !validStep2 && (
              <div className="text-xs text-rose-600 mt-1">לפחות 20 תווים</div>
            )}
          </label>

          <div className="grid gap-2">
            <div className="text-sm font-medium">תמונת פרופיל (אופציונלי)</div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    setToast({
                      open: true,
                      type: "error",
                      text: "הקובץ גדול מ־2MB",
                    });
                    return;
                  }
                  try {
                    await uploadAvatar(f);
                  } catch {
                    setToast({
                      open: true,
                      type: "error",
                      text: "העלאה נכשלה",
                    });
                  }
                }}
              />
              {form.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full border object-cover"
                />
              )}
            </div>
            <div className="text-xs opacity-70">
              אפשר גם לעדכן תמונה בדף{" "}
              <a className="underline" href="/profile" target="_blank">
                הפרופיל
              </a>
              .
            </div>
          </div>
        </div>
      )}

      {/* כפתורים */}
      {step !== 3 && (
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          {step > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white"
              onClick={() => setStep((s) => (s - 1) as any)}
            >
              חזרה
            </button>
          )}
          <button
            type="button"
            disabled={!stepOK || saving}
            onClick={saveAndNext}
            className={[
              "inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold",
              stepOK
                ? "bg-pink-600 text-white hover:bg-pink-700"
                : "bg-neutral-400/40 text-neutral-700 cursor-not-allowed",
            ].join(" ")}
            title={stepOK ? "" : "יש להשלים את השדות בשלב זה"}
          >
            {saving ? "שומר…" : step < 2 ? "שמור והמשך" : "סיום"}
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {step === 3 && (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-6 text-center">
          <div className="text-3xl font-extrabold">!סיימנו יפה</div>
          <div className="mt-2 opacity-80">
            הפרופיל נשמר.{" "}
            {percent >= minOK
              ? "עוברים להתאמות…"
              : "תוכל/י להשלים עוד מעט ולקבל הצעות טובות יותר."}
          </div>
          <div className="mt-4 flex items-center justify-center">
            <ProfileProgress percent={percent} missing={[]} minOK={minOK} />
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <a
              href="/maty-date/matches" // ← ודא שזה הנתיב שבו אתה משתמש
              className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
            >
              לראות התאמות עכשיו
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white"
            >
              חזרה לדף הבית
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
