import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies(); // 👈 ב-Next 15 צריך await
    const mm = cookieStore.get("mm_uid");
    const userId = mm?.value || null;

    return NextResponse.json({
      ok: true,
      loggedIn: !!userId,
      userId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, loggedIn: false, error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
