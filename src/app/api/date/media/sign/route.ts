import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { DATE_CONF } from "@/lib/date-config";
import { rateCheck, rlKeyFromReq } from "@/lib/rate-limit";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = (s.user as any).id || s.user.email!;
  const ip = req.headers.get("x-forwarded-for") || req.ip || "";
  const okRL = await rateCheck(
    rlKeyFromReq({ path: "/api/date/media/sign", userId: me, ip }),
    DATE_CONF.RATE_LIMIT.WINDOW_SEC,
    DATE_CONF.RATE_LIMIT.MAX_REQ
  );
  if (!okRL)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const ts = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_FOLDER || "maty-date/gallery";
  const public_id = `${me}-${ts}`;

  const cloud = getCloudinary();
  const paramsToSign: Record<string, string | number> = {
    timestamp: ts,
    folder,
    public_id,
  };

  const signature = cloud.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json(
    {
      ok: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      publicId: public_id,
      timestamp: ts,
      signature,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
