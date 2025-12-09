// // src/app/(date)/date/page.tsx
// "use client";

// import Link from "next/link";
// import { useEffect, useMemo, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// // שים לב: אין export const metadata כאן!

// function StatusRow({
//   ok,
//   textOk,
//   textWait,
// }: {
//   ok: boolean;
//   textOk: string;
//   textWait: string;
// }) {
//   return (
//     <div className="mt-1 flex items-center gap-2 text-[12px]">
//       {ok ? (
//         <>
//           <CheckCircle2 className="h-4 w-4 text-emerald-600" />
//           <span className="text-emerald-600">{textOk}</span>
//         </>
//       ) : (
//         <>
//           <AlertCircle className="h-4 w-4 text-red-600" />
//           <span className="text-red-600">{textWait}</span>
//         </>
//       )}
//     </div>
//   );
// }

// export default function DateGatePage() {
//   const sp = useSearchParams();
//   const router = useRouter();
//   const { status } = useSession();

//   const nextTarget = sp.get("next") || "/date/profile";

//   const [consentLoading, setConsentLoading] = useState(true);
//   const [hasConsent, setHasConsent] = useState(false);

//   const [profileDone, setProfileDone] = useState(false);
//   const [prefsDone, setPrefsDone] = useState(false);
//   const [videoDone, setVideoDone] = useState(false);

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         const r = await fetch("/api/legal/consent/status", {
//           cache: "no-store",
//         });
//         const j = await r.json().catch(() => ({}));
//         if (!alive) return;
//         setHasConsent(!!j?.has || false);
//       } catch {
//         if (!alive) return;
//         setHasConsent(false);
//       } finally {
//         if (alive) setConsentLoading(false);
//       }
//     })();
//     return () => {
//       alive = false;
//     };
//   }, []);

//   useEffect(() => {
//     try {
//       setProfileDone(localStorage.getItem("date:profileDone") === "1");
//       setPrefsDone(localStorage.getItem("date:prefsDone") === "1");
//       setVideoDone(localStorage.getItem("date:videoDone") === "1");
//     } catch {}
//   }, []);

//   useEffect(() => {
//     const onStorage = (e: StorageEvent) => {
//       if (e.key === "date:profileDone") setProfileDone(e.newValue === "1");
//       if (e.key === "date:prefsDone") setPrefsDone(e.newValue === "1");
//       if (e.key === "date:videoDone") setVideoDone(e.newValue === "1");
//     };
//     window.addEventListener("storage", onStorage);
//     return () => window.removeEventListener("storage", onStorage);
//   }, []);

//   const authed = status === "authenticated";
//   const mandatoryOk = hasConsent && authed;

//   async function approveConsent() {
//     setConsentLoading(true);
//     try {
//       const r = await fetch("/api/legal/consent", { method: "POST" });
//       const j = await r.json().catch(() => ({}));
//       if (j?.ok) setHasConsent(true);
//     } finally {
//       setConsentLoading(false);
//     }
//   }

//   function goAuth() {
//     const from = `/date?next=${encodeURIComponent(nextTarget)}`;
//     router.push(`/auth?mode=register&from=${encodeURIComponent(from)}`);
//   }

//   function continueToNext() {
//     if (!mandatoryOk) return;
//     router.push(nextTarget);
//   }

//   return (
//     <main
//       dir="rtl"
//       className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
//     >
//       <section className="mx-auto max-w-3xl mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-6 md:p-8 shadow-sm text-right">
//         <header className="space-y-2">
//           <h1 className="text-2xl md:text-3xl font-extrabold">
//             ברוכים הבאים · MATY-DATE
//           </h1>
//           <p className="opacity-80 text-sm md:text-base">
//             כדי להתקדם, נצטרך לעבור לפי הסדר על המשימות הבאות. המשימות החובה
//             מסומנות ב־★.
//           </p>
//         </header>

//         <nav className="mt-6 grid gap-4">
//           <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
//             <div className="flex flex-wrap items-center justify-between gap-3">
//               <div>
//                 <div className="font-semibold">★ הסכמה לתקנון ולנהלים</div>
//                 <p className="text-sm opacity-80 mt-1">
//                   חובה לקרוא ולאשר את התקנון כדי להשתמש ב־MATY-DATE.
//                 </p>
//                 <StatusRow
//                   ok={hasConsent}
//                   textOk="אושר — תודה! ✅"
//                   textWait="טרם אושר — יש לאשר את התקנון"
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Link href="/legal/consent" className="mm-btn">
//                   קריאה מלאה
//                 </Link>
//                 <button
//                   disabled={consentLoading || hasConsent}
//                   onClick={approveConsent}
//                   className="mm-btn mm-btn-primary disabled:opacity-60 inline-flex items-center justify-center gap-2"
//                 >
//                   {consentLoading && (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   )}
//                   אשר תקנון
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
//             <div className="flex flex-wrap items-center justify-between gap-3">
//               <div>
//                 <div className="font-semibold">★ הרשמה / כניסה</div>
//                 <p className="text-sm opacity-80 mt-1">
//                   התחברות מאובטחת באמצעות אימייל/סיסמה או Google. לאחר ההתחברות
//                   תחזרו לכאן אוטומטית.
//                 </p>
//                 <StatusRow
//                   ok={authed}
//                   textOk="מחובר/ת ✅"
//                   textWait="לא מחובר/ת — יש להירשם/להיכנס"
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <button
//                   onClick={goAuth}
//                   className="mm-btn mm-btn-primary"
//                   disabled={!hasConsent}
//                   title={
//                     !hasConsent
//                       ? "יש לאשר תקנון לפני ההרשמה"
//                       : "עבור למסך הרשמה/כניסה"
//                   }
//                 >
//                   עבור להרשמה/כניסה
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
//             <div className="flex flex-wrap items-center justify-between gap-3">
//               <div>
//                 <div className="font-semibold">פרופיל — מילוי ראשוני</div>
//                 <p className="text-sm opacity-80 mt-1">
//                   כמה פרטים בסיסיים כדי לשפר את איכות ההתאמות.
//                 </p>
//                 <StatusRow
//                   ok={profileDone}
//                   textOk="הושלם ✅"
//                   textWait="מומלץ להשלים"
//                 />
//               </div>
//               <Link
//                 href="/date/profile"
//                 className={`mm-btn ${!mandatoryOk ? "opacity-50 pointer-events-none" : ""}`}
//               >
//                 פתח פרופיל
//               </Link>
//             </div>
//           </div>

//           <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
//             <div className="flex flex-wrap items-center justify-between gap-3">
//               <div>
//                 <div className="font-semibold">העדפות התאמה</div>
//                 <p className="text-sm opacity-80 mt-1">
//                   ציינו טווח גילאים, קהילות רלוונטיות ועוד — זה עוזר מאוד.
//                 </p>
//                 <StatusRow
//                   ok={prefsDone}
//                   textOk="הושלם ✅"
//                   textWait="מומלץ להשלים"
//                 />
//               </div>
//               <Link
//                 href="/date/preferences"
//                 className={`mm-btn ${!mandatoryOk ? "opacity-50 pointer-events-none" : ""}`}
//               >
//                 פתח העדפות
//               </Link>
//             </div>
//           </div>

//           <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
//             <div className="flex flex-wrap items-center justify-between gap-3">
//               <div>
//                 <div className="font-semibold">סרטון היכרות (אופציונלי)</div>
//                 <p className="text-sm opacity-80 mt-1">
//                   סרטון קצר מעלה משמעותית את אחוזי ההתאמה והפניות.
//                 </p>
//                 <StatusRow
//                   ok={videoDone}
//                   textOk="הועלה ✅"
//                   textWait="אפשר להוסיף מאוחר יותר"
//                 />
//               </div>
//               <Link
//                 href="/date/video"
//                 className={`mm-btn ${!mandatoryOk ? "opacity-50 pointer-events-none" : ""}`}
//               >
//                 הוספת סרטון
//               </Link>
//             </div>
//           </div>
//         </nav>

//         <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
//           <div className="text-xs opacity-70">
//             לא ניתן להמשיך לפני השלמת משימות החובה (★).
//           </div>
//           <button
//             onClick={continueToNext}
//             disabled={!mandatoryOk}
//             className="mm-btn mm-btn-primary disabled:opacity-60"
//           >
//             המשך ליעד
//           </button>
//         </div>

//         <div className="mt-6 text-xs opacity-70 flex flex-wrap gap-x-3 gap-y-1">
//           <Link href="/legal/terms" className="underline hover:opacity-100">
//             תנאי שימוש
//           </Link>
//           <span>·</span>
//           <Link href="/legal/privacy" className="underline hover:opacity-100">
//             פרטיות
//           </Link>
//           <span>·</span>
//           <Link href="/legal/conduct" className="underline hover:opacity-100">
//             כללי קהילה והתנהגות
//           </Link>
//         </div>
//       </section>
//     </main>
//   );
// }

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/** ---- הגדרות חסינות/אונבורדינג ---- */
const ONBOARDED_COOKIE =
  process.env.NEXT_PUBLIC_DATE_ONBOARDED_COOKIE || "md:date_onboarded";
const ONBOARDED_MAX_AGE_DAYS = 180; // חצי שנה

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)",
    ),
  );
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(name: string, value: string, days: number) {
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function StatusRow({
  ok,
  textOk,
  textWait,
}: {
  ok: boolean;
  textOk: string;
  textWait: string;
}) {
  return (
    <div className="mt-1 flex items-center gap-2 text-[12px]">
      {ok ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-emerald-600">{textOk}</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">{textWait}</span>
        </>
      )}
    </div>
  );
}

export default function DateGatePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const nextTarget = sp.get("next") || "/date/profile";
  const forceGate = sp.get("force") === "1"; // תמיד להציג שער

  const [consentLoading, setConsentLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);

  const [profileDone, setProfileDone] = useState(false);
  const [prefsDone, setPrefsDone] = useState(false);
  const [videoDone, setVideoDone] = useState(false);

  // בקשת סטטוס הסכמה (שרת קובע לפי קוּקי גרסה)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/legal/consent/status", {
          cache: "no-store",
        });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        setHasConsent(!!j?.has || false);
      } catch {
        if (!alive) return;
        setHasConsent(false);
      } finally {
        if (alive) setConsentLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // דגלים רכים מהדפדפן (לא חובה)
  useEffect(() => {
    try {
      setProfileDone(localStorage.getItem("date:profileDone") === "1");
      setPrefsDone(localStorage.getItem("date:prefsDone") === "1");
      setVideoDone(localStorage.getItem("date:videoDone") === "1");
    } catch {}
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "date:profileDone") setProfileDone(e.newValue === "1");
      if (e.key === "date:prefsDone") setPrefsDone(e.newValue === "1");
      if (e.key === "date:videoDone") setVideoDone(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const authed = status === "authenticated";
  const mandatoryOk = hasConsent && authed;

  // אישור הסכמה
  const approveConsent = useCallback(async () => {
    setConsentLoading(true);
    try {
      const r = await fetch("/api/legal/consent", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (j?.ok) setHasConsent(true);
    } finally {
      setConsentLoading(false);
    }
  }, []);

  // מעבר למסך הרשמה/כניסה
  const goAuth = useCallback(() => {
    const from = `/date?next=${encodeURIComponent(nextTarget)}`;
    router.push(`/auth?mode=register&from=${encodeURIComponent(from)}`);
  }, [router, nextTarget]);

  // המשך ידני (אם נתקעת)
  const continueToNext = useCallback(() => {
    if (!mandatoryOk) return;
    router.push(nextTarget);
  }, [mandatoryOk, router, nextTarget]);

  /** ------------------- MAGIC: חד-פעמי -------------------
   * ברגע שיש גם consent וגם התחברות:
   * - קובע cookie ONBOARDED ל-180 יום (וגם localStorage רך).
   * - אם לא force=1, מפנה אוטומטית ליעד (next או /date/profile).
   * ------------------------------------------------------ */
  useEffect(() => {
    if (status === "loading") return;
    if (!mandatoryOk) return;

    // קבע/רענן חסינות
    const already = getCookie(ONBOARDED_COOKIE) === "1";
    if (!already) {
      setCookie(ONBOARDED_COOKIE, "1", ONBOARDED_MAX_AGE_DAYS);
      try {
        localStorage.setItem("date:onboarded", "1");
      } catch {}
    }

    if (!forceGate) {
      // דיליי קטן לשקט ויזואלי, ואז הפניה
      const t = setTimeout(() => router.replace(nextTarget), 250);
      return () => clearTimeout(t);
    }
  }, [mandatoryOk, status, forceGate, router, nextTarget]);

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-3xl mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-6 md:p-8 shadow-sm text-right">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            ברוכים הבאים · MATY-DATE
          </h1>
          <p className="opacity-80 text-sm md:text-base">
            כדי להתקדם בפעם הראשונה נדרש להשלים את משימות החובה (★). לאחר מכן
            הכניסה תהיה מהירה וללא שאלות.
          </p>
        </header>

        <nav className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">★ הסכמה לתקנון ולנהלים</div>
                <p className="text-sm opacity-80 mt-1">
                  חובה לקרוא ולאשר את התקנון לשימוש ב־MATY-DATE.
                </p>
                <StatusRow
                  ok={hasConsent}
                  textOk="אושר — תודה! ✅"
                  textWait="טרם אושר — יש לאשר את התקנון"
                />
              </div>
              <div className="grid gap-2">
                <Link href="/legal/consent" className="mm-btn">
                  קריאה מלאה
                </Link>
                <button
                  disabled={consentLoading || hasConsent}
                  onClick={approveConsent}
                  className="mm-btn mm-btn-primary disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {consentLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  אשר תקנון
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">★ הרשמה / כניסה</div>
                <p className="text-sm opacity-80 mt-1">
                  התחברות מאובטחת באמצעות אימייל/סיסמה או Google. לאחר ההתחברות
                  תחזרו לכאן אוטומטית.
                </p>
                <StatusRow
                  ok={authed}
                  textOk="מחובר/ת ✅"
                  textWait="לא מחובר/ת — יש להירשם/להיכנס"
                />
              </div>
              <div className="grid gap-2">
                <button
                  onClick={goAuth}
                  className="mm-btn mm-btn-primary"
                  disabled={!hasConsent}
                  title={
                    !hasConsent
                      ? "יש לאשר תקנון לפני ההרשמה"
                      : "עבור למסך הרשמה/כניסה"
                  }
                >
                  עבור להרשמה/כניסה
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">פרופיל — מילוי ראשוני</div>
                <p className="text-sm opacity-80 mt-1">
                  כמה פרטים בסיסיים כדי לשפר את איכות ההתאמות.
                </p>
                <StatusRow
                  ok={profileDone}
                  textOk="הושלם ✅"
                  textWait="מומלץ להשלים"
                />
              </div>
              <Link
                href="/date/profile"
                className={`mm-btn ${!mandatoryOk ? "opacity-50 pointer-events-none" : ""}`}
              >
                פתח פרופיל
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">העדפות התאמה</div>
                <p className="text-sm opacity-80 mt-1">
                  ציינו טווח גילאים, קהילות רלוונטיות ועוד — זה עוזר מאוד.
                </p>
                <StatusRow
                  ok={prefsDone}
                  textOk="הושלם ✅"
                  textWait="מומלץ להשלים"
                />
              </div>
              <Link
                href="/date/preferences"
                className={`mm-btn ${!mandatoryOk ? "opacity-50 pointer-events-none" : ""}`}
              >
                פתח העדפות
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">סרטון היכרות (אופציונלי)</div>
                <p className="text-sm opacity-80 mt-1">
                  סרטון קצר מעלה משמעותית את אחוזי ההתאמה והפניות.
                </p>
                <StatusRow
                  ok={videoDone}
                  textOk="הועלה ✅"
                  textWait="אפשר להוסיף מאוחר יותר"
                />
              </div>
              <Link
                href="/date/video"
                className={`mm-btn ${!mandatoryOk ? "opacity-50 pointer-events-none" : ""}`}
              >
                הוספת סרטון
              </Link>
            </div>
          </div>
        </nav>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs opacity-70">
            לא ניתן להמשיך לפני השלמת משימות החובה (★) — בפעם הראשונה בלבד.
          </div>
          <button
            onClick={continueToNext}
            disabled={!mandatoryOk}
            className="mm-btn mm-btn-primary disabled:opacity-60"
          >
            המשך ליעד
          </button>
        </div>

        <div className="mt-6 text-xs opacity-70 flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/legal/terms" className="underline hover:opacity-100">
            תנאי שימוש
          </Link>
          <span>·</span>
          <Link href="/legal/privacy" className="underline hover:opacity-100">
            פרטיות
          </Link>
          <span>·</span>
          <Link href="/legal/conduct" className="underline hover:opacity-100">
            כללי קהילה והתנהגות
          </Link>
        </div>
      </section>
    </main>
  );
}
