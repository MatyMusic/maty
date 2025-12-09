"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  Phone,
  User2,
  XCircle,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type StyleKey = "chabad" | "mizrahi" | "soft" | "fun";
const STYLES: { key: StyleKey; label: string; img: string }[] = [
  { key: "chabad", label: "חסידי", img: "/assets/images/avatar-chabad.png" },
  { key: "mizrahi", label: "מזרחי", img: "/assets/images/avatar-mizrahi.png" },
  { key: "soft", label: "שקט", img: "/assets/images/avatar-soft.png" },
  { key: "fun", label: "מקפיץ", img: "/assets/images/avatar-fun.png" },
];

const isStyle = (g: any): g is StyleKey =>
  ["chabad", "mizrahi", "soft", "fun"].includes(g);
const emailOk = (s: string) => /^\S+@\S+\.\S+$/.test(s);
function passScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// כלי קטן לשורת עזרה: אדום כשלא תקין, ירוק כשבסדר
function hintClass(ok: boolean) {
  return ok ? "text-emerald-600" : "text-red-600";
}
function Hint({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      className={`mt-1 text-[12px] ${hintClass(ok)} text-right flex items-center gap-1`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span>{children}</span>
    </p>
  );
}

export default function AuthPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  // יעד חזרה: אם חסר/לא תקין – ברירת מחדל ל-/date
  const fromParam = sp.get("from");
  const from = fromParam && fromParam.startsWith("/") ? fromParam : "/date";

  // מצב התחלתי לפי ?mode=register
  const startMode: "login" | "register" =
    sp.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(startMode);

  const oauthError = sp.get("error") || null;

  // שדות
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // העדפות
  const [style, setStyle] = useState<StyleKey>("soft");
  const [avatarId, setAvatarId] = useState<string | undefined>(undefined);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // חישובי ולידציה “חי”
  const emailValid = useMemo(() => emailOk(email), [email]);
  const pwScore = useMemo(() => passScore(pw), [pw]);
  const pwMin = pw.length >= (mode === "register" ? 6 : 1);
  const pwStrong = mode === "register" ? pwScore >= 2 && pw.length >= 8 : pwMin;
  const pw2Match = mode === "register" ? pw2.length >= 6 && pw2 === pw : true;

  // אם כבר מחובר ונכנס למסך auth במצב LOGIN – להפנות ליעד
  useEffect(() => {
    if (status === "authenticated" && startMode === "login") {
      router.replace(from);
    }
  }, [status, from, router, startMode]);

  // הודעות + הדרכה אם הגיעו מ-/date
  useEffect(() => {
    if (oauthError === "OAuthAccountNotLinked") {
      toast.error("האימייל שייך לחשבון אחר. התחבר/י בסיסמה.");
    }
    try {
      const savedStyle = localStorage.getItem(
        "preferredStyle",
      ) as StyleKey | null;
      const savedAv = localStorage.getItem("preferredAvatarId") as
        | string
        | null;
      if (savedStyle && isStyle(savedStyle)) setStyle(savedStyle);
      if (savedAv) setAvatarId(savedAv);
    } catch {}
    if (from.startsWith("/date")) {
      toast(
        (t) => (
          <div className="text-right">
            <div className="font-semibold">
              כדי להיכנס ל-MATY-DATE חייבים להירשם ולהתחבר
            </div>
            <div className="text-sm opacity-80 mt-1">
              לאחר ההתחברות תוכל לבחור אם להמשיך ל-MATY-DATE או לחזור לדף הבית.
            </div>
            <button
              className="mt-2 text-xs underline"
              onClick={() => toast.dismiss(t.id)}
            >
              הבנתי
            </button>
          </div>
        ),
        { duration: 5000 },
      );
    }
  }, [oauthError, from]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!emailValid) {
      toast.error("כתובת אימייל לא תקינה");
      return;
    }
    if (mode === "register") {
      if (!pwMin) {
        toast.error("הסיסמה קצרה מדי");
        return;
      }
      if (!pw2Match) {
        toast.error("האימות לא תואם לסיסמה");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const emailLower = email.trim().toLowerCase();
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email: emailLower,
            password: pw,
            phone,
            style,
            avatarId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          if (res.status === 409) toast.error("האימייל כבר רשום במערכת");
          else toast.error(data?.error || "שגיאה בהרשמה");
          setLoading(false);
          return;
        }
        try {
          localStorage.setItem("preferredStyle", style);
          if (avatarId) localStorage.setItem("preferredAvatarId", avatarId);
        } catch {}

        toast.success(
          data.upgraded ? "עודכנה סיסמה לחשבון קיים" : "נרשמת בהצלחה! מתחברים…",
        );

        const loginRes: any = await signIn("credentials", {
          email: emailLower,
          password: pw,
          redirect: false,
          callbackUrl: from,
        });

        // אם signIn מחזיר שגיאה – נטפל בה, אחרת ממשיכים
        if (loginRes && loginRes.error) {
          toast.error(loginRes.error || "התחברות אוטומטית נכשלה");
          setLoading(false);
          return;
        }

        // אחרי הרשמה → מסך בחירה לאן להמשיך
        router.push(`/auth/after-signup?from=${encodeURIComponent(from)}`);
        setLoading(false);
      } else {
        const res: any = await signIn("credentials", {
          email,
          password: pw,
          redirect: false,
          callbackUrl: from,
        });

        if (res && res.error) {
          toast.error("פרטי התחברות שגויים");
          setLoading(false);
          return;
        }

        toast.success("ברוך הבא!");
        router.replace(from);
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "שגיאה לא צפויה");
      setLoading(false);
    }
  }

  async function onGoogle() {
    if (loading) return;
    setLoading(true);
    try {
      try {
        localStorage.setItem("preferredStyle", style);
        if (avatarId) localStorage.setItem("preferredAvatarId", avatarId);
      } catch {}
      await signIn("google", { callbackUrl: from });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-950/70 backdrop-blur shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-black/10 dark:border-white/10">
          <h1 className="text-2xl font-extrabold text-right">ברוך הבא</h1>
          <p className="text-right text-sm opacity-70">
            התחבר או הירשם כדי להמשיך
          </p>
          <div className="mt-2 text-[12px] text-red-600 flex items-center gap-1 justify-end">
            <Info className="h-3.5 w-3.5 opacity-70" />
            <span>
              כדי להיכנס ל-MATY-DATE: נרשמים → מתחברים → מאשרים תקנון → בוחרים
              יעד → ממשיכים.
            </span>
          </div>
        </div>

        {/* טאבים */}
        <div className="p-2 grid grid-cols-2 gap-2">
          <button
            className={`rounded-xl py-2 text-sm border transition ${
              mode === "login"
                ? "bg-black text-white border-black"
                : "bg-transparent border-black/10 dark:border-white/10"
            }`}
            onClick={() => setMode("login")}
            disabled={loading}
            title="כניסה לחשבון קיים"
          >
            כניסה
          </button>
          <button
            className={`rounded-xl py-2 text-sm border transition ${
              mode === "register"
                ? "bg-black text-white border-black"
                : "bg-transparent border-black/10 dark:border-white/10"
            }`}
            onClick={() => setMode("register")}
            disabled={loading}
            title="פתיחת חשבון חדש"
          >
            הרשמה
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6 pt-2">
          {/* טופס */}
          <form onSubmit={onSubmit} className="grid gap-3" noValidate>
            {mode === "register" && (
              <div className="relative">
                <User2 className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
                <input
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 px-3 py-2 text-right"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                <Hint ok={name.trim().length > 0}>
                  שם מלא מסייע לנו בזיהוי הראשוני מולך.
                </Hint>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 px-3 py-2 text-right"
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                aria-describedby="email-help"
              />
              <Hint ok={emailValid}>
                חובה: נשתמש בו להתחברות ולהתראות חשובות.
              </Hint>
            </div>

            {mode === "register" && (
              <div className="relative">
                <Phone className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
                <input
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 px-3 py-2 text-right"
                  type="tel"
                  placeholder="טלפון (אופציונלי)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoComplete="tel"
                />
                <Hint
                  ok={phone.trim().length === 0 || phone.trim().length >= 7}
                >
                  אופציונלי: לעדכונים מהירים על התאמות.
                </Hint>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 pl-10 px-3 py-2 text-right"
                type={showPw ? "text" : "password"}
                placeholder="סיסמה"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                disabled={loading}
                required
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                minLength={6}
                aria-describedby="pw-help"
              />
              <button
                type="button"
                className="absolute left-2 top-2 p-1 rounded hover:bg-black/5 dark:hover:bg.white/5 dark:hover:bg-white/5"
                onClick={() => setShowPw((v) => !v)}
                aria-label="toggle password"
                title="הצג/הסתר סיסמה"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4 opacity-70" />
                ) : (
                  <Eye className="h-4 w-4 opacity-70" />
                )}
              </button>
              <Hint ok={pwStrong}>
                {mode === "register"
                  ? "מומלץ: 8+ תווים עם אות גדולה, מספר ותו מיוחד."
                  : "הזן את סיסמת החשבון שלך."}
              </Hint>
            </div>

            {mode === "register" && (
              <>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
                  <input
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 pl-10 px-3 py-2 text-right"
                    type={showPw ? "text" : "password"}
                    placeholder="אימות סיסמה"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    aria-describedby="pw2-help"
                  />
                  <Hint ok={pw2Match}>
                    הקלד/י שוב כדי לוודא שלא נפלה שגיאה.
                  </Hint>
                </div>

                {/* מד חוזק */}
                <div
                  className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"
                  title="חוזק הסיסמה"
                >
                  <div
                    className={`h-full transition-all ${
                      pwScore <= 1
                        ? "bg-red-500"
                        : pwScore === 2
                          ? "bg-yellow-500"
                          : pwScore === 3
                            ? "bg-emerald-500"
                            : "bg-emerald-600"
                    }`}
                    style={{ width: `${(pwScore / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] opacity-60 text-right">
                  סיסמה חזקה מגינה על החשבון שלך.
                </p>
              </>
            )}

            <button
              type="submit"
              className="rounded-xl py-2 bg-black text-white hover:brightness-95 disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={loading}
              title={mode === "register" ? "הרשמה וכניסה" : "כניסה"}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "register" ? "הרשמה" : "כניסה"}
            </button>
            <Hint ok={true}>
              אם הגעת מ-MATY-DATE, אחרי ההתחברות תוכל לבחור אם להמשיך לשם או
              לחזור לדף הבית.
            </Hint>

            <button
              type="button"
              onClick={onGoogle}
              className="rounded-xl py-2 border border-black/10 dark:border-white/10"
              disabled={loading}
              title="המשך עם Google"
            >
              המשך עם Google
            </button>
            <Hint ok={true}>חדש/ה? Google ייצור עבורך חשבון אוטומטית.</Hint>

            <p className="text-[11px] opacity-60 mt-2 text-right">
              בלחיצה אתה מאשר את תנאי השירות והפרטיות.
            </p>
            <div className="text-right text-sm">
              כבר רשום?{" "}
              <Link
                href={`/auth?from=${encodeURIComponent(from)}`}
                className="underline"
                title="מעבר למסך כניסה"
              >
                כניסה
              </Link>
            </div>
          </form>

          {/* צד ימין: בחירת סגנון/אווטאר בהרשמה */}
          {mode === "register" && (
            <div className="grid gap-6">
              <div>
                <div className="mb-2 font-semibold text-right">
                  איזה סגנון מוזיקה?
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STYLES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStyle(s.key)}
                      className={[
                        "group rounded-2xl border p-3 text-center transition",
                        style === s.key
                          ? "border-violet-500 ring-2 ring-violet-500/30 bg-violet-500/5"
                          : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
                      ].join(" ")}
                      aria-pressed={style === s.key}
                      title={`בחירת סגנון: ${s.label}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.img}
                        alt=""
                        className="mx-auto h-14 w-14 object-contain"
                        onError={(e) =>
                          ((e.currentTarget as HTMLImageElement).style.opacity =
                            "0.25")
                        }
                      />
                      <div className="mt-2 text-sm font-medium">{s.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs opacity-70 mt-2 text-right">
                  אפשר לשנות אח״כ בפרופיל.
                </p>
              </div>

              <div>
                <div className="mb-2 font-semibold text-right">
                  מזהה אווטאר (לא חובה)
                </div>
                <input
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-right"
                  placeholder="למשתמשי AvatarPicker / מזהה פנימי"
                  value={avatarId || ""}
                  onChange={(e) => setAvatarId(e.target.value || undefined)}
                />
                <Hint ok={true}>אפשר להשאיר ריק ולעדכן מאוחר יותר.</Hint>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
