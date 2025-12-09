import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminFitWorkouts() {
  await requireAdmin("admin", {
    signInRedirect: "/auth?from=/admin/fit/workouts",
  });
  return (
    <div className="p-4 space-y-2" dir="rtl">
      <h2 className="text-xl font-bold">אימונים (Placeholder)</h2>
      <p className="text-sm opacity-70">
        כאן תראה/י אימונים פומביים או של משתמשים (לפי הרשאות), כלי חיפוש, מחיקות
        וכו׳.
      </p>
    </div>
  );
}
