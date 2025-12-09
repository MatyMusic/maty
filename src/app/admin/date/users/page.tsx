// src/app/admin/date/users/page.tsx
import { requireAdmin } from "@/lib/auth/requireAdmin";
import connectDB from "@/lib/db/mongoose";
import DateProfile from "@/models/date/DateProfile";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function parseNum(v: string | string[] | undefined, def = 1) {
  const n = Array.isArray(v) ? v[0] : v;
  const x = Number(n);
  return Number.isFinite(x) && x > 0 ? x : def;
}

export default async function DateUsersPage(props: PageProps) {
  // Next 15 – searchParams הוא Promise
  const searchParams = await props.searchParams;

  await requireAdmin();
  await connectDB();

  const q =
    (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) || "";
  const status =
    (Array.isArray(searchParams.status)
      ? searchParams.status[0]
      : searchParams.status) || "";
  const page = parseNum(searchParams.page, 1);
  const pageSize = 20;

  const filter: any = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ];
  }
  if (status) filter.status = status;

  const total = await DateProfile.countDocuments(filter);
  const items = await DateProfile.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4" dir="rtl">
      <form className="flex flex-wrap items-center gap-2">
        <input
          defaultValue={q}
          name="q"
          placeholder="חיפוש: שם / אימייל / עיר / מדינה"
          className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-full border px-3 text-sm border-amber-400/40 dark:border-amber-300/20 bg-white/80 dark:bg-neutral-900/70"
        >
          <option value="">כל הסטטוסים</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="blocked">Blocked</option>
        </select>
        <button className="h-10 rounded-full px-4 text-sm bg-brand text-white">
          סנן
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-right border-b border-black/10 dark:border-white/10">
              <th className="py-2 px-2">שם</th>
              <th className="py-2 px-2">אימייל</th>
              <th className="py-2 px-2">מין</th>
              <th className="py-2 px-2">זרם</th>
              <th className="py-2 px-2">עיר</th>
              <th className="py-2 px-2">סטטוס</th>
              <th className="py-2 px-2">עודכן</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p: any) => (
              <tr
                key={String(p._id)}
                className="border-b border-black/5 dark:border-white/5"
              >
                <td className="py-2 px-2">{p.name ?? "—"}</td>
                <td className="py-2 px-2">{p.email ?? "—"}</td>
                <td className="py-2 px-2">{p.gender}</td>
                <td className="py-2 px-2">{p.denomination}</td>
                <td className="py-2 px-2">
                  {[p.city, p.country].filter(Boolean).join(", ")}
                </td>
                <td className="py-2 px-2">{p.status}</td>
                <td className="py-2 px-2">
                  {p.updatedAt
                    ? new Date(p.updatedAt).toLocaleString("he-IL")
                    : "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-6 px-2 opacity-60 text-center" colSpan={7}>
                  אין נתונים להצגה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div>סה״כ: {total}</div>
        <div className="flex gap-1">
          {Array.from({ length: pages }).map((_, i) => {
            const n = i + 1;
            const url = new URLSearchParams({
              q,
              status,
              page: String(n),
            });
            return (
              <a
                key={n}
                href={`?${url.toString()}`}
                className={`px-3 py-1 rounded-full border ${
                  n === page
                    ? "bg-brand text-white border-transparent"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                {n}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
