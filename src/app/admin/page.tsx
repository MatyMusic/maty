// src/app/admin/page.tsx
"use client";

/**
 * דף בית אדמין מרכזי (MASTER ADMIN DASHBOARD)
 *
 * מטרות:
 * - נקודת כניסה אחת לכל הניהול של MATY (Music / Date / Club / Jam / Fit / Gallery / Nigunim / וכו׳)
 * - תצוגת סטטוס כללית (משתמשים, פוסטים, שירים, מצבים)
 * - קיצורי דרך מהירים לאיזורים קריטיים (אישורי צ׳אטים, דיווחים, פרסומות, חדרים חיים)
 * - מקום לעתיד: שליטה האם האתר חי / תחזוקה, הודעות מערכת, שליחת מיילים/נוטיפיקציות
 *
 * הערה:
 * - הקריאות ל־/api/admin/status וכו׳ עטופות ב־try/catch – אם ה־API לא מחזיר בדיוק
 *   את המבנה, הדף עדיין יעבוד ופשוט יציג N/A.
 */

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  CloudLightning,
  ExternalLink,
  Flame,
  Globe2,
  Heart,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  MonitorPlay,
  Music2,
  Radio,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type AdminStatus = {
  ok?: boolean;
  isAdmin?: boolean;
  siteOnline?: boolean;

  totalUsers?: number;
  totalMusicTracks?: number;
  totalNigunim?: number;
  totalClubPosts?: number;
  totalDateProfiles?: number;
  totalFitGroups?: number;

  // כל שדה נוסף מה-API ייכנס פה כ- any
  [key: string]: any;
};

type QuickLink = {
  label: string;
  href: string;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
};

type Section = {
  title: string;
  subtitle?: string;
  links: QuickLink[];
};

const mainSections: Section[] = [
  {
    title: "מערכת משתמשים והרשאות",
    subtitle: "ניהול משתמשים, אדמינים, חסומים והרשאות מתקדמות",
    links: [
      {
        label: "משתמשי המערכת",
        href: "/admin/users",
        description:
          "רשימת כל המשתמשים, חיפוש לפי אימייל / ID, ניהול סטטוסים ותפקידים.",
        icon: Users,
      },
      {
        label: "ניהול לקוחות / Customers",
        href: "/admin/customers",
        description:
          "לקוחות משלמים, תאריך תחילת מנוי, פרטי חיוב וקישורים להזמנות.",
        icon: Star,
      },
      {
        label: "אדמין – זמינות והזמנות",
        href: "/admin/availability",
        description: "חלונות זמינות, חסימות, ויצירת 'הולדים' ליומן.",
        icon: Calendar,
      },
      {
        label: "Audit / לוגים",
        href: "/admin/audit",
        description: "עקיבת פעולות אדמין/משתמשים, לוגים חשובים.",
        icon: Activity,
      },
    ],
  },
  {
    title: "MUSIC & NIGUNIM",
    subtitle: "ניהול שירים, פלייליסטים, ניגונים ותקשורת מוזיקלית",
    links: [
      {
        label: "ניהול שירים (Songs DB)",
        href: "/admin/songs",
        description: "טבלת שירים, שם, אמן, קטגוריה, קישורי אודיו ותיוגים.",
        icon: Music2,
      },
      {
        label: "ייבוא שירים / Import",
        href: "/admin/songs/import",
        description: "ייבוא קבצים/שורות שיר, עיבוד אוטומטי.",
        icon: CloudLightning,
      },
      {
        label: "Tracks – מאגר טראקים",
        href: "/admin/tracks",
        description: "ניהול טראקים מלא: אודיו, קאבר, Featured, Published.",
        icon: Radio,
      },
      {
        label: "NIGUNIM – העלאת ניגונים",
        href: "/admin/nigunim/upload",
        description: "ניהול ניגונים (חב״ד ועוד), העלאת קבצים ומיפוי.",
        icon: Flame,
      },
      {
        label: "מדיה – Cloudinary / קבצי מדיה",
        href: "/admin/media",
        description: "כל המדיה שהועלתה: תמונות, וידאו, אודיו.",
        icon: Layers,
      },
    ],
  },
  {
    title: "CLUB / JAM / COMMUNITY",
    subtitle: "פיד, לייבים, ג׳אמים, אישורי פוסטים וחדרים",
    links: [
      {
        label: "CLUB – דשבורד וסטטיסטיקות",
        href: "/admin/club/dashboard",
        description: "נתוני פוסטים, מעורבות, מתנות, תנועת משתמשים.",
        icon: BarChart3,
      },
      {
        label: "CLUB – פוסטים ודיווחים",
        href: "/admin/club/posts",
        description: "ניהול הפיד, מחיקות, הקפאה, הצמדת פוסטים.",
        icon: MessageCircle,
      },
      {
        label: "CLUB – אישורי תוכן / Moderation",
        href: "/admin/club/moderation",
        description: "תוכן שדורש אישור, פוסטים בעייתיים, צנזורה.",
        icon: ShieldCheck,
      },
      {
        label: "CLUB – פרומואים / Promotions",
        href: "/admin/club/promotions",
        description: "באנרים פרסומיים, קידומים, מבצעים בפיד.",
        icon: Star,
      },
      {
        label: "JAM – קבוצות ג׳אם",
        href: "/admin/jam",
        description: "ניהול קבוצות ג׳אם, אישורי הצטרפות, מעקב פעילות.",
        icon: Music2,
      },
      {
        label: "JAM – אישורים / Approvals",
        href: "/admin/jam/approvals",
        description: "בקשות להצטרפות, אישורים/דחיות.",
        icon: CheckCircle2,
      },
      {
        label: "JAM – דיווחים / Reports",
        href: "/admin/jam/reports",
        description: "דיווחי משתמשים על בעיות, חוסר התאמה וכד'.",
        icon: AlertTriangle,
      },
      {
        label: "COMMUNITY – Farbrengen",
        href: "/(community)/farbrengen",
        description: "חדרי התוועדות, מעקב אחרי משתמשים בחדרים.",
        icon: MonitorPlay,
      },
    ],
  },
  {
    title: "DATE / FIT / SOCIAL",
    subtitle: "שידוכים, כושר, קבוצות חברתיות",
    links: [
      {
        label: "MATY-DATE – אדמין",
        href: "/admin/date",
        description: "סקירה כללית על פרופילי דייט, סטטוסים, חבילות.",
        icon: Heart,
      },
      {
        label: "DATE – משתמשים ותיקים",
        href: "/admin/date/users",
        description: "רשימת משתמשי דייט, ניהול ידני.",
        icon: Users,
      },
      {
        label: "DATE – דיווחים",
        href: "/admin/date/reports",
        description: "התנהגות בעייתית, דיווחי משתמשים, חסימות.",
        icon: AlertTriangle,
      },
      {
        label: "FIT – דשבורד",
        href: "/admin/fit",
        description: "קבוצות כושר, אימונים, שותפים וסטטוסים.",
        icon: Activity,
      },
      {
        label: "FIT – תרגילים",
        href: "/admin/fit/exercises",
        description: "ניהול מאגר תרגילים, קטגוריות, ציוד.",
        icon: Activity, // השתמשתי באייקון קיים
      },
      {
        label: "FIT – קבוצות",
        href: "/admin/fit/groups",
        description: "קבוצות, רמות, אחראים.",
        icon: Users,
      },
    ],
  },
  {
    title: "GALERY / EVENTS / SITE",
    subtitle: "גלריה, אירועים, הגדרות אתר ותשלומים",
    links: [
      {
        label: "גלריית תמונות / וידאו",
        href: "/admin/gallery",
        description: "ניהול המדיה המוצגת ללקוחות (תצוגה קדמית).",
        icon: ImageIcon,
      },
      {
        label: "אירועים / BOOKINGS",
        href: "/admin/bookings",
        description: "הזמנות להופעות, מצב תשלום, חשבוניות.",
        icon: Calendar,
      },
      {
        label: "לוח זמנים / Schedule",
        href: "/admin/schedule",
        description: "תצוגת יומן, הופעות, שיעורים, זמנים חשובים.",
        icon: Calendar,
      },
      {
        label: "Promotions – כללי האתר",
        href: "/admin/promotions",
        description: "קידומים כלליים באתר, באנרים, קמפיינים.",
        icon: Flame,
      },
      {
        label: "דיווחים / Reports כלליים",
        href: "/admin/reports",
        description: "בדיקות מערכתיות, דיווחים מרוכזים.",
        icon: AlertTriangle,
      },
      {
        label: "הגדרות אתר / Settings",
        href: "/admin/settings",
        description: "לוגו, צבעי ברירת מחדל, שפות, אפשרויות כלליות.",
        icon: Settings,
      },
    ],
  },
];

const quickRooms: QuickLink[] = [
  {
    label: "ניהול חדרי CLUB LIVE",
    href: "/admin/club",
    description: "לחץ כדי לעבור לדשבורד לייבים, חדרים ומצבי שידור.",
    icon: Video,
  },
  {
    label: "RTC / שיחות וידאו",
    href: "/admin/club/dashboard",
    description: "לוחות בקרה לשיחות 1 על 1, בקשות נכנסות וכו'.",
    icon: MonitorPlay,
  },
  {
    label: "התראות CLUB / DATE / JAM",
    href: "/admin/club/reports",
    description: "מקום לריכוז התראות ותקלות (לבנות בהמשך).",
    icon: Bell,
  },
];

const maintenanceToggles = [
  {
    key: "siteOnline",
    label: "האתר פעיל לציבור",
    description:
      "כיבוי מיידי של האתר לכולם (חוץ מאדמינים). מצב תחזוקה – רק הודעה קצרה.",
  },
  {
    key: "clubOpen",
    label: "MATY-CLUB פתוח",
    description: "אפשר לסגור זמנית את ה-CLUB (פיד, פוסטים, לייבים).",
  },
  {
    key: "dateOpen",
    label: "MATY-DATE פתוח",
    description: "השבתת זמנית של מערכת הדייטינג, למשל לעומס גבוה.",
  },
  {
    key: "musicOnline",
    label: "נגן MATY-MUSIC זמין",
    description: "כיבוי זמני של נגן המוזיקה – לדוגמה בזמן תחזוקת DB.",
  },
] as const;

type ToggleKey = (typeof maintenanceToggles)[number]["key"];

export default function AdminHomePage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<AdminStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState(false);
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null);

  const [toggles, setToggles] = React.useState<Record<ToggleKey, boolean>>({
    siteOnline: true,
    clubOpen: true,
    dateOpen: true,
    musicOnline: true,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        setLoadingStatus(true);
        setErrorStatus(null);

        const res = await fetch("/api/admin/status", { method: "GET" }).catch(
          () => null,
        );
        if (!res || !res.ok) {
          if (!cancelled) setStatus(null);
          return;
        }

        const json = (await res.json()) as AdminStatus;
        if (!cancelled) {
          setStatus(json);

          if (typeof json.siteOnline === "boolean") {
            setToggles((prev) => ({ ...prev, siteOnline: json.siteOnline }));
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorStatus(err?.message || "שגיאה בקריאת סטטוס אדמין");
        }
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleSwitch(key: ToggleKey) {
    setToggles((prev) => {
      const next = !prev[key];
      // בעתיד לחבר ל־API אמיתי
      return { ...prev, [key]: next };
    });
  }

  const siteOnline = toggles.siteOnline;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:py-10">
        {/* HEADER */}
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 shadow-[0_18px_80px_rgba(15,23,42,.85)] md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              <span>MATY MASTER ADMIN</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              פאנל ניהול מרכזי – כל השליטה בידיים שלך
            </h1>
            <p className="text-xs text-slate-300">
              מפה אתה שולט בכל המודולים: משתמשים, מוזיקה, CLUB, DATE, JAM, FIT,
              גלריה, פרסומות, הגדרות ואת מצב האתר (חי / תחזוקה).
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5">
              <span
                className={
                  "flex h-2 w-2 rounded-full " +
                  (siteOnline ? "bg-emerald-400" : "bg-amber-400 animate-pulse")
                }
              />
              <span>
                מצב אתר:{" "}
                <span className="font-semibold">
                  {siteOnline ? "האתר חי ופתוח" : "מצב תחזוקה / סגור לציבור"}
                </span>
              </span>
            </div>
            {loadingStatus && (
              <div className="text-[11px] text-slate-400">
                טוען נתוני סטטוס מערכת...
              </div>
            )}
            {errorStatus && (
              <div className="text-[11px] text-amber-300">
                ⚠ {errorStatus} (הדף ימשיך לעבוד כרגיל)
              </div>
            )}
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200 hover:border-emerald-400/70 hover:text-emerald-100"
            >
              <ExternalLink className="h-3 w-3" />
              רענון נתונים
            </button>
          </div>
        </header>

        {/* TOP ROW: STATS + GLOBAL CONTROLS */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* סטטיסטיקות כלליות */}
          <section className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-50">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              תמונת מצב כללית
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <StatBox
                label="משתמשים רשומים"
                value={
                  status?.totalUsers !== undefined ? status.totalUsers : "N/A"
                }
                hint="שילוב של MUSIC/CLUB/DATE/FIT"
              />
              <StatBox
                label="שירים / טראקים"
                value={
                  status?.totalMusicTracks !== undefined
                    ? status.totalMusicTracks
                    : "N/A"
                }
                hint="Tracks / Songs / Nigunim"
              />
              <StatBox
                label="פוסטים ב־CLUB"
                value={
                  status?.totalClubPosts !== undefined
                    ? status.totalClubPosts
                    : "N/A"
                }
                hint="פוסטים חיים בפיד הראשי"
              />
            </div>
          </section>

          {/* טוגלים גלובליים */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              שליטה גלובלית (מצב מערכת)
            </h2>
            <p className="mb-2 text-[11px] text-slate-300">
              כרגע הטוגלים עובדים בצד לקוח בלבד. בהמשך אפשר לחבר אותם ל־API
              אמיתי כדי לשלוט דינמית באתר.
            </p>
            <div className="space-y-2">
              {maintenanceToggles.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleSwitch(item.key)}
                  className="flex w-full items-start justify-between rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-left hover:border-emerald-400/70"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-slate-50">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.description}
                    </div>
                  </div>
                  <div
                    className={
                      "mt-1 inline-flex h-5 w-10 items-center rounded-full px-1 " +
                      (toggles[item.key]
                        ? "justify-end bg-emerald-500/70"
                        : "justify-start bg-slate-600")
                    }
                  >
                    <span className="h-3.5 w-3.5 rounded-full bg-slate-950" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* QUICK ROOMS / LIVE / ALERTS */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-50">
            <Video className="h-4 w-4 text-red-400" />
            חדרים חיים / צ׳אטים / התראות
          </h2>
          <div className="grid gap-3 md:grid-cols-3 text-xs">
            {quickRooms.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-950/80 p-3 hover:border-emerald-400/70 hover:bg-slate-900"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-slate-200 group-hover:text-emerald-300" />
                  <div className="font-semibold text-slate-50">
                    {item.label}
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {item.description}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-300">
                  <span>פתח פאנל</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* MAIN SECTIONS GRID */}
        <section className="space-y-4">
          {mainSections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
            >
              <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p className="text-[11px] text-slate-400">
                      {section.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-xs">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-950/80 p-3 hover:border-emerald-400/70 hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <link.icon className="h-4 w-4 text-slate-200 group-hover:text-emerald-300" />
                      <div className="font-semibold text-slate-50">
                        {link.label}
                      </div>
                    </div>
                    {link.description && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {link.description}
                      </p>
                    )}
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-300">
                      <span>כניסה למודול</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

/* ───────── קומפוננטת סטטיסטיקה קטנה ───────── */

type StatBoxProps = {
  label: string;
  value: number | string | null | undefined;
  hint?: string;
};

function StatBox({ label, value, hint }: StatBoxProps) {
  const display =
    value === null || value === undefined || value === ""
      ? "N/A"
      : value.toString();

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-emerald-300">
        {display}
      </div>
      {hint && <div className="mt-1 text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
}
