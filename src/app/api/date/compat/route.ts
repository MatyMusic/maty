// src/app/api/date/compat/route.ts
import {
  totalAffinity,
  type AffinityResult,
  type MusicVector,
} from "@/lib/date/affinity";
import { computeScore } from "@/lib/date/compat";
import type { DateProfile } from "@/lib/date/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompatRequestBody = {
  me: DateProfile;
  other: DateProfile;
  distanceKm?: number;
  meMusic?: MusicVector;
  otherMusic?: MusicVector;
};

type CompatSuccessResponse = {
  ok: true;
  baseScore: number;
  affinity: AffinityResult;
};

type CompatErrorResponse = {
  ok: false;
  error: string;
};

export async function POST(
  req: NextRequest,
): Promise<NextResponse<CompatSuccessResponse | CompatErrorResponse>> {
  try {
    const body = (await req.json()) as CompatRequestBody | null;

    if (!body?.me || !body?.other) {
      return NextResponse.json(
        { ok: false, error: "missing_profiles" },
        { status: 400 },
      );
    }

    // ציון בסיסי לפי DateProfile (כבר קיים אצלך בליבה)
    const baseScore = computeScore(body.me, body.other);

    // הרחבה עם מוזיקה + מרחק – הכל דרך הפונקציה הקיימת totalAffinity
    const affinity = totalAffinity({
      baseScore,
      distanceKm: body.distanceKm,
      meMusic: body.meMusic,
      otherMusic: body.otherMusic,
    });

    return NextResponse.json(
      {
        ok: true,
        baseScore,
        affinity,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/date/compat error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
