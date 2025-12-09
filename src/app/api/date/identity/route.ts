import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getIdentity, upsertIdentity } from "@/lib/db/date-repo";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (s.user as any).id || s.user.email!;
  const doc = await getIdentity(userId);
  return NextResponse.json(doc || null);
}

export async function PUT(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (s.user as any).id || s.user.email!;
  const body = await req.json();
  const saved = await upsertIdentity({ ...body, userId });
  return NextResponse.json(saved);
}
