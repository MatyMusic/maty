// src/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import type { AppSettings } from "@/lib/admin-settings";
import { toast } from "react-hot-toast";

type Plan = "free" | "plus" | "pro";

export default function AdminSettingsPage() {
  const [data, setData] = React.useState<AppSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/settings", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j.settings);
      } catch (e: any) {
        setErr(e?.message || "שגיאה בטעינת הגדרות");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j.settings);
      toast.success("נשמר ✨");
    } catch (e: any) {
      toast.error(e?.message || "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof AppSettings>(
    key: K,
    patch: Partial<AppSettings[K]>,
  ) {
    setData((d) =>
      d
        ? ({
            ...d,
            [key]: { ...(d as any)[key], ...(patch as any) },
          } as AppSettings)
        : d,
    );
  }

  function setPlan(area: keyof AppSettings["billing"]["minPlanFor"], v: Plan) {
    setData((d) =>
      d
        ? ({
            ...d,
            billing: {
              ...d.billing,
              minPlanFor: { ...d.billing.minPlanFor, [area]: v },
            },
          } as AppSettings)
        : d,
    );
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6" dir="rtl">
        טוען…
      </main>
    );
  }
  if (err) {
    return (
      <main className="max-w-4xl mx-auto p-6" dir="rtl">
        <div className="text-rose-600">{err}</div>
      </main>
    );
  }
  if (!data) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">הגדרות · Admin</h1>
          <p className="text-sm opacity-70">
            עדכון אחרון: {new Date(data.updatedAt).toLocaleString()}
          </p>
        </div>
        <button
          className="mm-btn mm-btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? "שומר…" : "שמור"}
        </button>
      </header>

      {/* פרטי עסק */}
      <section className="mm-card p-4 grid gap-3">
        <h2 className="font-semibold">פרטי עסק</h2>
        <label className="grid gap-1">
          <span className="text-sm">שם העסק</span>
          <input
            className="mm-input"
            value={data.brand.orgName}
            onChange={(e) => set("brand", { orgName: e.target.value })}
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Invoice Prefix</span>
            <input
              className="mm-input"
              value={data.brand.invoicePrefix}
              onChange={(e) =>
                set("brand", { invoicePrefix: e.target.value.toUpperCase() })
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Reply-To לאימיילים</span>
            <input
              className="mm-input input-ltr"
              placeholder="support@example.com"
              value={data.brand.replyToEmail}
              onChange={(e) => set("brand", { replyToEmail: e.target.value })}
            />
          </label>
        </div>
      </section>

      {/* הסכמות */}
      <section className="mm-card p-4 grid gap-3">
        <h2 className="font-semibold">הסכמות</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.consent.enforceBeforeAuth}
            onChange={(e) =>
              set("consent", { enforceBeforeAuth: e.target.checked })
            }
          />
          לחייב חתימה לפני /auth
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.consent.requireForDate}
            onChange={(e) =>
              set("consent", { requireForDate: e.target.checked })
            }
          />
          לחייב חתימה בכל /date/**
        </label>
        <div className="grid sm:grid-cols-[1fr,160px] gap-3">
          <div className="grid gap-1">
            <span className="text-sm">גרסת תקנון</span>
            <input
              className="mm-input"
              value={data.consent.version}
              onChange={(e) => set("consent", { version: e.target.value })}
            />
          </div>
          <div className="text-xs opacity-70 self-end">
            שינוי הערך הזה יחייב חתימה מחדש.
          </div>
        </div>
      </section>

      {/* התחברות */}
      <section className="mm-card p-4 grid gap-3">
        <h2 className="font-semibold">כניסה</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.auth.requireForDate}
            onChange={(e) => set("auth", { requireForDate: e.target.checked })}
          />
          לחייב התחברות לכל /date/**
        </label>
      </section>

      {/* גבייה */}
      <section className="mm-card p-4 grid gap-3">
        <h2 className="font-semibold">גבייה ותכניות</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.billing.enabled}
            onChange={(e) => set("billing", { enabled: e.target.checked })}
          />
          הפעל גבייה (Stripe/ידני)
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">ספק</span>
            <select
              className="mm-select"
              value={data.billing.provider}
              onChange={(e) =>
                set("billing", { provider: e.target.value as any })
              }
            >
              <option value="stripe">Stripe</option>
              <option value="manual">ידני</option>
            </select>
          </label>
          <div className="grid gap-1">
            <span className="text-sm">טקסט בעמוד שדרוג</span>
            <textarea
              className="mm-textarea"
              rows={2}
              value={data.billing.upgradeCopy || ""}
              onChange={(e) => set("billing", { upgradeCopy: e.target.value })}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {(
            [
              ["date_profile", "מילוי פרופיל (Date)"],
              ["date_matches", "צפייה בהתאמות"],
              ["date_chat", "צ׳אט היכרויות"],
              ["farbrengen_join", "כניסה להתוועדויות"],
              ["club_post_create", "פרסום ב־CLUB"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="grid gap-1">
              <span className="text-sm">{label}</span>
              <select
                className="mm-select"
                value={data.billing.minPlanFor[k]}
                onChange={(e) => setPlan(k as any, e.target.value as Plan)}
              >
                <option value="free">Free</option>
                <option value="plus">Plus</option>
                <option value="pro">Pro</option>
              </select>
            </label>
          ))}
        </div>
      </section>

      {/* דגלים */}
      <section className="mm-card p-4 grid gap-3">
        <h2 className="font-semibold">דגלים</h2>
        <div className="grid sm:grid-cols-[240px,1fr] gap-3 items-center">
          <label className="text-sm">דרישת השלמת פרופיל (%):</label>
          <input
            type="number"
            min={0}
            max={100}
            className="mm-input w-28"
            value={data.flags.requireProfileCompletenessPct}
            onChange={(e) =>
              set("flags", {
                requireProfileCompletenessPct: Number(e.target.value || 0),
              })
            }
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.flags.blockUnverifiedAvatars}
            onChange={(e) =>
              set("flags", { blockUnverifiedAvatars: e.target.checked })
            }
          />
          לחסום פרופילים עם אווטאר לא מאומת
        </label>
      </section>

      <div className="flex items-center gap-2">
        <button
          className="mm-btn"
          onClick={() => {
            // ריענון מהשרת
            setLoading(true);
            fetch("/api/admin/settings", { cache: "no-store" })
              .then((r) => r.json())
              .then((j) => setData(j.settings))
              .finally(() => setLoading(false));
          }}
        >
          טען מחדש
        </button>
        <span className="text-xs opacity-70">
          גרסה: {data.version} · נשמר:{" "}
          {new Date(data.updatedAt).toLocaleString()}
        </span>
      </div>
    </main>
  );
}
