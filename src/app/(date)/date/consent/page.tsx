"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Ck = {
  tos: boolean;
  privacy: boolean;
  age: boolean;
  community: boolean;
};

export default function ConsentPage() {
  const [ck, setCk] = React.useState<Ck>({
    tos: false,
    privacy: false,
    age: false,
    community: false,
  });
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  const all = ck.tos && ck.privacy && ck.age && ck.community;

  async function approve() {
    if (!all) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const r = await fetch("/api/date/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateEnabled: true,
          consents: {
            tosAt: now,
            privacyAt: now,
            ageAt: now,
            communityAt: now,
          },
        }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      router.push("/date/profile");
    } catch (e) {
      alert("שגיאה בשמירת ההסכמה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-dvh grid place-items-center bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="w-[min(96vw,720px)] rounded-3xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/75 p-6 md:p-8 shadow-sm text-right">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          תנאי שימוש וקהילה · MATY-DATE
        </h1>
        <p className="mt-1 opacity-80 text-sm">
          נא אשר/י את התנאים כדי להמשיך.
        </p>

        <ul className="mt-5 space-y-3">
          <li className="flex items-center gap-3">
            <input
              type="checkbox"
              className="accent-violet-600 h-4 w-4"
              checked={ck.tos}
              onChange={(e) => setCk((p) => ({ ...p, tos: e.target.checked }))}
            />
            <span>
              קראתי ואני מסכים/ה ל
              <a className="underline" href="/terms" target="_blank">
                {" "}
                תנאי השימוש
              </a>
              .
            </span>
          </li>
          <li className="flex items-center gap-3">
            <input
              type="checkbox"
              className="accent-violet-600 h-4 w-4"
              checked={ck.privacy}
              onChange={(e) =>
                setCk((p) => ({ ...p, privacy: e.target.checked }))
              }
            />
            <span>
              קראתי ואני מסכים/ה ל
              <a className="underline" href="/privacy" target="_blank">
                {" "}
                מדיניות הפרטיות
              </a>
              .
            </span>
          </li>
          <li className="flex items-center gap-3">
            <input
              type="checkbox"
              className="accent-violet-600 h-4 w-4"
              checked={ck.age}
              onChange={(e) => setCk((p) => ({ ...p, age: e.target.checked }))}
            />
            <span>אני מצהיר/ה שאני מעל גיל 18.</span>
          </li>
          <li className="flex items-center gap-3">
            <input
              type="checkbox"
              className="accent-violet-600 h-4 w-4"
              checked={ck.community}
              onChange={(e) =>
                setCk((p) => ({ ...p, community: e.target.checked }))
              }
            />
            <span>אני מתחייב/ת לשיח מכבד וכללי צניעות.</span>
          </li>
        </ul>

        <div className="mt-5 flex gap-2">
          <button
            onClick={approve}
            disabled={!all || busy}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {busy ? "שומר…" : "אני מסכים/ה וממשיכים"}
          </button>
          <a
            href="/date"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm border bg-white/80 dark:bg-neutral-900/80"
          >
            חזרה
          </a>
        </div>
      </section>
    </main>
  );
}
