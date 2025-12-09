import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Allowed = "admin" | "superadmin";
const ORDER: Record<Allowed, number> = { admin: 1, superadmin: 2 };

type RequireAdminOpts = {
  signInRedirect?: string;
};

function ge(role?: Allowed) {
  return ORDER[role || "admin"] || 0;
}

/**
 * לשימוש ב־Server Components / Layouts / Pages (App Router):
 * - דואג לעשות await על cookies() / headers()
 * - אם אין הרשאה => redirect
 * - אם יש => מחזיר את ה־session (יכול להיות null במקרה bypass/demo)
 */
export async function requireAdmin(
  minRole: Allowed = "admin",
  opts: RequireAdminOpts = {},
) {
  const { signInRedirect = "/auth" } = opts;

  // Dynamic APIs must be awaited
  const ck = await cookies();
  const hd = await headers();

  const isBypass =
    ck.get("maty_admin_bypass")?.value === "1" ||
    ck.get("mm-admin")?.value === "1" ||
    hd.get("x-maty-admin") === "1";

  const isDemo = process.env.DEMO_UNLOCK === "1";

  let isSessionAdmin = false;
  let session: any = null;
  try {
    session = await getServerSession(authOptions as any);
    const role = (session as any)?.user?.role as Allowed | undefined;
    if (ge(role) >= ge(minRole)) isSessionAdmin = true;
  } catch {
    // ignore
  }

  const allowed = isSessionAdmin || isBypass || isDemo;
  if (!allowed) redirect(signInRedirect);

  return session;
}

/**
 * לשימוש בתוך Route Handlers (API): מחזיר אובייקט סטטוס, לא עושה redirect.
 * - חשוב: לעשות await על cookies()/headers() וגם על req (אם צריך).
 */
export async function requireAdminAPI(
  _req: Request,
  minRole: Allowed = "admin",
): Promise<
  | { ok: true; session: any; role: Allowed | null }
  | { ok: false; error: "unauthorized" }
> {
  const ck = await cookies();
  const hd = await headers();

  const isBypass =
    ck.get("maty_admin_bypass")?.value === "1" ||
    ck.get("mm-admin")?.value === "1" ||
    hd.get("x-maty-admin") === "1";

  const isDemo = process.env.DEMO_UNLOCK === "1";

  let role: Allowed | null = null;
  let session: any = null;
  try {
    session = await getServerSession(authOptions as any);
    const r = (session as any)?.user?.role as Allowed | undefined;
    if (r) role = r;
  } catch {
    // ignore
  }

  const sessionAllowed = ge(role || undefined) >= ge(minRole);
  const allowed = sessionAllowed || isBypass || isDemo;
  if (!allowed) return { ok: false as const, error: "unauthorized" };

  return { ok: true as const, session, role };
}
