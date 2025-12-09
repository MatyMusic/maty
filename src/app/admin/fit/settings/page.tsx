import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminFitSettings() {
  await requireAdmin("admin", {
    signInRedirect: "/auth?from=/admin/fit/settings",
  });
  return (
    <div className="p-4 space-y-2" dir="rtl">
      <h2 className="text-xl font-bold">הגדרות FIT (Placeholder)</h2>
      <p className="text-sm opacity-70">
        תצורות כלליות, הגבלות יצירה, חוקים, טקסטי אזהרה וכו׳.
      </p>
    </div>
  );
}
