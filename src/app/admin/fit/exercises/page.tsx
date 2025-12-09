import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminFitExercises() {
  await requireAdmin("admin", {
    signInRedirect: "/auth?from=/admin/fit/exercises",
  });
  return (
    <div className="p-4 space-y-2" dir="rtl">
      <h2 className="text-xl font-bold">תרגילים (Placeholder)</h2>
      <p className="text-sm opacity-70">
        כאן תנהל/י מטאדאטה לתרגילים (סנכרון API, תיוג שרירים, ציוד וכו׳).
      </p>
    </div>
  );
}
