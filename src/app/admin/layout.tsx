// src/app/admin/layout.tsx
import SidebarNav from "@/components/admin/SidebarNav.client";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "פאנל ניהול — MATY",
  description:
    "ניהול אתר, MATY-MUSIC, MATY-CLUB, MATY-DATE, MATY-FIT, MATY-JAM",
};

/* ------------------------------------------------------------------ */
/* טיפוסים                                                             */
/* ------------------------------------------------------------------ */

type ClubStats = {
  postsTotal: number;
  postsPending: number;
  promotions: number;
  reportsOpen: number;
  users: number;
};

type BadgesResponse = {
  ok: boolean;
  badges: {
    music?: { libraryPending?: number };
    club?: { postApprovals?: number; reportsOpen?: number };
    date?: { profileReports?: number };
    fit?: { groupApprovals?: number };
    jam?: { sessionApprovals?: number; reportsOpen?: number };
  };
};

/* ------------------------------------------------------------------ */
/* server helpers                                                      */
/* ------------------------------------------------------------------ */

async function fetchStats(): Promise<ClubStats | null> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/club/stats`,
      { cache: "no-store" },
    ).catch(() => null);
    if (!r || !r.ok) return null;

    const json = (await r
      .json()
      .catch(() => null)) as Partial<ClubStats> | null;

    if (!json || typeof json !== "object") return null;

    return {
      postsTotal: Number(json.postsTotal ?? 0),
      postsPending: Number(json.postsPending ?? 0),
      promotions: Number(json.promotions ?? 0),
      reportsOpen: Number(json.reportsOpen ?? 0),
      users: Number(json.users ?? 0),
    };
  } catch (err) {
    console.error("[admin/layout] fetchStats failed:", err);
    return null;
  }
}

async function fetchBadges(): Promise<BadgesResponse | null> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/badges`,
      { cache: "no-store" },
    ).catch(() => null);
    if (!r || !r.ok) return null;

    const json = (await r.json().catch(() => null)) as BadgesResponse | null;
    if (!json || typeof json !== "object") return null;

    const badges = json.badges ?? {};

    return {
      ok: Boolean(json.ok),
      badges: {
        music: badges.music ?? { libraryPending: 0 },
        club: badges.club ?? { postApprovals: 0, reportsOpen: 0 },
        date: badges.date ?? { profileReports: 0 },
        fit: badges.fit ?? { groupApprovals: 0 },
        jam: badges.jam ?? { sessionApprovals: 0, reportsOpen: 0 },
      },
    };
  } catch (err) {
    console.error("[admin/layout] fetchBadges failed:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* קומפוננטות קטנות – Stat / Pill                                     */
/* ------------------------------------------------------------------ */

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/50 backdrop-blur">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums">
        {Number.isFinite(value) ? value : 0}
      </div>
    </div>
  );
}

// ====== צבעים לפי מודולים (כולל JAM) ======
type PillColor =
  | "sky" // MUSIC
  | "fuchsia" // CLUB
  | "emerald" // DATE
  | "amber" // FIT
  | "violet"; // JAM

type PillProps = {
  label: string;
  value?: number;
  color: PillColor;
  title?: string;
};

function Pill({ label, value, color, title }: PillProps) {
  const by = {
    sky: {
      border: "border-sky-200/60 dark:border-cyan-800/50",
      bg: "from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30",
      dot: "bg-sky-500",
      text: "text-sky-700 dark:text-sky-300",
    },
    fuchsia: {
      border: "border-fuchsia-200/60 dark:border-fuchsia-800/50",
      bg: "from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30",
      dot: "bg-fuchsia-500",
      text: "text-fuchsia-700 dark:text-fuchsia-300",
    },
    emerald: {
      border: "border-emerald-200/60 dark:border-teal-800/50",
      bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      border: "border-orange-200/60 dark:border-amber-800/50",
      bg: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
    },
    violet: {
      border: "border-violet-200/60 dark:border-violet-800/50",
      bg: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
      dot: "bg-violet-500",
      text: "text-violet-700 dark:text-violet-300",
    },
  }[color] ?? {
    border: "border-black/10 dark:border-white/10",
    bg: "from-neutral-50 to-neutral-100 dark:from-neutral-900/40 dark:to-neutral-900/70",
    dot: "bg-neutral-500",
    text: "text-neutral-800 dark:text-neutral-200",
  };

  const showValue = typeof value === "number" && value > 0;

  return (
    <div
      title={title}
      className={[
        "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm",
        "bg-gradient-to-r",
        by.border,
        by.bg,
      ].join(" ")}
    >
      <span className={`inline-block size-2 rounded-full ${by.dot}`} />
      <span className={["min-w-0 truncate", by.text].join(" ")}>{label}</span>
      {showValue && (
        <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold bg-black/10 dark:bg-white/10">
          {value}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ניווטים                                                             */
/* ------------------------------------------------------------------ */

const musicNav = [
  { href: "/admin", label: "סקירה כללית" },
  { href: "/admin/schedule", label: "לוח זמנים / זמינות" },
  { href: "/admin/bookings", label: "הזמנות" },
  { href: "/admin/customers", label: "לקוחות" },
  { href: "/admin/media", label: "ספריית מדיה" },
  { href: "/admin/tracks", label: "שירים" },
  { href: "/admin/settings", label: "הגדרות" },
  { href: "/admin/settings/features", label: "פיצ'רים" },
];

const clubNav = [
  { href: "/admin/club", label: "דאשבורד CLUB" },
  { href: "/admin/club/posts", label: "פוסטים" },
  { href: "/admin/club/posts/new", label: "פוסט חדש" },
  { href: "/admin/club/approvals", label: "אישורי פוסטים" },
  { href: "/admin/club/promotions", label: "פרסומים בצד" },
  { href: "/admin/club/promotions/new", label: "פרסום צד חדש" },
  { href: "/admin/club/reports", label: "דיווחים" },
  { href: "/admin/club/moderation", label: "תור Moderation" },
  { href: "/admin/club/users", label: "משתמשים / תפקידים" },
  { href: "/admin/club/settings", label: "הגדרות CLUB" },
];

const dateNav = [
  { href: "/admin/date", label: "דאשבורד MATY-DATE" },
  { href: "/admin/date/users", label: "משתמשים / פרופילים" },
  { href: "/admin/date/preferences", label: "העדפות" },
  { href: "/admin/date/matches", label: "התאמות" },
  { href: "/admin/date/reports", label: "דיווחים" },
];

const fitNav = [
  { href: "/admin/fit", label: "דאשבורד MATY-FIT" },
  {
    href: "/admin/fit/groups",
    label: "קבוצות (אישורים)",
    key: "fit-approvals",
  },
  { href: "/admin/fit/exercises", label: "תרגילים" },
  { href: "/admin/fit/workouts", label: "אימונים" },
  { href: "/admin/fit/reports", label: "דיווחים" },
  { href: "/admin/fit/settings", label: "הגדרות FIT" },
];

const jamNav = [
  { href: "/admin/jam", label: "דאשבורד MATY-JAM" },
  { href: "/admin/jam/sessions", label: "סשנים" },
  { href: "/admin/jam/tracks", label: "קטלוג/טראקים" },
  {
    href: "/admin/jam/approvals",
    label: "אישורים",
    key: "jam-approvals",
  },
  { href: "/admin/jam/reports", label: "דיווחים" },
  { href: "/admin/jam/settings", label: "הגדרות JAM" },
];

/* ------------------------------------------------------------------ */
/* קומפוננטות עיקריות – Header / Pills / סטטיסטיקות                  */
/* ------------------------------------------------------------------ */

function AdminHeader() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold">פאנל ניהול</h1>
        <p className="text-sm opacity-70">
          ניהול MUSIC / CLUB / DATE / FIT / JAM
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/club/posts/new"
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          + פוסט חדש (CLUB)
        </Link>
        <Link
          href="/admin/club/promotions/new"
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          + פרסום צד חדש
        </Link>
        <Link
          href="/admin/club/approvals"
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          תור אישורים
        </Link>
      </div>
    </div>
  );
}

type AdminModulePillsProps = {
  badges: BadgesResponse | null;
};

function AdminModulePills({ badges }: AdminModulePillsProps) {
  const fitPending = badges?.badges?.fit?.groupApprovals ?? 0;
  const clubPending = badges?.badges?.club?.postApprovals ?? 0;
  const clubReports = badges?.badges?.club?.reportsOpen ?? 0;
  const dateReports = badges?.badges?.date?.profileReports ?? 0;
  const jamPending = badges?.badges?.jam?.sessionApprovals ?? 0;
  const jamReports = badges?.badges?.jam?.reportsOpen ?? 0;
  const musicPending = badges?.badges?.music?.libraryPending ?? 0;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Pill
        label="MUSIC"
        value={musicPending}
        color="sky"
        title="ספריית מוזיקה — פריטים לטיפול"
      />
      <Pill
        label="CLUB — פוסטים ממתינים"
        value={clubPending}
        color="fuchsia"
        title="בקשות/פוסטים ממתינים לאישור"
      />
      <Pill
        label="CLUB — דיווחים פתוחים"
        value={clubReports}
        color="fuchsia"
        title="דיווחים הדורשים טיפול"
      />
      <Pill
        label="DATE — דיווחי פרופילים"
        value={dateReports}
        color="emerald"
        title="דיווחים על פרופילי דייטינג"
      />
      <Pill
        label="FIT — אישורי קבוצות"
        value={fitPending}
        color="amber"
        title="בקשות פתוחות ל־FIT"
      />
      <Pill
        label="JAM — אישורי סשנים"
        value={jamPending}
        color="violet"
        title="בקשות/סשנים ממתינים לאישור (JAM)"
      />
      <Pill
        label="JAM — דיווחים פתוחים"
        value={jamReports}
        color="violet"
        title="דיווחים פתוחים ב־JAM"
      />
    </div>
  );
}

type StatsGridProps = {
  stats: ClubStats | null;
};

function StatsGrid({ stats }: StatsGridProps) {
  const safe = stats ?? {
    postsTotal: 0,
    postsPending: 0,
    promotions: 0,
    reportsOpen: 0,
    users: 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
      <Stat label="סה״כ פוסטים" value={safe.postsTotal} />
      <Stat label="ממתינים לאישור" value={safe.postsPending} />
      <Stat label="פרסומים בצד" value={safe.promotions} />
      <Stat label="דיווחים פתוחים" value={safe.reportsOpen} />
      <Stat label="משתמשים (CLUB)" value={safe.users} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* קומפוננטת ה-layout הראשית                                          */
/* ------------------------------------------------------------------ */

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin("admin", { signInRedirect: "/auth?from=/admin" });

  const [stats, badges] = await Promise.all([fetchStats(), fetchBadges()]);

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-[1280px] px-3 md:px-6 py-6">
        <div
          className="grid gap-6 md:gap-8 md:grid-cols-[280px_minmax(0,1fr)] items-start"
          dir="rtl"
        >
          {/* סיידבר */}
          <SidebarNav
            className="sticky top-4 self-start"
            music={musicNav}
            club={clubNav}
            date={dateNav}
            fit={fitNav}
            jam={jamNav}
          />

          {/* תוכן */}
          <main className="min-w-0 space-y-4">
            <div className="mx-auto w-full max-w-[920px]">
              <div className="hidden md:block" />
              <AdminHeader />
              <AdminModulePills badges={badges} />
              <StatsGrid stats={stats} />

              {/* אזור תוכן */}
              <div className="card p-0 mt-4">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
