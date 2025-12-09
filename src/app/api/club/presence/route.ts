
// src/app/api/club/presence/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { touchPresence, listOnline } from "@/lib/db/presence";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function GET() {
  try {
    const rows = await listOnline();
    return j({ ok: true, online: rows });
  } catch {
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user)
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    const userId = (session.user as any).id || session.user.email!;
    await touchPresence(userId, "web");
    return j({ ok: true });
  } catch {
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}
