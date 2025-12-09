import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { addMedia, listMedia, removeMedia } from "@/lib/db/date-media";
import { DATE_CONF } from "@/lib/date-config";
import { rateCheck, rlKeyFromReq } from "@/lib/rate-limit";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = (s.user as any).id || s.user.email!;
  const items = await listMedia(me);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = (s.user as any).id || s.user.email!;

  const ip = req.headers.get("x-forwarded-for") || req.ip || "";
  const okRL = await rateCheck(
    rlKeyFromReq({ path: "/api/date/media", userId: me, ip }),
    DATE_CONF.RATE_LIMIT.WINDOW_SEC,
    DATE_CONF.RATE_LIMIT.MAX_REQ
  );
  if (!okRL)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const publicId = body?.publicId as string | undefined;
  const secureUrl = body?.secureUrl as string | undefined;
  if (!publicId || !secureUrl)
    return NextResponse.json({ error: "bad_body" }, { status: 400 });

  // בדיקת כמות
  const current = await listMedia(me);
  if (current.length >= DATE_CONF.MAX_MEDIA_PER_USER) {
    return NextResponse.json({ error: "media_limit" }, { status: 403 });
  }

  await addMedia(me, publicId, secureUrl);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = (s.user as any).id || s.user.email!;

  const url = new URL(req.url);
  const pid = url.searchParams.get("publicId");
  if (!pid)
    return NextResponse.json({ error: "publicId_required" }, { status: 400 });

  // מחיקת ענן (best effort)
  try {
    const cloud = getCloudinary();
    await cloud.uploader.destroy(pid, {
      resource_type: "image",
      invalidate: true,
    });
  } catch {
    /* ignore */
  }

  await removeMedia(me, pid);
  return NextResponse.json({ ok: true });
}
