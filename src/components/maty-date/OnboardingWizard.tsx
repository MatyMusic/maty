// src/components/maty-date/OnboardingWizard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DateProfileForm from "@/components/maty-date/DateProfileForm";
import PreferencesForm from "@/components/maty-date/PreferencesForm";
import PhotoUploader from "@/components/maty-date/PhotoUploader";

type Level = "strict" | "partial" | "none";
type Gender = "male" | "female" | "other";
type Goal = "serious" | "marriage" | "friendship";

type Profile = {
  userId?: string;
  email?: string | null;
  displayName?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  gender?: Gender | null;
  country?: string | null;
  city?: string | null;
  judaism_direction?: string | null;
  kashrut_level?: Level | null;
  shabbat_level?: Level | null;
  goals?: Goal | null;
  about_me?: string | null;
  photos?: string[];
  avatarUrl?: string | null;
};

type Prefs = Record<string, any>;

type Step = 0 | 1 | 2 | 3; // 0=פרטים, 1=העדפות, 2=תמונות, 3=התאמות
const STEP_TITLES = ["פרטים", "העדפות", "תמונות", "התאמות"] as const;

/* ===== היגיון השלמה ===== */
function hasCoreProfile(p?: Profile | null) {
  if (!p) return false;
  if (!p.displayName) return false;
  if (!p.gender) return false;
  if (!p.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate)) return false;
  if (!p.country || !p.city) return false;
  return true;
}
function hasPrefs(pref?: Prefs | null) {
  if (!pref) return false;
  return Object.keys(pref).length > 0;
}
function hasPhotos(p?: Profile | null) {
  if (!p) return false;
  return (p.photos && p.photos.length > 0) || !!p.avatarUrl;
}

function maxAllowedStep(p?: Profile | null, pref?: Prefs | null): Step {
  if (!hasCoreProfile(p)) return 0;
  if (!hasPrefs(pref)) return 1;
  if (!hasPhotos(p)) return 2;
  return 3;
}
function earliestIncomplete(p?: Profile | null, pref?: Prefs | null): Step {
  if (!hasCoreProfile(p)) return 0;
  if (!hasPrefs(pref)) return 1;
  if (!hasPhotos(p)) return 2;
  return 3;
}

export default function OnboardingWizard({
  initialProfile,
  initialPreferences,
  userId,
}: {
  initialProfile: Profile | null;
  initialPreferences: Prefs | null;
  userId?: string | null;
}) {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [prefs, setPrefs] = useState<Prefs | null>(initialPreferences);

  // תמיד לא לפתוח אוטומטית שלב "התאמות"
  const CAP_MAX_OPEN_ON_LOAD: Step = 2;

  // מפתח LS לפי משתמש
  const lsKey = useMemo(
    () => `mm_date_wizard_step:${userId || "anon"}`,
    [userId]
  );

  const [step, setStep] = useState<Step>(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    let saved: Step | null = null;
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(lsKey) : null;
      const n = raw != null ? Number(raw) : NaN;
      saved = Number.isFinite(n) && n >= 0 && n <= 3 ? (n as Step) : null;
    } catch {}

    const allowed = maxAllowedStep(profile, prefs);
    const baseStart =
      saved == null ? earliestIncomplete(profile, prefs) : Math.min(saved, allowed);
    // לא מתחילים אוטומטית בשלב 3
    const start = Math.min(baseStart, CAP_MAX_OPEN_ON_LOAD) as Step;

    setStep(start);

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // שמירת צעד ב־LS
  useEffect(() => {
    if (!mountedRef.current) return;
    try {
      localStorage.setItem(lsKey, String(step));
    } catch {}
  }, [lsKey, step]);

  // אם הנתונים עודכנו והצעד חורג – קבע לצעד המותר (וגם אל תאפשר לעבור אוטומטית ל־3)
  useEffect(() => {
    if (!mountedRef.current) return;
    const allowed = Math.min(maxAllowedStep(profile, prefs), CAP_MAX_OPEN_ON_LOAD) as Step;
    if (step > allowed) setStep(allowed);
  }, [profile, prefs, step]);

  function goNext() {
    setStep((s) => Math.min((s + 1) as Step, 3));
  }
  function goPrev() {
    setStep((s) => Math.max((s - 1) as Step, 0));
  }
  function finish() {
    router.push("/maty-date/matches");
  }

  function Stepper() {
    return (
      <div className="flex items-center justify-center gap-2 text-sm my-3">
        {STEP_TITLES.map((t, i) => {
          const active = i === step;
          return (
            <div
              key={t}
              className={[
                "px-3 h-9 rounded-full border flex items-center gap-2",
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                  : "bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10",
              ].join(" ")}
            >
              <span className="font-semibold">{t}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="container-section section-padding" dir="rtl">
      <Stepper />

      <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4 md:p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold">פרטים אישיים</h2>

            {/* גרסת הטופס שלך טוענת ושומרת לבד מול /api/date/profile */}
            <DateProfileForm />

            <div className="flex justify-between mt-3">
              <span />
              <button className="mm-btn mm-btn-primary" onClick={goNext}>
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold">העדפות התאמה</h2>
            <PreferencesForm
              initialPreferences={prefs || {}}
              onChange={(v: Prefs) =>
                setPrefs((old) => ({ ...(old || {}), ...v }))
              }
              onSaved={(v: Prefs) =>
                setPrefs((old) => ({ ...(old || {}), ...v }))
              }
            />
            <div className="flex justify-between mt-3">
              <button className="mm-btn" onClick={goPrev}>
                חזרה
              </button>
              <button className="mm-btn mm-btn-primary" onClick={goNext}>
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold">תמונות</h2>
            <PhotoUploader
              initialPhotos={profile?.photos || []}
              onChange={(arr: string[]) =>
                setProfile((old) => ({ ...(old || {}), photos: arr }))
              }
              onSaved={(arr: string[]) =>
                setProfile((old) => ({ ...(old || {}), photos: arr }))
              }
            />
            <div className="flex justify-between mt-3">
              <button className="mm-btn" onClick={goPrev}>
                חזרה
              </button>
              <button className="mm-btn mm-btn-primary" onClick={goNext}>
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold">מוכנים להתחיל התאמות?</h2>
            <p className="opacity-80">תמיד אפשר לחזור ולעדכן פרטים/העדפות.</p>
            <div className="flex justify-between mt-3">
              <button className="mm-btn" onClick={goPrev}>
                חזרה
              </button>
              <button className="mm-btn mm-btn-primary" onClick={finish}>
                להתחיל התאמות
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
