import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db/mongo-client";
import { ObjectId } from "mongodb";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const trackId = (body?.trackId || "").toString();
    const src = (body?.src || "genres").toString();

    if (!trackId || !/^[a-f\d]{24}$/i.test(trackId)) {
      return NextResponse.json(
        { ok: false, error: "bad_trackId" },
        { status: 400 }
      );
    }

    const ip = (
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      ""
    )
      .split(",")[0]
      .trim();
    const ua = req.headers.get("user-agent") || "";
    const salt =
      process.env.NEXTAUTH_SECRET || process.env.MONGODB_DB || "maty";
    const ipHash = ip
      ? crypto.createHmac("sha256", salt).update(ip).digest("hex")
      : undefined;
    const uaHash = ua
      ? crypto.createHash("sha256").update(ua).digest("hex")
      : undefined;

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB as string);

    await db.collection("plays").insertOne({
      trackId: new ObjectId(trackId),
      src,
      at: new Date(),
      ipHash,
      uaHash,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
