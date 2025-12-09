// src/app/admin/settings/SettingsForm.tsx
"use client";

import type { AppSettings } from "@/lib/admin-settings";
import * as React from "react";
// מעבר למערכת ה-toast החדשה, במקום react-hot-toast
import { useToast } from "@/contexts/toast";

/* ---------------- טיפוסים מורחבים להגדרות מתקדמות ---------------- */

type ExtendedSettings = AppSettings & {
  marketing: {
    enablePromoBanners: boolean;
    homepageBannerText: string;
    homepageBannerUrl?: string;
    referralEnabled: boolean;
    referralBonusText?: string;
  };
  coupons: {
    enabled: boolean;
    allowStacking: boolean;
    maxGlobalDiscountPct: number; // תקרה לבלאגן 🙂
    lastManualCouponNote?: string;
  };
  links: {
    enableSmartLinks: boolean;
    defaultUtmSource?: string;
    allowCustomDomains: boolean;
    trackClicks: boolean;
  };
  moderation: {
    enableReports: boolean;
    autoBlockOnXReports?: number | null;
    autoMuteHoursOnAbuse?: number | null;
    notifyAdminOnNewReport: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    weeklyDigestEnabled: boolean;
    adminDigestToEmail?: string;
  };
  experiments: {
    enableABTesting: boolean;
    stickyExperimentForUser: boolean;
    notes?: string;
  };
};

/* ---------------- עזר: השלמת ברירת מחדל לשדות חדשים ---------------- */

function withDefaults(initial: AppSettings): ExtendedSettings {
  const any = initial as any;

  return {
    ...initial,
    marketing: {
      enablePromoBanners: any.marketing?.enablePromoBanners ?? false,
      homepageBannerText:
        any.marketing?.homepageBannerText ??
        "💿 הצטרף ל-MATY PRO וקבל גישה מלאה!",
      homepageBannerUrl: any.marketing?.homepageBannerUrl ?? "/pricing",
      referralEnabled: any.marketing?.referralEnabled ?? false,
      referralBonusText:
        any.marketing?.referralBonusText ?? "חבר מביא חבר – קרדיט לשניכם.",
    },
    coupons: {
      enabled: any.coupons?.enabled ?? false,
      allowStacking: any.coupons?.allowStacking ?? false,
      maxGlobalDiscountPct: any.coupons?.maxGlobalDiscountPct ?? 50,
      lastManualCouponNote: any.coupons?.lastManualCouponNote ?? "",
    },
    links: {
      enableSmartLinks: any.links?.enableSmartLinks ?? true,
      defaultUtmSource: any.links?.defaultUtmSource ?? "maty-music",
      allowCustomDomains: any.links?.allowCustomDomains ?? false,
      trackClicks: any.links?.trackClicks ?? true,
    },
    moderation: {
      enableReports: any.moderation?.enableReports ?? true,
      autoBlockOnXReports: any.moderation?.autoBlockOnXReports ?? null,
      autoMuteHoursOnAbuse: any.moderation?.autoMuteHoursOnAbuse ?? null,
      notifyAdminOnNewReport: any.moderation?.notifyAdminOnNewReport ?? true,
    },
    notifications: {
      emailEnabled: any.notifications?.emailEnabled ?? true,
      pushEnabled: any.notifications?.pushEnabled ?? true,
      weeklyDigestEnabled: any.notifications?.weeklyDigestEnabled ?? true,
      adminDigestToEmail: any.notifications?.adminDigestToEmail ?? "",
    },
    experiments: {
      enableABTesting: any.experiments?.enableABTesting ?? false,
      stickyExperimentForUser: any.experiments?.stickyExperimentForUser ?? true,
      notes: any.experiments?.notes ?? "",
    },
  };
}

/* ---------------- קומפוננטת טופס ההגדרות ---------------- */

export default function SettingsForm({ initial }: { initial: AppSettings }) {
  const { push } = useToast();

  const [data, setData] = React.useState<ExtendedSettings>(() =>
    withDefaults(initial),
  );
  const [saving, setSaving] = React.useState(false);

  // עזר כללי לעדכון חתיכה מתוך ה־settings
  function setSection<T extends keyof ExtendedSettings>(
    key: T,
    patch: Partial<ExtendedSettings[T]>,
  ) {
    setData((d) => ({
      ...d,
      [key]: {
        ...(d as any)[key],
        ...patch,
      },
    }));
  }

  // פונקציה ספציפית ל־billing.minPlanFor (כמו שהיה לך)
  function setPlan(
    area: keyof AppSettings["billing"]["minPlanFor"],
    v: "free" | "plus" | "pro",
  ) {
    setData((d) => ({
      ...d,
      billing: {
        ...d.billing,
        minPlanFor: { ...d.billing.minPlanFor, [area]: v },
      },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // שולחים את כל האובייקט כולל השדות החדשים –
        // בצד שרת תעדכן את הטיפוס AppSettings אם צריך.
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setData(withDefaults(j.settings));
      push("success", "ההגדרות נשמרו בהצלחה ✨", "שמור");
    } catch (e: any) {
      push("error", e?.message || "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="grid gap-6"
      dir="rtl"
    >
      {/* כותרת כללית + אינפו קצר */}
      <header className="mm-card p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold">הגדרות מערכת · MATY ADMIN</h1>
          <p className="text-xs opacity-70 mt-1">
            שליטה מרכזית על הרשאות, תשלומים, שיווק, קופונים, מודרציה וניסויים.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="submit"
            className="mm-btn mm-btn-primary"
            disabled={saving}
          >
            {saving ? "שומר…" : "💾 שמור הגדרות"}
          </button>
          <span className="opacity-70">
            עדכון אחרון: {new Date(data.updatedAt).toLocaleString()}
          </span>
        </div>
      </header>

      {/* ========== 1. הסכמות / Terms ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">הסכמות / תקנון</h2>
        <p className="text-xs opacity-70 mb-2">
          שליטה בהצגת מסך הסכמה/תקנון לפני שימוש ב-MATY / MATY-DATE.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.consent.enforceBeforeAuth}
            onChange={(e) =>
              setSection("consent", {
                enforceBeforeAuth: e.target.checked,
              })
            }
          />
          לחייב חתימה לפני עמודי <code>/auth</code>
        </label>

        <label className="flex items-center gap-2 mt-1 text-sm">
          <input
            type="checkbox"
            checked={data.consent.requireForDate}
            onChange={(e) =>
              setSection("consent", {
                requireForDate: e.target.checked,
              })
            }
          />
          לחייב חתימה לכל <code>/date/**</code> (MATY-DATE)
        </label>

        <div className="mt-2 space-y-1">
          <label className="text-sm">גרסת תקנון (כדי לכפות חתימה מחדש):</label>
          <input
            className="mm-input w-40"
            value={data.consent.version}
            onChange={(e) => setSection("consent", { version: e.target.value })}
          />
          <p className="text-[11px] opacity-60">
            כשאתה מעלה גרסה (למשל <code>v2</code> → <code>v3</code>) כל המשתמשים
            יתבקשו לחתום שוב.
          </p>
        </div>
      </section>

      {/* ========== 2. התחברות / Auth ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">התחברות / Auth</h2>
        <p className="text-xs opacity-70 mb-2">
          האם לאפשר גלישה חופשית, או להכריח התחברות לאזורים מסוימים.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.auth.requireForDate}
            onChange={(e) =>
              setSection("auth", { requireForDate: e.target.checked })
            }
          />
          לחייב התחברות לכל <code>/date/**</code>
        </label>

        {/* אפשר להוסיף שדות נוספים ב־auth אם תרחיב את AppSettings בצד שרת */}
      </section>

      {/* ========== 3. גבייה / Billing ========== */}
      <section className="mm-card p-4 space-y-4">
        <h2 className="font-semibold mb-1">גבייה / מנויים</h2>
        <p className="text-xs opacity-70 mb-2">
          הפעלת מערך גבייה, ספק תשלום ומינימום חבילה עבור פיצ׳רים שונים.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.billing.enabled}
            onChange={(e) =>
              setSection("billing", { enabled: e.target.checked })
            }
          />
          הפעל גבייה (Stripe / ידני)
        </label>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-sm">ספק גבייה:</span>
          <select
            className="mm-select"
            value={data.billing.provider}
            onChange={(e) =>
              setSection("billing", { provider: e.target.value as any })
            }
          >
            <option value="stripe">Stripe</option>
            <option value="manual">ידני / העברה בנקאית</option>
          </select>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {(
            [
              ["date_profile", "מילוי פרופיל (Date)"],
              ["date_matches", "צפייה בהתאמות"],
              ["date_chat", "צ׳אט היכרויות"],
              ["farbrengen_join", "כניסה להתוועדויות"],
              ["club_post_create", "פרסום פוסט ב-CLUB"],
            ] as const
          ).map(([k, label]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{label}</span>
              <select
                className="mm-select"
                value={data.billing.minPlanFor[k]}
                onChange={(e) => setPlan(k as any, e.target.value as any)}
              >
                <option value="free">Free</option>
                <option value="plus">Plus</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-sm">טקסט שדרוג (מודאל / Popups):</label>
          <textarea
            className="mm-textarea w-full"
            rows={3}
            value={data.billing.upgradeCopy || ""}
            onChange={(e) =>
              setSection("billing", { upgradeCopy: e.target.value })
            }
            placeholder="הצטרף ל־MATY PLUS כדי לפתוח את כל ההתאמות, הצ׳אטים ועוד…"
          />
        </div>
      </section>

      {/* ========== 4. דגלים / Flags ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">דגלים / כללים פנימיים</h2>
        <p className="text-xs opacity-70 mb-2">
          חוקים קשיחים לגבי פרופילים, השלמה מינימלית וכו׳.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label>דרישת השלמת פרופיל (%):</label>
          <input
            type="number"
            min={0}
            max={100}
            className="mm-input w-24"
            value={data.flags.requireProfileCompletenessPct}
            onChange={(e) =>
              setSection("flags", {
                requireProfileCompletenessPct: Number(e.target.value || 0),
              })
            }
          />
          <span className="text-xs opacity-60">
            מתחת לערך זה – חלק מהפיצ׳רים (למשל התאמות) יחסמו.
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm mt-1">
          <input
            type="checkbox"
            checked={data.flags.blockUnverifiedAvatars}
            onChange={(e) =>
              setSection("flags", {
                blockUnverifiedAvatars: e.target.checked,
              })
            }
          />
          לחסום פרופילים עם אווטאר לא מאומת (למשל AI, בלי צילום אמיתי)
        </label>
      </section>

      {/* ========== 5. שיווק / Banners / Referral ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">שיווק / באנרים והמלצות</h2>
        <p className="text-xs opacity-70 mb-2">
          שליטה בבאנרים שיווקיים, הפניות חבר-מביא-חבר וקריאה לשדרוג.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.marketing.enablePromoBanners}
            onChange={(e) =>
              setSection("marketing", {
                enablePromoBanners: e.target.checked,
              })
            }
          />
          להציג באנר קידום (למשל בראש דף הבית / MATY-DATE)
        </label>

        <div className="grid md:grid-cols-[2fr_1fr] gap-3 mt-2">
          <div>
            <label className="text-sm">טקסט באנר ראשי:</label>
            <input
              className="mm-input w-full mt-1"
              value={data.marketing.homepageBannerText}
              onChange={(e) =>
                setSection("marketing", {
                  homepageBannerText: e.target.value,
                })
              }
              placeholder="הצטרף עכשיו וקבל חודש ראשון במתנה…"
            />
          </div>
          <div>
            <label className="text-sm">קישור בלחיצה על הבאנר:</label>
            <input
              className="mm-input w-full mt-1"
              value={data.marketing.homepageBannerUrl || ""}
              onChange={(e) =>
                setSection("marketing", {
                  homepageBannerUrl: e.target.value,
                })
              }
              placeholder="/pricing או https://…"
            />
          </div>
        </div>

        <hr className="my-3 opacity-20" />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.marketing.referralEnabled}
            onChange={(e) =>
              setSection("marketing", {
                referralEnabled: e.target.checked,
              })
            }
          />
          להפעיל תוכנית "חבר מביא חבר"
        </label>

        <div className="mt-2">
          <label className="text-sm">טקסט בונוס לחבר-מביא-חבר:</label>
          <textarea
            className="mm-textarea w-full"
            rows={2}
            value={data.marketing.referralBonusText || ""}
            onChange={(e) =>
              setSection("marketing", {
                referralBonusText: e.target.value,
              })
            }
            placeholder="הזמן חבר וקבלו שניכם חודש MATY PLUS ללא עלות…"
          />
        </div>
      </section>

      {/* ========== 6. קופונים / הנחות ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">קופונים / הנחות</h2>
        <p className="text-xs opacity-70 mb-2">
          שליטה גלובלית על הנחות באתר, כולל תקרת הנחה ומדיניות צירוף קופונים.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.coupons.enabled}
            onChange={(e) =>
              setSection("coupons", { enabled: e.target.checked })
            }
          />
          לאפשר שימוש בקודי קופון
        </label>

        <label className="flex items-center gap-2 text-sm mt-1">
          <input
            type="checkbox"
            checked={data.coupons.allowStacking}
            onChange={(e) =>
              setSection("coupons", {
                allowStacking: e.target.checked,
              })
            }
          />
          לאפשר צירוף כמה קופונים יחד (stacking)
        </label>

        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
          <span>תקרת הנחה גלובלית (%):</span>
          <input
            type="number"
            min={0}
            max={100}
            className="mm-input w-20"
            value={data.coupons.maxGlobalDiscountPct}
            onChange={(e) =>
              setSection("coupons", {
                maxGlobalDiscountPct: Number(e.target.value || 0),
              })
            }
          />
          <span className="text-[11px] opacity-60">
            מניעת טעויות – למשל 90% הנחה בטעות…
          </span>
        </div>

        <div className="mt-3">
          <label className="text-sm">
            הערה פנימית (קופון ידני אחרון / מבצע פעיל):
          </label>
          <textarea
            className="mm-textarea w-full"
            rows={2}
            value={data.coupons.lastManualCouponNote || ""}
            onChange={(e) =>
              setSection("coupons", {
                lastManualCouponNote: e.target.value,
              })
            }
            placeholder="לדוגמה: קוד BLACKFRIDAY24 פעיל עד סוף נובמבר…"
          />
        </div>
      </section>

      {/* ========== 7. לינקים חכמים / UTM ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">לינקים חכמים / UTM</h2>
        <p className="text-xs opacity-70 mb-2">
          ניהול לינקים שיווקיים, מעקב קליקים ו-UTM ברירת מחדל.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.links.enableSmartLinks}
            onChange={(e) =>
              setSection("links", {
                enableSmartLinks: e.target.checked,
              })
            }
          />
          להפעיל מערך לינקים חכמים (קיצור לינקים, UTM אוטומטי)
        </label>

        <label className="flex items-center gap-2 text-sm mt-1">
          <input
            type="checkbox"
            checked={data.links.trackClicks}
            onChange={(e) =>
              setSection("links", {
                trackClicks: e.target.checked,
              })
            }
          />
          לעקוב אחרי קליקים (לסטטיסטיקות פנימיות)
        </label>

        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <div>
            <label className="text-sm">UTM Source ברירת מחדל:</label>
            <input
              className="mm-input w-full mt-1"
              value={data.links.defaultUtmSource || ""}
              onChange={(e) =>
                setSection("links", {
                  defaultUtmSource: e.target.value,
                })
              }
              placeholder="maty-music / maty-date / campaign-x"
            />
          </div>
          <div className="flex items-center gap-2 mt-5 md:mt-0 text-sm">
            <input
              type="checkbox"
              checked={data.links.allowCustomDomains}
              onChange={(e) =>
                setSection("links", {
                  allowCustomDomains: e.target.checked,
                })
              }
            />
            <span>לאפשר דומיינים מותאמים (מתקדם / דורש הגדרה חיצונית)</span>
          </div>
        </div>
      </section>

      {/* ========== 8. מודרציה / תלונות / חסימות ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">מודרציה / תלונות</h2>
        <p className="text-xs opacity-70 mb-2">
          הגדרות הקשורות לדף <code>/admin/reports</code> ולניהול התנהגות
          משתמשים.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.moderation.enableReports}
            onChange={(e) =>
              setSection("moderation", {
                enableReports: e.target.checked,
              })
            }
          />
          לאפשר מערכת דיווח (כפתור "🚩 דווח" בפרופילים וצ׳אטים)
        </label>

        <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span>חסימה אוטומטית אחרי:</span>
            <input
              type="number"
              min={0}
              className="mm-input w-16"
              value={data.moderation.autoBlockOnXReports ?? 0}
              onChange={(e) =>
                setSection("moderation", {
                  autoBlockOnXReports: Number(e.target.value || 0) || null,
                })
              }
            />
            <span>תלונות מאושרות</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>השתקה אוטומטית (שעות) על abuse:</span>
            <input
              type="number"
              min={0}
              className="mm-input w-16"
              value={data.moderation.autoMuteHoursOnAbuse ?? 0}
              onChange={(e) =>
                setSection("moderation", {
                  autoMuteHoursOnAbuse: Number(e.target.value || 0) || null,
                })
              }
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm mt-1">
          <input
            type="checkbox"
            checked={data.moderation.notifyAdminOnNewReport}
            onChange={(e) =>
              setSection("moderation", {
                notifyAdminOnNewReport: e.target.checked,
              })
            }
          />
          לשלוח התראה (מייל / Push אדמין) על כל תלונה חדשה
        </label>
      </section>

      {/* ========== 9. נוטיפיקציות / מייל / Push ========== */}
      <section className="mm-card p-4 space-y-3">
        <h2 className="font-semibold mb-1">נוטיפיקציות / תקשורת</h2>
        <p className="text-xs opacity-70 mb-2">
          שליטה גלובלית על מיילים, Push ודוחות תקופתיים למנהלים.
        </p>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.notifications.emailEnabled}
              onChange={(e) =>
                setSection("notifications", {
                  emailEnabled: e.target.checked,
                })
              }
            />
            לשלוח התראות במייל למשתמשים
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.notifications.pushEnabled}
              onChange={(e) =>
                setSection("notifications", {
                  pushEnabled: e.target.checked,
                })
              }
            />
            לאפשר Push (דפדפן / מובייל)
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.notifications.weeklyDigestEnabled}
              onChange={(e) =>
                setSection("notifications", {
                  weeklyDigestEnabled: e.target.checked,
                })
              }
            />
            לשלוח סיכום שבועי (Weekly Digest)
          </label>
        </div>

        <div className="mt-2">
          <label className="text-sm">
            כתובת מייל לקבלת דוח אדמין (תלונות, רכישות, משתמשים חדשים):
          </label>
          <input
            className="mm-input w-full mt-1"
            value={data.notifications.adminDigestToEmail || ""}
            onChange={(e) =>
              setSection("notifications", {
                adminDigestToEmail: e.target.value,
              })
            }
            placeholder="admin@maty-music.com"
          />
          <p className="text-[11px] opacity-60 mt-1">
            הדוח עצמו יישלח ע״י Cron/Job בצד שרת – כאן רק מגדירים לאן.
          </p>
        </div>
      </section>

      {/* ========== 10. ניסויים / A/B ========== */}
      <section className="mm-card p-4 space-y-3 mb-4">
        <h2 className="font-semibold mb-1">ניסויים / A/B Testing</h2>
        <p className="text-xs opacity-70 mb-2">
          שליטה בסיסית בניסויי UI/UX (למשל גרסת נגן חדשה, עמוד הרשמה אחר).
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.experiments.enableABTesting}
            onChange={(e) =>
              setSection("experiments", {
                enableABTesting: e.target.checked,
              })
            }
          />
          לאפשר ניסויי A/B באתר
        </label>

        <label className="flex items-center gap-2 text-sm mt-1">
          <input
            type="checkbox"
            checked={data.experiments.stickyExperimentForUser}
            onChange={(e) =>
              setSection("experiments", {
                stickyExperimentForUser: e.target.checked,
              })
            }
          />
          להצמיד כל משתמש לגרסה שנבחרה לו (לא להחליף כל רענון)
        </label>

        <div className="mt-2">
          <label className="text-sm">הערות / תיאור ניסויים פעילים:</label>
          <textarea
            className="mm-textarea w-full"
            rows={3}
            value={data.experiments.notes || ""}
            onChange={(e) =>
              setSection("experiments", {
                notes: e.target.value,
              })
            }
            placeholder="לדוגמה: ניסוי HEADER_V2 רק ל-10% משתמשים בישראל…"
          />
        </div>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="mm-btn mm-btn-primary"
            disabled={saving}
          >
            {saving ? "שומר…" : "💾 שמור הכל"}
          </button>
        </div>
      </section>
    </form>
  );
}
