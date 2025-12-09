// src/app/admin/settings/features/page.tsx
"use client";

import * as React from "react";

type Presence = {
  enabled: boolean;
  requiredTier?: "free" | "plus" | "pro" | "vip";
  updatedAt: string;
  updatedBy?: string | null;

  // 🔽 דגלים חדשים (לא חובה שה-API ישמור אותם, הם אופציונליים)
  allowProfilePeek?: boolean; // לאפשר לאדמין להיכנס לפרופילים
  allowChatAudit?: boolean; // צפייה בצ'אטים חשודים
  allowUserReports?: boolean; // כפתור "דיווח" אצל המשתמשים
  autoFlagSuspicious?: boolean; // סימון אוטומטי של פעילות חשודה
};

export default function AdminFeaturesPage() {
  const [presence, setPresence] = React.useState<Presence | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      const r = await fetch("/api/admin/settings/features", {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "failed");
      setPresence(j.presence);
    } catch (e: any) {
      setErr(e?.message || "load_failed");
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function save(next: Partial<Presence>) {
    if (!presence) return;
    try {
      setSaving(true);
      setErr(null);

      const r = await fetch("/api/admin/settings/features", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presence: { ...presence, ...next } }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "save_failed");
      setPresence(j.presence);
    } catch (e: any) {
      setErr(e?.message || "save_failed");
    } finally {
      setSaving(false);
    }
  }

  if (!presence) {
    return (
      <div className="p-6" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-32 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  /* ======================= UI ======================= */

  return (
    <div className="p-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* כותרת עליונה */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              מרכז פיצ׳רים ואבטחה
            </h1>
            <p className="mt-1 text-sm opacity-70">
              שליטה על נוכחות בזמן אמת, מודרציה, תלונות משתמשים וקיצורי דרך
              לניהול עמוק יותר במערכת.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 text-xs opacity-70">
            <div>
              עודכן: {new Date(presence.updatedAt).toLocaleString()}
              {presence.updatedBy ? ` · ע״י ${presence.updatedBy}` : ""}
            </div>
            {saving && (
              <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                שומר הגדרות…
              </div>
            )}
          </div>
        </header>

        {err && (
          <div
            className="rounded-xl border border-rose-300 bg-rose-50/90 text-rose-900 px-3 py-2 text-sm flex items-center gap-2"
            role="alert"
          >
            <span>⚠️</span>
            <span>שגיאה: {err}</span>
            <button
              type="button"
              onClick={load}
              className="ml-auto text-xs underline hover:no-underline"
            >
              רענן
            </button>
          </div>
        )}

        {/* רשת כרטיסים */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
          {/* צד שמאל – נוכחות ו־Real-time */}
          <div className="space-y-4">
            {/* Presence / מי סביבי */}
            <section className="rounded-2xl border border-sky-200/70 dark:border-sky-900/60 bg-gradient-to-br from-sky-50 via-indigo-50 to-emerald-50 dark:from-sky-950/60 dark:via-indigo-950/40 dark:to-emerald-950/40 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟣</span>
                    <h2 className="font-semibold text-base">
                      נוכחות בזמן אמת · “מי סביבי”
                    </h2>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm opacity-70 max-w-md">
                    הצגת מונה משתמשים אונליין וכפתור “מי סביבי” ב־Header, כולל
                    הגבלת גישה לפי סוג מנוי.
                  </p>
                </div>

                {/* מתג הפעלה */}
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={!!presence.enabled}
                    onChange={(e) => save({ enabled: e.target.checked })}
                  />
                  <span className="peer-checked:bg-emerald-500 relative h-7 w-12 rounded-full bg-neutral-300 transition">
                    <span className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition peer-checked:translate-x-5 shadow" />
                  </span>
                  <span className="text-sm">
                    {presence.enabled ? "פעיל" : "כבוי"}
                  </span>
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr] items-center">
                <div className="text-xs sm:text-sm opacity-80">
                  דרישת מנוי לגישה:
                </div>
                <select
                  className="rounded-xl border border-sky-200/70 bg-white/90 dark:bg-neutral-950/80 px-2 py-1.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-400/70"
                  value={presence.requiredTier || "free"}
                  onChange={(e) =>
                    save({
                      requiredTier: e.target.value as Presence["requiredTier"],
                    })
                  }
                >
                  <option value="free">Free – כולם</option>
                  <option value="plus">Plus ומעלה</option>
                  <option value="pro">Pro ומעלה</option>
                  <option value="vip">VIP בלבד</option>
                </select>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span>מונה אונליין מוצג ב־Topbar וב־Header.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                  <span>
                    API נוכחות: ‎/api/presence/count + ‎/api/presence/list.
                  </span>
                </div>
              </div>
            </section>

            {/* מודרציה והגנות */}
            <section className="rounded-2xl border border-violet-200/70 dark:border-violet-900/60 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-rose-50 dark:from-violet-950/70 dark:via-fuchsia-950/40 dark:to-rose-950/50 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <h2 className="font-semibold text-base">
                      מודרציה ובטיחות משתמשים
                    </h2>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm opacity-70 max-w-md">
                    מפה אתה שולט ביכולת לחסום משתמשים, לצפות בצ׳אטים מדווחים,
                    ולאפשר דיווחים מהמשתמשים כלפי מעלה.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl bg-white/90 dark:bg-neutral-950/70 border border-violet-200/60 dark:border-violet-900/60 px-3 py-2 text-xs sm:text-sm">
                  <div>
                    <div className="font-medium">כניסה לפרופיל משתמש</div>
                    <div className="opacity-70 text-[11px]">
                      מאפשר לאדמין לפתוח פרופיל משתמש מלא (כולל דוחות וסטטוס).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!presence.allowProfilePeek}
                    onChange={(e) =>
                      save({ allowProfilePeek: e.target.checked })
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl bg-white/90 dark:bg-neutral-950/70 border border-violet-200/60 dark:border-violet-900/60 px-3 py-2 text-xs sm:text-sm">
                  <div>
                    <div className="font-medium">צפייה בצ׳אטים מדווחים</div>
                    <div className="opacity-70 text-[11px]">
                      מאפשר לפתוח לוג צ׳אטים רק כשיש דיווח / חשד להפרה.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!presence.allowChatAudit}
                    onChange={(e) => save({ allowChatAudit: e.target.checked })}
                  />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl bg-white/90 dark:bg-neutral-950/70 border border-violet-200/60 dark:border-violet-900/60 px-3 py-2 text-xs sm:text-sm">
                  <div>
                    <div className="font-medium">כפתור “דווח / תלונה”</div>
                    <div className="opacity-70 text-[11px]">
                      כפתור דיווח בפרופילים וצ׳אטים – נכנס לתור הטיפול של
                      האדמינים.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!presence.allowUserReports}
                    onChange={(e) =>
                      save({ allowUserReports: e.target.checked })
                    }
                  />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl bg-white/90 dark:bg-neutral-950/70 border border-violet-200/60 dark:border-violet-900/60 px-3 py-2 text-xs sm:text-sm">
                  <div>
                    <div className="font-medium">סימון אוטומטי של חשודים</div>
                    <div className="opacity-70 text-[11px]">
                      מזהה ספאם / שליחת לינקים מסוכנים ומסמן משתמשים לבדיקה.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!presence.autoFlagSuspicious}
                    onChange={(e) =>
                      save({ autoFlagSuspicious: e.target.checked })
                    }
                  />
                </label>
              </div>
            </section>
          </div>

          {/* צד ימין – קיצורי דרך וניהול */}
          <aside className="space-y-4">
            {/* קיצורי דרך לניהול */}
            <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧭</span>
                  <h2 className="font-semibold text-base">ניווט מהיר לאדמין</h2>
                </div>
                <span className="text-[11px] opacity-60">
                  קישורים – תוכל להתאים את הנתיבים בקוד
                </span>
              </div>

              <div className="grid gap-2 text-sm">
                <a
                  href="/admin/users"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <div>
                      <div className="font-medium">ניהול משתמשים</div>
                      <div className="text-[11px] opacity-70">
                        חיפוש, חסימה, פתיחת פרופיל, סטטוס מנוי.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-60">פתח</span>
                </a>

                <a
                  href="/admin/reports"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>🚨</span>
                    <div>
                      <div className="font-medium">תלונות / דיווחים</div>
                      <div className="text-[11px] opacity-70">
                        צפייה, מיון וסגירה של תלונות משתמשים.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-60">פתח</span>
                </a>

                <a
                  href="/admin/chat-monitor"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>💬</span>
                    <div>
                      <div className="font-medium">צ׳אטים / חדרים</div>
                      <div className="text-[11px] opacity-70">
                        כניסה לצ׳אטים מדווחים, הקפאה וחסימה.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-60">פתח</span>
                </a>

                <a
                  href="/admin/logs"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>📜</span>
                    <div>
                      <div className="font-medium">יומן מערכת</div>
                      <div className="text-[11px] opacity-70">
                        לוג פעולות אדמין, חסימות ושינויים חשובים.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs opacity-60">פתח</span>
                </a>
              </div>
            </section>

            {/* סיכום מהיר */}
            <section className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-sky-950/60 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span>📊</span>
                <div className="font-semibold">סטטוס מהיר</div>
              </div>
              <ul className="space-y-1 ps-4 list-disc">
                <li>
                  נוכחות בזמן אמת:{" "}
                  <strong>{presence.enabled ? "פעילה" : "כבויה"}</strong>
                </li>
                <li>
                  דרישת מנוי ל־“מי סביבי”:{" "}
                  <strong>{presence.requiredTier || "free"}</strong>
                </li>
                <li>
                  מודרציה:{" "}
                  <strong>
                    {presence.allowUserReports || presence.allowChatAudit
                      ? "כללי בטיחות מופעלים"
                      : "כמעט כבוי – שקול להפעיל דיווחים"}
                  </strong>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
