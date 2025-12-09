// src/lib/admin-settings.ts
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";

type PlanKey = "free" | "plus" | "pro";

export type AppSettings = {
  _id?: string; // קבוע "global"
  version: number; // עולה בכל שמירה (לביטול קאש)
  updatedAt: string; // ISO

  /* ---------- מיתוג / חשבוניות ---------- */
  brand: {
    orgName: string; // שם העסק / המוצר
    invoicePrefix: string; // קידומת חשבונית
    replyToEmail: string; // Reply-To לאימיילים
  };

  /* ---------- הסכמות / תקנון ---------- */
  consent: {
    enforceBeforeAuth: boolean; // לחייב הסכמה לפני /auth
    requireForDate: boolean; // לחייב הסכמה עבור /date/**
    version: string; // v1/v2... (כפיית חתימה מחדש)
  };

  /* ---------- התחברות ---------- */
  auth: {
    requireForDate: boolean; // לחייב התחברות עבור /date/**
  };

  /* ---------- גבייה / מנויים ---------- */
  billing: {
    enabled: boolean; // הפעלת גבייה
    provider: "stripe" | "manual";
    minPlanFor: {
      date_profile: PlanKey;
      date_matches: PlanKey;
      date_chat: PlanKey;
      farbrengen_join: PlanKey;
      club_post_create: PlanKey;
    };
    upgradeCopy?: string; // טקסט בעמוד שדרוג
  };

  /* ---------- דגלים כלליים ---------- */
  flags: {
    requireProfileCompletenessPct: number; // 0..100
    blockUnverifiedAvatars: boolean;
  };

  /* ---------- שיווק / באנרים / Referral ---------- */
  marketing: {
    enablePromoBanners: boolean;
    homepageBannerText: string;
    homepageBannerUrl?: string;
    referralEnabled: boolean;
    referralBonusText?: string;
  };

  /* ---------- קופונים / הנחות ---------- */
  coupons: {
    enabled: boolean;
    allowStacking: boolean;
    maxGlobalDiscountPct: number; // תקרת הנחה גלובלית
    lastManualCouponNote?: string;
  };

  /* ---------- לינקים חכמים / UTM ---------- */
  links: {
    enableSmartLinks: boolean;
    defaultUtmSource?: string;
    allowCustomDomains: boolean;
    trackClicks: boolean;
  };

  /* ---------- מודרציה / תלונות / חסימות ---------- */
  moderation: {
    enableReports: boolean;
    autoBlockOnXReports?: number | null;
    autoMuteHoursOnAbuse?: number | null;
    notifyAdminOnNewReport: boolean;
  };

  /* ---------- נוטיפיקציות / תקשורת ---------- */
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    weeklyDigestEnabled: boolean;
    adminDigestToEmail?: string;
  };

  /* ---------- ניסויים / A-B Testing ---------- */
  experiments: {
    enableABTesting: boolean;
    stickyExperimentForUser: boolean;
    notes?: string;
  };
};

const DEFAULTS: AppSettings = {
  _id: "global",
  version: 1,
  updatedAt: new Date().toISOString(),

  brand: {
    orgName: "MATY MUSIC",
    invoicePrefix: "MM",
    replyToEmail: "",
  },

  consent: {
    enforceBeforeAuth: true,
    requireForDate: true,
    version: process.env.NEXT_PUBLIC_CONSENT_VERSION || "v1",
  },

  auth: {
    requireForDate: true,
  },

  billing: {
    enabled: false,
    provider: "stripe",
    minPlanFor: {
      date_profile: "free",
      date_matches: "free",
      date_chat: "plus",
      farbrengen_join: "free",
      club_post_create: "free",
    },
    upgradeCopy:
      "כדי להשתמש בתכונה זו דרוש מנוי פעיל. בחרו תכנית מתאימה והצטרפו.",
  },

  flags: {
    requireProfileCompletenessPct: 0,
    blockUnverifiedAvatars: false,
  },

  marketing: {
    enablePromoBanners: false,
    homepageBannerText: "💿 הצטרף ל-MATY PRO וקבל גישה מלאה לכל הפיצ׳רים!",
    homepageBannerUrl: "/pricing",
    referralEnabled: false,
    referralBonusText: "חבר מביא חבר – קרדיט לשניכם.",
  },

  coupons: {
    enabled: false,
    allowStacking: false,
    maxGlobalDiscountPct: 50,
    lastManualCouponNote: "",
  },

  links: {
    enableSmartLinks: true,
    defaultUtmSource: "maty-music",
    allowCustomDomains: false,
    trackClicks: true,
  },

  moderation: {
    enableReports: true,
    autoBlockOnXReports: null,
    autoMuteHoursOnAbuse: null,
    notifyAdminOnNewReport: true,
  },

  notifications: {
    emailEnabled: true,
    pushEnabled: true,
    weeklyDigestEnabled: true,
    adminDigestToEmail: "",
  },

  experiments: {
    enableABTesting: false,
    stickyExperimentForUser: true,
    notes: "",
  },
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}

async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

/** קאש זעיר בריצה (Node) */
let cache: { at: number; doc: AppSettings } | null = null;
const TTL_MS = 15_000;

export async function getAppSettings(): Promise<AppSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.doc;

  const db = await getDb();
  const C = db.collection("app_settings");
  const found = (await C.findOne({ _id: "global" })) as AppSettings | null;

  // מיזוג חכם עם DEFAULTS כדי לטפל במסמכים ישנים
  const doc: AppSettings = {
    ...DEFAULTS,
    ...(found || {}),

    brand: {
      ...DEFAULTS.brand,
      ...(found?.brand || {}),
    },

    consent: {
      ...DEFAULTS.consent,
      ...(found?.consent || {}),
    },

    auth: {
      ...DEFAULTS.auth,
      ...(found?.auth || {}),
    },

    billing: {
      ...DEFAULTS.billing,
      ...(found?.billing || {}),
      minPlanFor: {
        ...DEFAULTS.billing.minPlanFor,
        ...(found?.billing?.minPlanFor || {}),
      },
    },

    flags: {
      ...DEFAULTS.flags,
      ...(found?.flags || {}),
    },

    marketing: {
      ...DEFAULTS.marketing,
      ...(found?.marketing || {}),
    },

    coupons: {
      ...DEFAULTS.coupons,
      ...(found?.coupons || {}),
    },

    links: {
      ...DEFAULTS.links,
      ...(found?.links || {}),
    },

    moderation: {
      ...DEFAULTS.moderation,
      ...(found?.moderation || {}),
    },

    notifications: {
      ...DEFAULTS.notifications,
      ...(found?.notifications || {}),
    },

    experiments: {
      ...DEFAULTS.experiments,
      ...(found?.experiments || {}),
    },
  };

  cache = { at: Date.now(), doc };
  return doc;
}

export async function saveAppSettings(patch: Partial<AppSettings>) {
  const cur = await getAppSettings();

  const next: AppSettings = {
    ...cur,
    ...patch,

    brand: { ...cur.brand, ...(patch.brand || {}) },

    consent: { ...cur.consent, ...(patch.consent || {}) },

    auth: { ...cur.auth, ...(patch.auth || {}) },

    billing: {
      ...cur.billing,
      ...(patch.billing || {}),
      minPlanFor: {
        ...cur.billing.minPlanFor,
        ...(patch.billing?.minPlanFor || {}),
      },
    },

    flags: { ...cur.flags, ...(patch.flags || {}) },

    marketing: {
      ...cur.marketing,
      ...(patch.marketing || {}),
    },

    coupons: {
      ...cur.coupons,
      ...(patch.coupons || {}),
    },

    links: {
      ...cur.links,
      ...(patch.links || {}),
    },

    moderation: {
      ...cur.moderation,
      ...(patch.moderation || {}),
    },

    notifications: {
      ...cur.notifications,
      ...(patch.notifications || {}),
    },

    experiments: {
      ...cur.experiments,
      ...(patch.experiments || {}),
    },

    version: (cur.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    _id: "global",
  };

  const db = await getDb();
  const C = db.collection("app_settings");
  await C.updateOne({ _id: "global" }, { $set: next }, { upsert: true });
  cache = { at: Date.now(), doc: next };
  return next;
}
