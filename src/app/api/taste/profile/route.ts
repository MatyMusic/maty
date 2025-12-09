import { NextResponse } from "next/server";
import TasteVector from "@/models/TasteVector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "missing_userId" },
      { status: 400 },
    );

  const tv = await TasteVector.findOne({ userId }).lean();
  return NextResponse.json({ ok: true, vector: tv || null });
}
