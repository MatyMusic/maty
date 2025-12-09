export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import connectDB from "@/lib/db/mongoose";
import Presence from "@/lib/db/models/Presence";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authConfig as any).catch(() => null);
  const ua = req.headers.get("user-agent") || "";
  const path = req.headers.get("referer") || "";

  // מזהה אנונימי פר-לקוח
  const ip = req.headers.get("x-forwarded-for") || "0";
  const anonId = Buffer.from(
    encodeURIComponent(`${ip}:${ua}`).slice(0, 80),
  ).toString("base64");

  await Presence.updateOne(
    { anonId },
    {
      $set: {
        userId: (session as any)?.user?.email || null,
        ua,
        path,
        lastSeen: new Date(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
