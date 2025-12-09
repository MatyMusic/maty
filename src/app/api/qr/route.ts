// src/app/api/qr/route.ts
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "";
  if (!url) return new NextResponse("missing url", { status: 400 });

  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    width: 256,
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
