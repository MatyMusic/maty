import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = String(body?.path || "/");
    const ref = body?.ref ? String(body.ref) : null;

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "0";
    const ua = req.headers.get("user-agent") || "";
    const hash = (s: string) =>
      crypto.createHash("sha256").update(s).digest("hex");

    const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
    await db.collection("pageviews").insertOne({
      path,
      ref,
      at: new Date(),
      ipHash: hash(ip),
      uaHash: hash(ua),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
