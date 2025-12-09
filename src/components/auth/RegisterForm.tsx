// src/components/auth/RegisterForm.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type FieldErr =
  | "missing_fields"
  | "bad_email"
  | "weak_password"
  | "email_exists"
  | "server_error"
  | "network_error";

type Phase = "idle" | "registering" | "connecting";

function humanError(code?: FieldErr | string) {
  switch (code) {
    case "missing_fields":
      return "נא למלא את כל השדות.";
    case "bad_email":
      return "אימייל לא תקין.";
    case "weak_password":
      return "סיסמה צריכה להיות באורך 8 תווים לפחות.";
    case "email_exists":
      return "האימייל כבר רשום. נסה להתחבר.";
    case "network_error":
      return "שגיאת רשת. נסה שוב.";
    case "server_error":
    default:
      return "משהו השתבש. נסה שוב.";
  }
}

function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function RegisterForm({
  defaultNext = "/",
}: {
  defaultNext?: string;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  // נשלח ל־API אם תרצה, אבל לא משתמשים בו לניווט בצד לקוח
  const next = sp.get("next") || defaultNext;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);

  const loading = phase !== "idle";
  const pwScore = useMemo(() => passwordScore(password), [password]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !password || !name) {
      setErr(humanError("missing_fields"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr(humanError("bad_email"));
      return;
    }
    if (password.length < 8) {
      setErr(humanError("weak_password"));
      return;
    }

    setPhase("registering");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // next נשלח רק למידע, לא קובע את הניווט של הלקוח
        body: JSON.stringify({ name, email, password, phone, next }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setErr(humanError(data?.error || "server_error"));
        setPhase("idle");
        return;
      }

      // הרשמה הצליחה – עכשיו מתחברים לחשבון
      setPhase("connecting");

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false, // ❗ אין רידיירקט אוטומטי מצד NextAuth
      });

      if (signInRes && !signInRes.error) {
        // ❗ תמיד נוחתים על שקופית ברוכים הבאים
        router.push("/auth/welcome");
      } else {
        setErr(
          "ההרשמה הצליחה, אבל משהו נכשל בהתחברות. נסה להתחבר ידנית במסך ההתחברות.",
        );
        setPhase("idle");
      }
    } catch {
      setErr(humanError("network_error"));
      setPhase("idle");
    }
  }

  return (
    <div className="grid gap-4">
      <form className="grid gap-3 text-right" onSubmit={onSubmit}>
        <label className="grid gap-1">
          <span className="text-sm opacity-80">שם מלא</span>
          <input
            required
            className="input-base input-rtl"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="ישראל ישראלי"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-80">טלפון (אופציונלי)</span>
          <input
            type="tel"
            className="input-base input-ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972-50-1234567"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-80">אימייל</span>
          <input
            required
            type="email"
            className="input-base input-ltr"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
            placeholder="you@example.com"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-80">סיסמה</span>
          <div className="relative">
            <input
              required
              type={showPw ? "text" : "password"}
              className="input-base input-ltr pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="לפחות 8 תווים"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

          {/* מחוון חוזק פשוט */}
          <div className="h-1 mt-1 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full ${
                pwScore >= 3
                  ? "bg-green-500"
                  : pwScore === 2
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${(pwScore / 4) * 100}%` }}
            />
          </div>
          <span className="text-xs opacity-70">
            {pwScore >= 3
              ? "סיסמה חזקה"
              : pwScore === 2
                ? "סיסמה בינונית"
                : "סיסמה חלשה"}
          </span>
        </label>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        {phase === "connecting" && (
          <div className="text-emerald-600 text-sm">
            ברוכים הבאים ל-MATY MUSIC 🎶 מחברים אותך לחשבון...
          </div>
        )}

        <button
          className="btn mt-2 disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {phase === "registering"
            ? "יוצר חשבון..."
            : phase === "connecting"
              ? "מחברים אותך..."
              : "הרשמה"}
        </button>
      </form>

      <div className="grid gap-2">
        <div className="text-center text-sm opacity-70">או</div>
        <button
          className="btn bg-white text-black border mt-1"
          onClick={() =>
            signIn("google", {
              callbackUrl: "/auth/welcome", // גם בגוגל נוחתים על שקופית ברוכים הבאים
            })
          }
          disabled={loading}
        >
          התחברות עם Google
        </button>
      </div>

      <p className="text-xs opacity-60 text-center">
        בהרשמה אתה מאשר את{" "}
        <a href="/terms" className="underline">
          תנאי השימוש
        </a>{" "}
        ו־
        <a href="/privacy" className="underline">
          מדיניות הפרטיות
        </a>
        .
      </p>
    </div>
  );
}
