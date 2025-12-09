export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session || (session as any).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // ...לוגיקה אדמין...
  return NextResponse.json({ ok: true, data: [] });
}
