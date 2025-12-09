"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

const COOKIE = process.env.NEXT_PUBLIC_CONSENT_COOKIE || "md:consent";

export default function ConsentPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/date";

  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(false);
  const allOk = a && b && c;

  async function onAccept() {
    if (!allOk) return;
    // קריאה ל-API שמציב את הקוקי ואז מפנה
    const res = await fetch(
      `/api/legal/consent/accept?next=${encodeURIComponent(next)}`,
      { method: "POST" },
    );
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      router.replace(next);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-dvh grid place-items-center bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-2xl my-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/70 p-6 md:p-8 shadow-card text-right">
        <h1 className="text-2xl font-extrabold">אישור תקנון והסכמות</h1>
        <p className="opacity-80 text-sm mt-1">
          לפני שימוש ב-MATY-DATE עליך לאשר את התקנון והנהלים.
        </p>

        <ul className="mt-4 grid gap-3 text-sm">
          <li className="mm-card p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={a}
                onChange={(e) => setA(e.target.checked)}
              />
              <span>
                קראתי ואני מסכים/ה ל־
                <a className="underline" href="/legal/terms" target="_blank">
                  תנאי השימוש
                </a>
                .
              </span>
            </label>
          </li>
          <li className="mm-card p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={b}
                onChange={(e) => setB(e.target.checked)}
              />
              <span>
                קראתי ואני מסכים/ה ל־
                <a className="underline" href="/legal/privacy" target="_blank">
                  מדיניות הפרטיות
                </a>
                .
              </span>
            </label>
          </li>
          <li className="mm-card p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={c}
                onChange={(e) => setC(e.target.checked)}
              />
              <span>
                קראתי ואני מתחייב/ת ל־
                <a
                  className="underline"
                  href="/legal/guidelines"
                  target="_blank"
                >
                  כללי הקהילה וההתנהגות
                </a>
                .
              </span>
            </label>
          </li>
        </ul>

        <div className="mt-5 flex gap-2 justify-end">
          <a href={next} className="mm-btn">
            ביטול
          </a>
          <button
            disabled={!allOk}
            onClick={onAccept}
            className="mm-btn mm-btn-primary disabled:opacity-60"
            title={!allOk ? "יש לסמן את כל התיבות" : "אישור והמשך"}
          >
            אישור והמשך
          </button>
        </div>

        <p className="text-xs opacity-70 mt-3">
          לאחר האישור נציב קוקי {COOKIE} בדפדפן כדי שלא נבקש שוב (עד גרסה חדשה).
        </p>
      </section>
    </main>
  );
}
