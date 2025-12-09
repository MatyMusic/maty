// src/app/auth/signup/page.tsx
"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const GENRES = [
  { id: "chabad", label: 'חסידי (חב"ד)' },
  { id: "mizrahi", label: "מזרחי" },
  { id: "soft", label: "שקט" },
  { id: "fun", label: "מקפיץ" },
] as const;

type Phase = "idle" | "registering" | "connecting";

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    preferredGenres: [] as string[],
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  const loading = phase !== "idle";

  function togglePref(id: string) {
    setForm((f) => ({
      ...f,
      preferredGenres: f.preferredGenres.includes(id)
        ? f.preferredGenres.filter((x) => x !== id)
        : [...f.preferredGenres, id],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);

    if (!form.email || !form.password) {
      setErr("חסר אימייל או סיסמה");
      return;
    }
    if (form.password.length < 8) {
      setErr("סיסמה חייבת להיות באורך 8+ תווים");
      return;
    }

    setPhase("registering");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // לא משתמשים יותר ב-next כאן – תמיד נלך ל-/auth/welcome אחרי התחברות
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setErr(
        data?.error === "email_exists"
          ? "האימייל כבר רשום. נסה להתחבר."
          : "שגיאה בהרשמה",
      );
      setPhase("idle");
      return;
    }

    setOk(true);
    setPhase("connecting");

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (signInRes && !signInRes.error) {
      // 🔥 תמיד לשקופית welcome, בלי לקפוץ אוטומטית ל-/date
      router.push("/auth/welcome");
    } else {
      setErr(
        "ההרשמה הצליחה, אבל משהו נכשל בהתחברות. נסה להתחבר ידנית במסך ההתחברות.",
      );
      setPhase("idle");
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold mb-4 text-right">הרשמה</h1>

      {phase === "connecting" && (
        <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-right">
          <div className="font-semibold">ברוכים הבאים ל-MATY MUSIC 🎶</div>
          <div className="text-xs opacity-80">
            מחברים אותך לחשבון החדש שלך...
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3 text-right">
        <input
          className="input w-full"
          placeholder="שם"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input w-full"
          type="email"
          placeholder="אימייל"
          required
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value.trim().toLowerCase() })
          }
        />
        <input
          className="input w-full"
          type="password"
          placeholder="סיסמה (8+)"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <input
          className="input w-full"
          placeholder="טלפון (לא חובה)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        {/* העדפות מוזיקה */}
        <fieldset className="border rounded-xl p-3">
          <legend className="text-sm opacity-80">
            איזה מוזיקה אתם אוהבים?
          </legend>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {GENRES.map((g) => (
              <label key={g.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.preferredGenres.includes(g.id)}
                  onChange={() => togglePref(g.id)}
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && (
          <div className="text-emerald-600 text-sm">
            נרשמת בהצלחה! מחברים אותך...
          </div>
        )}

        <button
          disabled={loading}
          className="btn w-full bg-violet-600 text-white disabled:opacity-60"
        >
          {phase === "registering"
            ? "יוצר חשבון..."
            : phase === "connecting"
              ? "מחברים אותך..."
              : "יצירת חשבון"}
        </button>
      </form>

      <div className="mt-4 text-sm text-right">
        כבר רשום?{" "}
        <Link href="/auth?mode=login" className="text-violet-600 underline">
          להתחברות
        </Link>
      </div>
    </div>
  );
}
