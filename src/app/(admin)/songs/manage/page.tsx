// src/app/(admin)/songs/manage/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSongsManager from "@/components/admin/AdminSongsManager";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "admin" && role !== "superadmin")) {
    redirect("/auth");
  }
  return <AdminSongsManager />;
}
