export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

function deepDecode(s: string) {
  try {
    const once = decodeURIComponent(s);
    return once.includes("%") ? decodeURIComponent(once) : once;
  } catch {
    return s;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = deepDecode(params.userId);
    const body = await req.json().catch(() => ({}));
    const url: string | undefined = body?.url;

    if (!url) return j({ ok: false, error: "missing_url" }, { status: 400 });

    const col = await getCollection("date_profiles");
    // ודא שה־url נמצא בגלריה; אם לא—נדחוף אותו כדי שלא יעלם בעדכון עתידי
    await col.updateOne(
      { userId },
      {
        $set: { avatarUrl: url, updatedAt: new Date() },
        $addToSet: { photos: url },
      }
    );

    return j({ ok: true });
  } catch (e) {
    console.error("[POST avatar] error:", e);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
