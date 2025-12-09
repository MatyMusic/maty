// src/app/api/geo/ping/route.ts
import { NextResponse } from "next/server";
import { setGeo } from "@/lib/liveStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uid, lat, lon, name } = await req.json();
    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { ok: false, error: "missing_uid" },
        { status: 400 },
      );
    }
    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { ok: false, error: "bad_coords" },
        { status: 400 },
      );
    }
    setGeo({ uid, lat, lon, name: typeof name === "string" ? name : null });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "err" },
      { status: 500 },
    );
  }
}
