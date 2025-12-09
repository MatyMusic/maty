import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await auth().catch(() => null);
  return NextResponse.json({
    ok: true,
    hasSession: !!s,
    user: s?.user
      ? {
          id: (s.user as any).id ?? (s.user as any)._id ?? null,
          email: s.user.email ?? null,
        }
      : null,
  });
}
