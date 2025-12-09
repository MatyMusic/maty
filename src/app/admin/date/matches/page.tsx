// src/app/admin/date/matches/page.tsx
import connectDB from "@/lib/db/mongoose";
import DateMatch from "@/models/date/DateMatch";
import DateProfile from "@/models/date/DateProfile";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

export default async function DateMatchesPage() {
  await requireAdmin();
  await connectDB();

  const items = await DateMatch.find({})
    .sort({ updatedAt: -1 })
    .limit(300)
    .lean();

  const ids = Array.from(
    new Set(items.flatMap((m: any) => [m.a, m.b].map(String)))
  );
  const profiles = await DateProfile.find({ userId: { $in: ids } })
    .select({ userId: 1, name: 1, email: 1 })
    .lean();
  const map = new Map<string, any>();
  profiles.forEach((p: any) => map.set(String(p.userId), p));

  return (
    <div className="overflow-x-auto" dir="rtl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-right border-b border-black/10 dark:border-white/10">
            <th className="py-2 px-2">A</th>
            <th className="py-2 px-2">B</th>
            <th className="py-2 px-2">Score</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">עודכן</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m: any) => {
            const A = map.get(String(m.a));
            const B = map.get(String(m.b));
            return (
              <tr
                key={String(m._id)}
                className="border-b border-black/5 dark:border-white/5"
              >
                <td className="py-2 px-2">
                  {A?.name ?? A?.email ?? String(m.a)}
                </td>
                <td className="py-2 px-2">
                  {B?.name ?? B?.email ?? String(m.b)}
                </td>
                <td className="py-2 px-2">{m.score}</td>
                <td className="py-2 px-2">{m.status}</td>
                <td className="py-2 px-2">
                  {new Date(m.updatedAt).toLocaleString()}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td className="py-6 px-2 opacity-60 text-center" colSpan={5}>
                אין נתונים להצגה.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
