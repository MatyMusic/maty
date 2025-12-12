// src/app/(site)/events/page.tsx

import { EventRequestForm } from "@/components/events/EventRequestForm";
import { EventsDemoPlayer } from "@/components/events/EventsDemoPlayer";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Music4,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "אירועים — MATY-MUSIC | חתונות, בר מצוות והתוועדויות חב״ד",
  description:
    "לוח אירועים חי של MATY-MUSIC בתוך MATY+: חתונות חב״ד, חופות, בר מצוות, התוועדויות ואירועי קהילה. רואים אירועי עבר, תאריכים חמים והזמנת אירוע חדש עם סט שירים מותאם.",
};

/* =======================================================================
 *  DATA TYPES
 * =======================================================================*/

type EventCategory =
  | "wedding"
  | "bar-mitzvah"
  | "farbrengen"
  | "community"
  | "concert";

type EventStatus = "upcoming" | "past";

type EventItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  city: string;
  venue: string;
  category: EventCategory;
  status: EventStatus;
  highlight?: string;
  audienceSize?: string;
  isPrivate?: boolean;
  notes?: string;
};

type EventsPageProps = {
  searchParams?: {
    category?: string;
    status?: string;
    success?: string;
  };
};

/* ============= DATA מדגמי – לוח אירועים ============= */

const EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "חתונת חבד — משפחות לוי/כהן",
    date: "2025-02-10",
    time: "19:30",
    city: "ירושלים",
    venue: "אולם 'מעלות דוד'",
    category: "wedding",
    status: "upcoming",
    highlight: "חופה חיה + סט ריקודים מלא בסגנון חב״ד/ים תיכוני כשר",
    audienceSize: "כ־350 משתתפים",
  },
  {
    id: "e2",
    title: "התוועדות ראש חודש",
    date: "2025-02-18",
    time: "21:00",
    city: "לוד",
    venue: "בית חב״ד המרכזי",
    category: "farbrengen",
    status: "upcoming",
    highlight: "ניגוני חב״ד בעומק + שירי התעוררות, אווירה משפחתית",
    audienceSize: "כ־150 משתתפים",
  },
  {
    id: "e3",
    title: "בר מצווה — משפחת גורפינקל",
    date: "2025-03-03",
    time: "18:45",
    city: "מודיעין עילית",
    venue: "אולם 'אחוזת המלך'",
    category: "bar-mitzvah",
    status: "upcoming",
    highlight: "מעגלי ריקודים + שירי ילדים/משפחה בסגנון חב״ד",
    audienceSize: "כ־220 משתתפים",
    isPrivate: true,
  },
  {
    id: "p1",
    title: "חתונה — משפחת קראוס",
    date: "2024-11-28",
    time: "19:00",
    city: "ביתר עילית",
    venue: "אולמי 'כתר דוד'",
    category: "wedding",
    status: "past",
    highlight: "סט חופה חי + 3 סטים לריקודים",
    audienceSize: "כ־400 משתתפים",
    notes: "שילוב פלייליסט חסידי/ים תיכוני לפי בקשת המשפחה.",
  },
  {
    id: "p2",
    title: "התוועדות כ״ח טבת",
    date: "2024-12-10",
    time: "21:30",
    city: "צפת",
    venue: "ישיבת חב״ד",
    category: "farbrengen",
    status: "past",
    highlight: "ניגוני חב״ד עמוקים עד אמצע הלילה",
    audienceSize: "כ־120 משתתפים",
    notes: "הקלטת האודיו נשמרה — ניתן לבקש דוגמה.",
  },
  {
    id: "p3",
    title: "הופעה קהילתית פתוחה",
    date: "2024-10-05",
    time: "20:00",
    city: "נתניה",
    venue: "אמפי קהילתי",
    category: "community",
    status: "past",
    highlight: "מופע קיץ עם שירים חסידיים/ישראלים למשפחות",
    audienceSize: "כ־600 משתתפים",
  },
  {
    id: "p4",
    title: "קונצרט ניגונים",
    date: "2024-09-15",
    time: "20:30",
    city: "תל אביב",
    venue: "אולם קטן — 120 מקומות",
    category: "concert",
    status: "past",
    highlight: "ניגוני חב״ד בעיבודים חדשים",
    audienceSize: "אולם מלא",
  },
];

const CATEGORY_LABEL: Record<EventCategory, string> = {
  wedding: "חתונה / חופה",
  "bar-mitzvah": "בר מצווה",
  farbrengen: "התוועדות",
  community: "אירוע קהילתי",
  concert: "קונצרט / מופע",
};

/* ============= DATA – לוח תאריכים חסידיים ============= */

type ChassidicDateItem = {
  id: string;
  hebrewDate: string;
  name: string;
  season: string;
  typicalEvent: string;
  note?: string;
};

const CHASSIDIC_DATES: ChassidicDateItem[] = [
  {
    id: "cd1",
    hebrewDate: "י״ט כסלו",
    name: "ראש השנה לחסידות",
    season: "חנוכה / תחילת החורף",
    typicalEvent: "התוועדות מרכזית, ניגוני חב״ד, ריקודים",
    note: "ערב שאפשר לבנות בו התוועדות עם ניגוני חב״ד בעומק וסט שמח לסיום.",
  },
  {
    id: "cd2",
    hebrewDate: "י׳ כסלו",
    name: "יום הגאולה – המיטלער רבי",
    season: "לפני י״ט כסלו",
    typicalEvent: "התוועדות בינונית/קהילתית",
    note: "מתאים להתוועדות בית חב״ד/קהילה, סט ניגונים רגוע עם קטעים שקטים.",
  },
  {
    id: "cd3",
    hebrewDate: "י׳ שבט",
    name: "קבלת הנשיאות – הרבי מליובאוויטש",
    season: "חורף",
    typicalEvent: "התוועדות עומק + ניגוני י״ד ניסן/י״ט כסלו",
    note: "הרבה קהילות מחפשות חיזוק – מתאים להתוועדות לימודית + מוזיקה חיה.",
  },
  {
    id: "cd4",
    hebrewDate: "י״א ניסן",
    name: "יום הולדת הרבי",
    season: "לפני פסח",
    typicalEvent: "ערב שירים וניגוני משיח, אירוע קהילתי",
    note: "אפשר לבנות מופע משפחות חב״די/קהילתי עם דגש על שירי משיח.",
  },
  {
    id: "cd5",
    hebrewDate: "ג׳ תמוז",
    name: "יום ההילולא – הרבי",
    season: "קיץ",
    typicalEvent: "ערב ניגונים והתעוררות",
    note: "התוועדות עמוקה, ניגונים שקטים + קטעים חזקים לסיום.",
  },
  {
    id: "cd6",
    hebrewDate: "י״ב–י״ג תמוז",
    name: "ימי הגאולה – הרבי הריי״צ",
    season: "קיץ",
    typicalEvent: "התוועדות, ניגוני גאולה",
    note: "אפשר ממש לייצר 'ליל ניגונים' עם סיפורים והשתלבות הקהל.",
  },
  {
    id: "cd7",
    hebrewDate: "ח״י אלול",
    name: "יום הולדת הבעש״ט והאדמו״ר הזקן",
    season: "סוף אלול",
    typicalEvent: "התוועדות הכנה לראש השנה",
    note: "אירוע מושלם לניגוני הכנה, שקט + סיום בשירים מעוררים.",
  },
  {
    id: "cd8",
    hebrewDate: "ראש חודש כסלו",
    name: "ראש חודש כסלו – יום השמחה",
    season: "תחילת החורף",
    typicalEvent: "אירוע שמח, ניגוני הודיה",
    note: "אפשר לבנות ערב 'שמחה וריקודים' לקהילה/בית ספר/ישיבה.",
  },
  {
    id: "cd9",
    hebrewDate: "חנוכה (כל ימי החג)",
    name: "ערבי חנוכה",
    season: "חורף",
    typicalEvent: "מופע חנוכה, טקס הדלקת נרות, שירי חנוכה וחסידות",
    note: "מתאים במיוחד לאירועי קהילה, בתי ספר ותהלוכות חנוכה.",
  },
  {
    id: "cd10",
    hebrewDate: "פורים",
    name: "פורים / פורים קטן",
    season: "סוף חורף",
    typicalEvent: "מסיבות פורים, ריקודים, DJ חי + אורגן",
    note: "ערב שצריך בו סט שמח ועמיד – חב״ד + ים תיכוני כשר.",
  },
  {
    id: "cd11",
    hebrewDate: "ל״ג בעומר",
    name: "יום ההילולא רבי שמעון בר יוחאי",
    season: "אביב",
    typicalEvent: "אירוע אש ל״ג בעומר, הדלקה, ניגוני שמחה",
    note: "אירועי ילדים/משפחות, מתאימים למופע פתוח בשכונה/חצר.",
  },
  {
    id: "cd12",
    hebrewDate: "ר״ח אלול–עשרת ימי תשובה",
    name: "ימי סליחות והתעוררות",
    season: "אלול/תשרי",
    typicalEvent: "ערבי ניגונים שקטים, התעוררות וסליחות",
    note: "אירועי לילה מאוחרים, ניגונים שקטים ושירי דבקות.",
  },
];

/* ========================= PAGE ========================= */

export default function EventsPage({ searchParams }: EventsPageProps) {
  const activeCategory = normalizeCategory(searchParams?.category);
  const activeStatus = normalizeStatus(searchParams?.status);

  const { upcoming, past } = buildFilteredEvents(EVENTS, {
    category: activeCategory,
    status: activeStatus,
  });

  const success = searchParams?.success === "1";

  return (
    <section
      className="section-padding relative flex justify-center px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
      {/* רקע רך עם גרדיאנטים */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="container-section relative w-full max-w-6xl mx-auto space-y-10">
        <EventsHero />

        {success && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 px-4 py-3 text-xs sm:text-sm">
            הבקשה נקלטה בהצלחה. אצור איתך קשר לגבי זמינות, תמחור מדויק ורשימת
            שירים מותאמת לאירוע שלך.
          </div>
        )}

        <EventsLayoutShell>
          {/* MAIN COLUMN */}
          <div className="space-y-6">
            <EventsFiltersBar
              activeCategory={activeCategory}
              activeStatus={activeStatus}
            />
            <UpcomingEventsSection events={upcoming} />

            {/* נגן דמואים של אירועים */}
            <EventsDemoPlayer />

            {/* כאן נכנסת כל זרימת ההזמנה (פרטים + שירים + שליחה) */}
            <div id="event-request">
              <EventRequestForm />
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            <EventsQuickInfo />
            <PastEventsSection events={past} />
          </aside>
        </EventsLayoutShell>

        <ChassidicDatesSection />

        <EventFaqSection />

        <EventsBottomStrip />
      </div>
    </section>
  );
}

/* ========================= Hero ========================= */

function EventsHero() {
  return (
    <header className="rounded-3xl border dark:border-neutral-800/70 bg-white/75 dark:bg-neutral-950/80 backdrop-blur-xl text-right p-6 sm:p-8 shadow-md">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-600/30 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-200">
            <Sparkles className="w-3.5 h-3.5" />
            לוח אירועים חי • MATY-MUSIC בתוך MATY+
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            אירועים, חתונות, התוועדויות — במקום אחד
          </h1>
          <p className="opacity-80 text-sm sm:text-base leading-relaxed max-w-2xl">
            כאן רואים מה היה, מה קורה בקרוב, ומה אפשר לבנות במיוחד בשבילכם:
            חתונות חב״ד, בר מצוות, התוועדויות חיות, אירועי קהילה ועוד — רפרטואר
            מותאם, סאונד מקצועי ואווירה טובה ונקייה.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
            >
              תיאום אירוע חדש
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-950/80 px-4 py-2 text-sm font-semibold hover:bg-white/95 dark:hover:bg-neutral-900"
            >
              צפייה בדמואים
              <Music4 className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-700/90 via-fuchsia-700/80 to-violet-500/80 text-white px-4 py-3 sm:px-5 sm:py-4 shadow-lg min-w-[240px]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-right space-y-1 text-xs sm:text-sm">
                <div className="font-semibold flex items-center gap-1 justify-end">
                  <CalendarDays className="w-4 h-4" />
                  תאריכים חמים
                </div>
                <p className="opacity-90 leading-relaxed">
                  עונת האירועים הקרובה מתמלאת מהר. מומלץ להשאיר פרטים, לבחור סוג
                  אירוע ושירים — ולשמור תאריך.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center text-[10px] gap-1 opacity-90">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  <Clock className="w-3 h-3" />
                  2025
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-center">
                  <Users className="w-3 h-3" />
                  חתונות • חופות • בר מצוות • התוועדויות
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ========================= Layout Shell ========================= */

function EventsLayoutShell({ children }: { children: [ReactNode, ReactNode] }) {
  const [main, sidebar] = children;
  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 xl:gap-10 items-start">
      <div className="space-y-6">{main}</div>
      <div className="space-y-6">{sidebar}</div>
    </div>
  );
}

/* ========================= Filters Bar ========================= */

type FiltersProps = {
  activeCategory?: EventCategory | null;
  activeStatus?: EventStatus | null;
};

function EventsFiltersBar({ activeCategory, activeStatus }: FiltersProps) {
  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/75 dark:bg-neutral-950/80 backdrop-blur-xl p-4 sm:p-5 text-right space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">סינון אירועים</h2>
          <p className="text-xs sm:text-sm opacity-75">
            השתמש בפילטרים כדי לראות רק חתונות, התוועדויות, אירועי עבר/קרובים
            וכו׳. האירוע שלכם יכול להיות שונה — זה רק דוגמאות.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
          <div className="flex flex-wrap gap-2 justify-end">
            <FilterChipLink
              label="הכל"
              href="/events"
              active={!activeCategory && !activeStatus}
            />
            <FilterChipLink
              label="אירועים קרובים"
              href="/events?status=upcoming"
              active={activeStatus === "upcoming"}
            />
            <FilterChipLink
              label="אירועי עבר"
              href="/events?status=past"
              active={activeStatus === "past"}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <FilterChipLink
              label="חתונות וחופות"
              href="/events?category=wedding"
              active={activeCategory === "wedding"}
            />
            <FilterChipLink
              label="בר מצווה"
              href="/events?category=bar-mitzvah"
              active={activeCategory === "bar-mitzvah"}
            />
            <FilterChipLink
              label="התוועדויות"
              href="/events?category=farbrengen"
              active={activeCategory === "farbrengen"}
            />
            <FilterChipLink
              label="אירועי קהילה"
              href="/events?category=community"
              active={activeCategory === "community"}
            />
            <FilterChipLink
              label="קונצרטים"
              href="/events?category=concert"
              active={activeCategory === "concert"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterChipLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 transition",
        active
          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
          : "border-neutral-200/70 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-950/80 text-xs sm:text-[13px] hover:bg-white/95 dark:hover:bg-neutral-900",
      ].join(" ")}
    >
      {label}
      {active && <TicketCheck className="w-3.5 h-3.5" />}
    </Link>
  );
}

/* ========================= Upcoming Events ========================= */

function UpcomingEventsSection({ events }: { events: EventItem[] }) {
  if (!events.length) {
    return (
      <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/75 dark:bg-neutral-950/80 backdrop-blur-xl p-5 text-right space-y-2">
        <h2 className="text-lg font-bold mb-1">אירועים קרובים</h2>
        <p className="text-sm opacity-80">
          כרגע אין אירועים פומביים שמתאימים לפילטר שבחרת — אפשר עדיין להזמין
          אירוע פרטי בתאריך שמתאים לך.
        </p>
        <Link
          href="#event-request"
          className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 hover:brightness-110 mt-1"
        >
          בקשת תאריך לאירוע
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/75 dark:bg-neutral-950/80 backdrop-blur-xl p-5 text-right space-y-4 shadow-md">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-violet-600" />
            אירועים קרובים
          </h2>
          <p className="text-xs sm:text-sm opacity-80">
            הרשימה מדגימה את אופי האירועים. באירוע שלכם נבנה סט אישי לפי השאלון
            והבקשות בטופס.
          </p>
        </div>
        <Link
          href="#event-request"
          className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 hover:brightness-110"
        >
          בקשת תאריך עכשיו
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {events.map((ev) => (
          <UpcomingEventCard key={ev.id} ev={ev} />
        ))}
      </div>
    </section>
  );
}

function UpcomingEventCard({ ev }: { ev: EventItem }) {
  return (
    <article className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/90 p-4 text-right flex flex-col gap-3 shadow-sm">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-base leading-snug">
            {ev.title}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/10 text-violet-700 dark:text-violet-200 border border-violet-600/30 px-2 py-0.5 text-[10px] sm:text-[11px]">
            <Music4 className="w-3 h-3" />
            {CATEGORY_LABEL[ev.category]}
          </span>
        </div>
        {ev.highlight && (
          <p className="text-xs opacity-75 leading-snug">{ev.highlight}</p>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-1 text-[11px] sm:text-xs opacity-85">
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>תאריך</span>
          </dt>
          <dd className="font-medium">
            {formatHebrewDate(ev.date)} • {ev.time}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>מיקום</span>
          </dt>
          <dd className="font-medium">
            {ev.city} — {ev.venue}
          </dd>
        </div>
        {ev.audienceSize && (
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>קהל</span>
            </dt>
            <dd>{ev.audienceSize}</dd>
          </div>
        )}
        {ev.isPrivate && (
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>סוג האירוע</span>
            </dt>
            <dd className="text-[11px]">אירוע פרטי (דוגמה לאווירה)</dd>
          </div>
        )}
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="inline-flex items-center gap-1 text-[11px] opacity-70">
          <Clock className="w-3.5 h-3.5" />
          הגעה מוקדמת + בדיקת סאונד במקום
        </span>
        <Link
          href="#event-request"
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 px-3 py-1 text-[11px] font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          אירוע דומה אצלך?
          <ChevronRight className="w-3 h-3" />
        </Link>
      </footer>
    </article>
  );
}

/* ========================= Quick Info Sidebar ========================= */

function EventsQuickInfo() {
  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-5 text-right space-y-4 shadow-md">
      <div className="space-y-1">
        <h2 className="text-base font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-violet-600" />
          איך נראה אירוע עם MATY-MUSIC?
        </h2>
        <p className="text-xs sm:text-sm opacity-80">
          מגיעים מוקדם, בודקים סאונד, עוברים על הסדר עם בעלי השמחה, ומתאימים את
          הסטים לקהל לאורך כל הערב. הכל בסגנון חב״ד/דתי נקי.
        </p>
      </div>

      <ul className="text-xs sm:text-sm opacity-85 space-y-2">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-600" />
          <span>סט חופה/מעגלים חי עם Korg Pa5X + הגברה מותאמת לאולם.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-600" />
          <span>תיאום רשימת שירים מראש + התאמות אונליין לפי הקהל.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-600" />
          <span>גישה של &quot;משפחה&quot; — יחס אישי, גמישות וסבלנות.</span>
        </li>
      </ul>

      <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-600/5 p-3 text-xs sm:text-sm space-y-1">
        <div className="font-semibold flex items-center gap-1 justify-end">
          <Info className="w-4 h-4 text-violet-600" />
          רוצה לראות דוגמאות?
        </div>
        <p className="opacity-80">
          אפשר לבקש רשימת שירים מלאה, סטים לדוגמה לחתונה חב״דית, בר מצווה
          והתוועדות, והקלטות מאירועים קודמים.
        </p>
      </div>
    </section>
  );
}

/* ========================= Past Events ========================= */

function PastEventsSection({ events }: { events: EventItem[] }) {
  if (!events.length) return null;

  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-5 text-right space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">אירועי עבר נבחרים</h2>
          <p className="text-xs opacity-75">
            דוגמאות לאופי האירועים — זו לא רשימה מלאה, אלא טעימה מהאווירה.
          </p>
        </div>
      </div>

      <ol className="space-y-3 text-xs sm:text-sm">
        {events.map((ev) => (
          <li key={ev.id} className="flex gap-3">
            <div className="mt-0.5 flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-violet-600" />
              <div className="flex-1 w-px bg-gradient-to-b from-violet-500/60 to-transparent" />
            </div>
            <div className="flex-1 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/95 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{ev.title}</div>
                <span className="text-[10px] opacity-70 inline-flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {formatHebrewDate(ev.date)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-85">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {ev.city} — {ev.venue}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5">
                  <Music4 className="w-3 h-3" />
                  {CATEGORY_LABEL[ev.category]}
                </span>
              </div>
              {ev.highlight && (
                <p className="text-[11px] opacity-80">{ev.highlight}</p>
              )}
              {ev.notes && (
                <p className="text-[11px] opacity-70 italic">{ev.notes}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="pt-1 flex justify-end">
        <Link
          href="#event-request"
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 px-3 py-1 text-[11px] font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          רוצה לשחזר אווירה דומה?
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

/* ========================= סקשן – טבלת תאריכים חסידיים ========================= */

function ChassidicDatesSection() {
  return (
    <section
      className="rounded-3xl border border-neutral-800/80 bg-gradient-to-br from-neutral-950 via-neutral-950/95 to-neutral-900/95
                 backdrop-blur-xl p-5 sm:p-6 text-right space-y-4 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-50">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            לוח תאריכים חסידיים — הזמן אותי להתוועדות
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl">
            תאריכים חב״דיים מוכרים לאורך השנה. לכל שורה אפשר לבנות התוועדות,
            הופעה חיה או ערב ניגונים — אתה פשוט בוחר תאריך ולוחץ על הזמנה.
          </p>
        </div>
        <Link
          href="/contact#contact"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2
                     text-xs sm:text-sm font-semibold text-white shadow-lg hover:brightness-110"
        >
          אני רוצה התוועדות בתאריך חסידי
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* מסגרת הטבלה – כהה לגמרי */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/90 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm text-neutral-100">
            <thead className="bg-neutral-900">
              <tr className="text-right">
                <th className="px-3 py-2 border-b border-neutral-800 font-semibold whitespace-nowrap text-neutral-200">
                  תאריך עברי
                </th>
                <th className="px-3 py-2 border-b border-neutral-800 font-semibold whitespace-nowrap text-neutral-200">
                  אירוע חסידי
                </th>
                <th className="px-3 py-2 border-b border-neutral-800 font-semibold whitespace-nowrap text-neutral-200">
                  עונה / תקופה
                </th>
                <th className="px-3 py-2 border-b border-neutral-800 font-semibold whitespace-nowrap text-neutral-200">
                  סוג אירוע מומלץ
                </th>
                <th className="px-3 py-2 border-b border-neutral-800 font-semibold whitespace-nowrap text-neutral-200">
                  הזמנת הופעה
                </th>
              </tr>
            </thead>
            <tbody>
              {CHASSIDIC_DATES.map((d, idx) => (
                <tr
                  key={d.id}
                  className={
                    idx % 2 === 0 ? "bg-neutral-950" : "bg-neutral-900/90"
                  }
                >
                  <td className="px-3 py-2 align-top whitespace-nowrap text-xs sm:text-sm">
                    <div className="font-semibold text-neutral-50">
                      {d.hebrewDate}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-semibold text-neutral-50">
                      {d.name}
                    </div>
                    {d.note && (
                      <div className="text-[11px] sm:text-xs text-neutral-300 mt-0.5">
                        {d.note}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] sm:text-xs text-neutral-300">
                    {d.season}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] sm:text-xs text-neutral-200">
                    {d.typicalEvent}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Link
                      href={`/contact?reason=farbrengen&date=${encodeURIComponent(
                        d.name,
                      )}`}
                      className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500 text-white text-[11px] sm:text-xs
                                 px-3 py-1 hover:brightness-110 shadow"
                    >
                      הזמן אותי לתאריך הזה
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] sm:text-xs text-neutral-300">
        אפשר כמובן להזמין הופעה/התוועדות גם לתאריכים אחרים: שבתות קהילה, מסיבות
        סיום, ימי הולדת חסידיים, אירועי בית ספר ועוד.
      </p>
    </section>
  );
}

/* ========================= FAQ ========================= */

function EventFaqSection() {
  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-5 sm:p-6 text-right space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">שאלות נפוצות על אירועים</h2>
        <p className="text-xs sm:text-sm opacity-75">
          זה עומד להפוך לעמוד מלא שלם — בינתיים, תשובות קצרות לדברים שמרבית
          המשפחות שואלות לפני סגירה.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {EVENT_FAQ.map((item, idx) => (
          <details
            key={idx}
            className="rounded-2xl border dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/90 p-3"
          >
            <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between gap-2">
              <span>{item.q}</span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </summary>
            <p className="mt-1 text-xs sm:text-sm opacity-80 leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

const EVENT_FAQ: { q: string; a: string }[] = [
  {
    q: "איך קובעים מחיר לאירוע?",
    a: "המחיר נקבע לפי סוג האירוע (חתונה/בר מצווה/התוועדות), תאריך (אמצע שבוע/מוצ״ש/ראש חודש), מיקום בארץ, ציוד הגברה נדרש והיקף שעות הנגינה. מקבלים הצעת מחיר הוגנת ומפורטת לפני סגירה.",
  },
  {
    q: "אפשר רשימת שירים מותאמת?",
    a: "כן. בונים יחד רשימה של שירים שחייבים להיות, שירים שאוהבים ושירים שפחות. ביום האירוע זורמים לפי הקהל אבל נשארים במסגרת שסיכמנו.",
  },
  {
    q: "מגיעים עם ציוד הגברה מלא?",
    a: "יש אפשרות לשני המצבים: או שנכנסים למערכת סאונד קיימת באולם, או שמביאים ציוד מלא (רמקולים, מוניטורים, מיקסר, מיקרופונים) לפי הצורך ועל פי הצעת המחיר.",
  },
  {
    q: "האם אפשר הופעה קטנה בבית/חצר?",
    a: "בוודאי. יש סט-אפ קומפקטי לאירועים ביתיים, חצרות, גינות ציבוריות קטנות ועוד — עם ציוד גמיש שלא מצריך במה ענקית.",
  },
  {
    q: "מה לגבי קהלים דתיים/חסידיים?",
    a: "הקו הוא נקי, מכובד ותואם קהילות חב״ד/דתיות. רוב הרפרטואר הוא חסידי/חב״ד + ים תיכוני מותאם, ואפשר לשלב גם שירים ישראליים במינון הנכון.",
  },
  {
    q: "כמה זמן לפני האירוע סוגרים?",
    a: "ככל שסוגרים מוקדם יותר — יש יותר סיכוי שהתאריך פנוי. בעונות החמות מומלץ לבדוק כמה חודשים מראש, במיוחד לחתונות וחגים.",
  },
];

/* ========================= Bottom Strip / Marquee ========================= */

function EventsBottomStrip() {
  return (
    <section className="mt-4">
      <div className="rounded-2xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 overflow-hidden backdrop-blur">
        <div className="whitespace-nowrap animate-[marquee_26s_linear_infinite] text-xs sm:text-sm px-4 py-2">
          <span className="me-6">
            • MATY-MUSIC • חתונות • בר מצוות • התוועדויות • אירועי קהילה •
          </span>
          <span className="me-6">
            פלייליסט מותאם • ניגוני חב״ד • שירי ריקודים • שירי משפחה •
          </span>
          <span className="me-6">
            סאונד מקצועי • יחס אישי • קהילה נקייה • MATY-CLUB • MATY-DATE •
            MATY+
          </span>
        </div>
        <style>{`@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      </div>
    </section>
  );
}

/* ========================= Util & Filtering ========================= */

function formatHebrewDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function normalizeCategory(v?: string): EventCategory | null {
  if (!v) return null;
  const all: EventCategory[] = [
    "wedding",
    "bar-mitzvah",
    "farbrengen",
    "community",
    "concert",
  ];
  return all.includes(v as EventCategory) ? (v as EventCategory) : null;
}

function normalizeStatus(v?: string): EventStatus | null {
  if (!v) return null;
  const all: EventStatus[] = ["upcoming", "past"];
  return all.includes(v as EventStatus) ? (v as EventStatus) : null;
}

function buildFilteredEvents(
  all: EventItem[],
  opts: { category?: EventCategory | null; status?: EventStatus | null },
): { upcoming: EventItem[]; past: EventItem[] } {
  const { category, status } = opts;

  const filtered = all.filter((ev) => {
    if (category && ev.category !== category) return false;
    if (status && ev.status !== status) return false;
    return true;
  });

  const upcoming = filtered.filter((ev) => ev.status === "upcoming");
  const past = filtered.filter((ev) => ev.status === "past");

  return { upcoming, past };
}
