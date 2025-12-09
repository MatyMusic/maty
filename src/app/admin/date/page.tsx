import { requireAdmin } from "@/lib/auth/requireAdmin";
import AdminDateDashboard from "@/components/admin/date/AdminDateDashboard";
import { getDateAdminStats } from "@/lib/db/date-admin";
import AdminDateNav from "@/components/admin/date/AdminDateNav";

export const metadata = { title: "דאשבורד · MATY-DATE" };
export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdmin("admin", { signInRedirect: "/auth?from=/admin/date" });

  const stats = await getDateAdminStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-extrabold">MATY-DATE · דאשבורד</h1>
      <AdminDateNav />
      <AdminDateDashboard initialStats={stats} />
    </div>
  );
}
