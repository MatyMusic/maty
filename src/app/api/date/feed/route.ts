import { NextRequest, NextResponse } from "next/server";
import { searchMatches } from "@/lib/db/date-repo";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const filters = {
    limit: Number(params.get("limit") || 20),
    cursor: params.get("cursor") || undefined,
    country: params.get("country") || undefined,
    city: params.get("city") || undefined,
    gender: params.get("gender") as any,
    looking_for: params.get("goal") as any,
    hasPhoto: params.get("hasPhoto") === "1",
  };
  const { items, nextCursor } = await searchMatches(filters);
  return NextResponse.json({ ok: true, items, nextCursor });
}
