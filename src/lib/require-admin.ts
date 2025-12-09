import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function requireAdmin(
  req: NextRequest
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = (token as any)?.role;
    if (!token || !["admin", "superadmin"].includes(role)) {
      return {
        ok: false,
        res: NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        ),
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      res: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      ),
    };
  }
}



