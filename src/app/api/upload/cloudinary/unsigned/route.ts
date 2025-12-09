import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // מאפשר עבודה נוחה עם FormData

export async function POST(req: NextRequest) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET!;
  const folder = process.env.CLOUDINARY_FOLDER || "maty-date";

  if (!cloud || !preset) {
    return NextResponse.json(
      { error: "Cloudinary env missing" },
      { status: 500 }
    );
  }

  const fd = await req.formData();
  fd.append("upload_preset", preset);
  fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    {
      method: "POST",
      body: fd as any,
    }
  );

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
