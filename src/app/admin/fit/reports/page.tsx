import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminFitReports() {
  await requireAdmin("admin", {
    signInRedirect: "/auth?from=/admin/fit/reports",
  });
  return (
    <div className="p-4 space-y-2" dir="rtl">
      <h2 className="text-xl font-bold">דיווחים (Placeholder)</h2>
      <p className="text-sm opacity-70">
        כאן יגיעו דיווחים על קבוצות/משתמשים/תכנים ב-FIT כדי לטפל.
      </p>
    </div>
  );
}
