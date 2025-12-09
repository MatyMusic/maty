export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { getDateAdminStats } from "@/lib/db/date-admin";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  // וידוא תפקיד Admin
  await connectDB();
  const me = await User.findOne({ email: session.user.email }).lean();
  if (!me || !["admin", "superadmin"].includes(me.role)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  const stats = await getDateAdminStats();
  return NextResponse.json(
    { ok: true, stats },
    { headers: { "Cache-Control": "no-store" } }
  );
}
