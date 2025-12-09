// src/app/api/upload/sign-cloudinary/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const {
    folder = "maty-music/nigunim",
    public_id,
    resource_type = "auto",
  } = (await req.json()) || {};

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, any> = {
    timestamp,
    folder,
    resource_type,
  };
  if (public_id) paramsToSign.public_id = public_id;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { ok: false, error: "MISSING_CLOUDINARY_ENV" },
      { status: 500 }
    );
  }

  const signature = crypto
    .createHash("sha1")
    .update(
      Object.keys(paramsToSign)
        .sort()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join("&") + apiSecret
    )
    .digest("hex");

  return NextResponse.json({
    ok: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    public_id: public_id || undefined,
    resource_type,
  });
}
