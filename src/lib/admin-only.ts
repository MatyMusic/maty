// src/lib/admin-only.ts
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

export async function requireAdmin() {
  const session = await getServerSession(authConfig);
  const email = session?.user?.email?.toLowerCase() || "";
  const allow =
    !!email &&
    (process.env.ADMIN_EMAILS || "")
      .toLowerCase()
      .split(/[,\s]+/)
      .includes(email);
  if (!allow) {
    const err: any = new Error("forbidden");
    err.status = 403;
    throw err;
  }
}
