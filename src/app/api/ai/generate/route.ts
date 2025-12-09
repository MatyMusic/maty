import { NextRequest, NextResponse } from "next/server";
import { provider } from "@/server/ai/provider";
import { getMongoClient } from "@/lib/db/mongo-client";
import type { AIGenInput, AITrack } from "@/types/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AIGenInput;
    if (!body?.prompt || !body?.durationSec) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const { jobId } = await provider.generate(body);

    const client = await getMongoClient();
    const db = client.db();
    const doc: AITrack = {
      userId: "anonymous",
      title: body.prompt.slice(0, 64),
      input: body,
      status: "queued",
      createdAt: new Date(),
      jobId,
    };

    const res = await db.collection("ai_tracks").insertOne(doc);
    return NextResponse.json({ ...doc, _id: String(res.insertedId) });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
