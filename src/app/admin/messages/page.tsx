"use client";

import { useState } from "react";

type Mode = "single-id" | "single-email" | "broadcast";

type ApiResponse = {
  ok: boolean;
  error?: string;
  createdCount?: number;
};

export default function AdminMessagesPage() {
  const [mode, setMode] = useState<Mode>("single-id");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState("system");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [metaJson, setMetaJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!title.trim() || !body.trim()) {
      setError("חובה למלא כותרת ותוכן הודעה.");
      return;
    }

    if (mode === "single-id" && !userId.trim()) {
      setError("בחרת מצב לפי User ID – חובה למלא userId.");
      return;
    }

    if (mode === "single-email" && !email.trim()) {
      setError("בחרת מצב לפי Email – חובה למלא אימייל.");
      return;
    }

    let meta: any = undefined;
    if (metaJson.trim()) {
      try {
        meta = JSON.parse(metaJson);
      } catch {
        setError("meta JSON לא תקין. ודא שזה JSON חוקי.");
        return;
      }
    }

    try {
      setLoading(true);

      const payload: any = {
        mode,
        kind,
        title,
        body,
      };

      if (mode === "single-id") payload.userId = userId.trim();
      if (mode === "single-email") payload.email = email.trim();
      if (meta) payload.meta = meta;

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await res.json();

      if (!data.ok) {
        setError(data.error || "שגיאה לא ידועה מהשרת");
      } else {
        setResult(
          `הודעה נשלחה בהצלחה. נוצרו ${data.createdCount ?? 1} הודעות.`,
        );
      }
    } catch (err: any) {
      console.error("admin send message error:", err);
      setError("קרתה תקלה בשליחה לשרת.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* כותרת */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              מרכז הודעות – אדמין
            </h1>
            <p className="mt-1 text-sm text-neutral-300 max-w-xl">
              מכאן אתה יכול לשלוח הודעות מערכת, מוזיקה ו־MATY-DATE למשתמשים, או
              לשדר הודעות לכל האתר.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900/80 border border-emerald-400/50 px-3 py-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>מצב: אדמין מחובר</span>
            </span>
            <span className="text-neutral-400">
              רק משתמשי Admin/Superadmin יכולים לגשת לדף הזה.
            </span>
          </div>
        </header>

        {/* כרטיס טופס */}
        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 shadow-2xl shadow-black/40 p-4 sm:p-6 space-y-5">
          {/* בחירת מצב */}
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setMode("single-id")}
              className={[
                "rounded-2xl border px-3 py-2 text-sm text-right transition h-full",
                mode === "single-id"
                  ? "border-fuchsia-500 bg-fuchsia-950/40"
                  : "border-neutral-700 bg-neutral-900/70 hover:bg-neutral-800",
              ].join(" ")}
            >
              <div className="font-semibold mb-0.5">לפי User ID</div>
              <div className="text-xs text-neutral-300">
                שליחת הודעה למשתמש יחיד לפי מזהה (Mongo ID / session.user.id).
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("single-email")}
              className={[
                "rounded-2xl border px-3 py-2 text-sm text-right transition h-full",
                mode === "single-email"
                  ? "border-fuchsia-500 bg-fuchsia-950/40"
                  : "border-neutral-700 bg-neutral-900/70 hover:bg-neutral-800",
              ].join(" ")}
            >
              <div className="font-semibold mb-0.5">לפי אימייל</div>
              <div className="text-xs text-neutral-300">
                שימוש בכתובת אימייל, המערכת תאחזר את המשתמש לפי email.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("broadcast")}
              className={[
                "rounded-2xl border px-3 py-2 text-sm text-right transition h-full",
                mode === "broadcast"
                  ? "border-emerald-500 bg-emerald-950/40"
                  : "border-neutral-700 bg-neutral-900/70 hover:bg-neutral-800",
              ].join(" ")}
            >
              <div className="font-semibold mb-0.5">שידור לכל המשתמשים</div>
              <div className="text-xs text-neutral-300">
                נשלחת הודעה לכל המשתמשים הפעילים במערכת (User collection).
              </div>
            </button>
          </div>

          {/* טופס */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* שורת יעד + סוג */}
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-2">
                {mode === "single-id" && (
                  <>
                    <label className="block text-xs text-neutral-300">
                      User ID של היעד
                    </label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                      placeholder="למשל: 675f8b1c81d3f1a0f0c12345"
                    />
                  </>
                )}

                {mode === "single-email" && (
                  <>
                    <label className="block text-xs text-neutral-300">
                      אימייל של היעד
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                      placeholder="user@example.com"
                    />
                  </>
                )}

                {mode === "broadcast" && (
                  <div className="rounded-xl border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    שים לב: במצב זה ההודעה תישלח לכל המשתמשים הרשומים במערכת.
                    מומלץ להשתמש בזה רק להודעות מערכת חשובות (עדכונים, חגים,
                    תחזוקה וכו׳).
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-neutral-300">
                  סוג הודעה (kind)
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="system">⚙️ system</option>
                  <option value="music">🎵 music</option>
                  <option value="date">❤️ date</option>
                  <option value="promo">⭐ promo</option>
                  <option value="custom">🔔 custom</option>
                </select>
              </div>
            </div>

            {/* כותרת */}
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-300">
                כותרת ההודעה
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder="ברוך הבא ל-MATY MUSIC 🎧"
              />
            </div>

            {/* גוף */}
            <div className="space-y-1.5">
              <label className="block text-xs text-neutral-300">
                תוכן ההודעה
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder={`היי 👋\nברוך הבא ל-MATY MUSIC. בקרוב תקבל עדכונים על שירים, פלייליסטים, ו-MATY-DATE.`}
              />
            </div>

            {/* meta JSON */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs text-neutral-300">
                  Meta JSON (אופציונלי)
                </label>
                <span className="text-[11px] text-neutral-500">
                  לדוגמה: {'{ "ctaUrl": "/music/123", "badge": "חדש" }'}
                </span>
              </div>
              <textarea
                value={metaJson}
                onChange={(e) => setMetaJson(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder='{"ctaUrl": "/music", "badge": "חדש"}'
              />
            </div>

            {/* כפתור + סטטוס */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-700/40 hover:from-fuchsia-400 hover:to-rose-400 disabled:opacity-60"
              >
                {loading ? "שולח הודעה…" : "שלח הודעה עכשיו"}
              </button>

              <div className="flex flex-col items-start sm:items-end gap-1 text-xs min-h-[1.5rem]">
                {error && <span className="text-rose-400">⚠ {error}</span>}
                {result && (
                  <span className="text-emerald-400">✅ {result}</span>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* טיפ למטה */}
        <section className="rounded-3xl border border-white/5 bg-neutral-900/70 p-4 text-xs text-neutral-300 space-y-1.5">
          <div className="font-semibold mb-1">טיפים לשימוש חכם:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>להודעות מערכת קבועות – השתמש ב-kind = system.</li>
            <li>להודעות שקשורות לשירים / פלייליסטים – kind = music.</li>
            <li>להודעות התאמות MATY-DATE – kind = date.</li>
            <li>
              שימוש ב-meta JSON מאפשר ללינקים בעתיד (CTA, badge, redirect
              וכדומה).
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
