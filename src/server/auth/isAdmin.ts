// src/server/auth/isAdmin.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options"; // התאם לנתיב שלך

function adminAllowlist() {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").toLowerCase();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function serverIsAdmin(req?: NextRequest) {
  // 1) Session/DB
  const session = await getServerSession(authOptions).catch(() => null);
  const email = (session?.user?.email || "").toLowerCase();
  const role = (session as any)?.user?.role;
  const flag = (session as any)?.user?.isAdmin === true;
  const allowed = email && adminAllowlist().includes(email);
  if (role === "admin" || role === "superadmin" || flag || allowed) return true;

  // 2) Cookie “bypass” ידני (מופעל ע"י כפתור)
  try {
    // ב-Next 13/14 עם app router:
    // אם אתה בתוך Route Handler יש לך req?.cookies
    const cookieVal =
      (req as any)?.cookies?.get?.("mm_admin")?.value ??
      (typeof headers === "function"
        ? (await import("next/headers")).cookies().get("mm_admin")?.value
        : null);
    if (cookieVal === "1") return true;
  } catch {}

  return false;
}
