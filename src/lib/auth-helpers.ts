import type { Session } from "next-auth";

export function isAdminSession(session: Session | null | undefined) {
  const role = (session as any)?.user?.role;
  return role === "admin" || role === "superadmin";
}
