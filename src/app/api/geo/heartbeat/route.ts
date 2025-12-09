import { NextRequest, NextResponse } from "next/server";
import { upsertUserLocation } from "@/lib/db/geo";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user)
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    const userId = (session.user as any).id || session.user.email!;

    const { lat, lng } = await req.json().catch(() => ({}));
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return NextResponse.json(
        { ok: false, error: "bad_coords" },
        { status: 400 },
      );

    await upsertUserLocation(userId, Number(lat), Number(lng));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
