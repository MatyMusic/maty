// src/app/admin/groups/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

/**
 * עמוד ניהול קבוצות – גרסה יציבה ופשוטה:
 * כרגע מציג טבלה ריקה + TODO לטעינת נתונים אמיתיים.
 * העיקר: יש export default אחד ברור, בלי exports מיותרים.
 */

export const metadata = {
  title: "קבוצות · MATY-ADMIN",
};

// shape אחיד שהעמוד שלך צורך
export type AdminGroup = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  sports: string[];
  city?: string | null;
  ownerId: string;
  membersCount: number;
  createdAt?: string;
};

// אם תרצה בעתיד – תוכל לחבר כאן מקורות שונים ולעבור דרך normalizeGroup
type SourceA = {
  id: string;
  name: string;
  desc?: string;
  state?: "waiting" | "ok" | "no" | "off";
  tags?: string[];
  city?: string | null;
  owner?: string;
  members?: number;
  createdAt?: string;
};

type SourceB = {
  _id: string;
  title: string;
  description?: string;
  status?: "pending" | "approved" | "rejected" | "suspended";
  sports?: string[];
  city?: string | null;
  ownerId?: string;
  membersCount?: number;
  createdAt?: string;
};

// ממפה סטטוסים למצב האחיד
function mapStateToUnified(s?: string): AdminGroup["status"] {
  switch (s) {
    case "ok":
    case "approved":
      return "approved";
    case "no":
    case "rejected":
      return "rejected";
    case "off":
    case "suspended":
      return "suspended";
    case "waiting":
    case "pending":
    default:
      return "pending";
  }
}

// מנרמל מכל מקור ל־AdminGroup (פנימי – בלי export!)
function normalizeGroup(g: any): AdminGroup {
  // SourceB – כבר דומה ליעד
  if (g && typeof g === "object" && ("_id" in g || "title" in g)) {
    return {
      _id: String((g as SourceB)._id ?? (g as any).id ?? crypto.randomUUID()),
      title: String((g as SourceB).title ?? (g as any).name ?? "ללא שם"),
      description: (g as SourceB).description ?? (g as any).desc ?? "",
      status: mapStateToUnified((g as SourceB).status ?? (g as any).state),
      sports: Array.isArray((g as SourceB).sports)
        ? (g as SourceB).sports!
        : Array.isArray((g as any).tags)
          ? (g as any).tags
          : [],
      city: (g as SourceB).city ?? null,
      ownerId: String((g as SourceB).ownerId ?? (g as any).owner ?? "unknown"),
      membersCount: Number(
        (g as SourceB).membersCount ?? (g as any).members ?? 0,
      ),
      createdAt: (g as SourceB).createdAt,
    };
  }

  // SourceA – גרסה אחרת
  if (g && typeof g === "object" && ("id" in g || "name" in g)) {
    const a = g as SourceA;
    return {
      _id: String(a.id ?? crypto.randomUUID()),
      title: String(a.name ?? "ללא שם"),
      description: a.desc,
      status: mapStateToUnified(a.state),
      sports: Array.isArray(a.tags) ? a.tags : [],
      city: a.city ?? null,
      ownerId: String(a.owner ?? "unknown"),
      membersCount: Number(a.members ?? 0),
      createdAt: a.createdAt,
    };
  }

  // fallback – שלא יישבר
  return {
    _id: crypto.randomUUID(),
    title: "קבוצה",
    description: "",
    status: "pending",
    sports: [],
    city: null,
    ownerId: "unknown",
    membersCount: 0,
    createdAt: new Date().toISOString(),
  };
}

// כרגע – מחזיר רשימה ריקה. כשיהיה לך API אמיתי, תכניס אותו לכאן.
async function getAdminGroups(): Promise<AdminGroup[]> {
  // TODO: חיבור ל־DB / API אמיתי
  return [];
}

export default async function AdminGroupsPage() {
  const groups = await getAdminGroups();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">קבוצות – ניהול</h1>
        <Link
          href="/admin"
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          חזרה ללוח ניהול
        </Link>
      </div>

      <p className="mb-4 text-sm opacity-70">
        כאן תראה את כל הקבוצות מכל המודולים (CLUB / JAM / FIT וכו׳) אחרי נרמול
        ל־AdminGroup. כרגע זו רק תצוגת placeholder.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-neutral-900/70">
        <table className="min-w-full text-right">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/60 dark:border-white/10 dark:text-white/60">
              <th className="px-2 py-2">שם קבוצה</th>
              <th className="px-2 py-2">תיאור</th>
              <th className="px-2 py-2">סטטוס</th>
              <th className="px-2 py-2">תחומים / ספורט</th>
              <th className="px-2 py-2">עיר</th>
              <th className="px-2 py-2">חברים</th>
              <th className="px-2 py-2">בעלים</th>
              <th className="px-2 py-2">נוצר</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm opacity-60">
                  עדיין אין נתונים להצגה. כשנחבר ל־DB אמיתי, הכל יופיע כאן
                  בתצורה אחידה.
                </td>
              </tr>
            )}
            {groups.map((g) => (
              <tr
                key={g._id}
                className="border-b border-black/5 align-top last:border-0 dark:border-white/5"
              >
                <td className="px-2 py-2 font-medium">{g.title}</td>
                <td className="px-2 py-2 max-w-[260px] whitespace-pre-wrap text-xs opacity-80">
                  {g.description || "—"}
                </td>
                <td className="px-2 py-2">
                  <span className={statusChipClass(g.status)}>
                    {statusLabel(g.status)}
                  </span>
                </td>
                <td className="px-2 py-2 text-xs">
                  {g.sports?.length ? g.sports.join(", ") : "—"}
                </td>
                <td className="px-2 py-2 text-xs">{g.city || "—"}</td>
                <td className="px-2 py-2 text-xs">{g.membersCount}</td>
                <td className="px-2 py-2 text-xs">{g.ownerId}</td>
                <td className="px-2 py-2 text-xs opacity-70">
                  {g.createdAt
                    ? new Date(g.createdAt).toLocaleString("he-IL")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusLabel(s: AdminGroup["status"]) {
  switch (s) {
    case "approved":
      return "מאושרת";
    case "rejected":
      return "נדחתה";
    case "suspended":
      return "מושהית";
    case "pending":
    default:
      return "ממתינה";
  }
}

function statusChipClass(s: AdminGroup["status"]) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
  switch (s) {
    case "approved":
      return (
        base +
        " border-emerald-400/40 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100"
      );
    case "rejected":
      return (
        base +
        " border-red-400/40 bg-red-50/70 text-red-800 dark:bg-red-900/30 dark:text-red-100"
      );
    case "suspended":
      return (
        base +
        " border-amber-400/40 bg-amber-50/70 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100"
      );
    case "pending":
    default:
      return (
        base +
        " border-slate-400/40 bg-slate-50/70 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
      );
  }
}
