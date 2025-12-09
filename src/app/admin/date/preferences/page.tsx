// src/app/admin/date/preferences/page.tsx
import connectDB from "@/lib/db/mongoose";
import DatePreferences from "@/models/date/DatePreferences";
import DateProfile from "@/models/date/DateProfile";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

export default async function DatePreferencesPage() {
  await requireAdmin();
  await connectDB();

  // נשלוף עם Join ידני קטן: מביא שם/אימייל כדי שיהיה קריא בטבלה
  const prefs = await DatePreferences.find({})
    .sort({ updatedAt: -1 })
    .limit(300)
    .lean();
  const ids = prefs.map((p: any) => p.userId).filter(Boolean);
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
            <th className="py-2 px-2">שם</th>
            <th className="py-2 px-2">טווח גילאים</th>
            <th className="py-2 px-2">מרחק</th>
            <th className="py-2 px-2">זרמים</th>
            <th className="py-2 px-2">מטרות</th>
            <th className="py-2 px-2">עודכן</th>
          </tr>
        </thead>
        <tbody>
          {prefs.map((p: any) => {
            const pr = map.get(String(p.userId));
            return (
              <tr
                key={String(p._id)}
                className="border-b border-black/5 dark:border-white/5"
              >
                <td className="py-2 px-2">{pr?.name ?? pr?.email ?? "—"}</td>
                <td className="py-2 px-2">
                  {p.ageMin ?? "—"}–{p.ageMax ?? "—"}
                </td>
                <td className="py-2 px-2">{p.distanceKm ?? "—"} ק״מ</td>
                <td className="py-2 px-2">
                  {(p.denominations || []).join(", ") || "—"}
                </td>
                <td className="py-2 px-2">
                  {(p.goals || []).join(", ") || "—"}
                </td>
                <td className="py-2 px-2">
                  {new Date(p.updatedAt).toLocaleString()}
                </td>
              </tr>
            );
          })}
          {prefs.length === 0 && (
            <tr>
              <td className="py-6 px-2 opacity-60 text-center" colSpan={6}>
                אין נתונים להצגה.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
