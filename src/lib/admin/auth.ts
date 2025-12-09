import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

export async function requireAdmin() {
  const session = await getServerSession(authConfig);
  const email = session?.user?.email || "";
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const ok = email && allow.includes(email.toLowerCase());
  if (!ok) {
    const err: any = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  return { email };
}
