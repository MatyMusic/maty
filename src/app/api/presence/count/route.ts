export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Presence from "@/lib/db/models/Presence";

export async function GET() {
  await connectDB();
  const since = new Date(Date.now() - 60_000);
  const online = await Presence.countDocuments({ lastSeen: { $gte: since } });
  return NextResponse.json(
    { online },
    { headers: { "Cache-Control": "no-store" } },
  );
}
