// src/app/api/date/music-affinity/route.ts
import {
  totalAffinity,
  type AffinityResult,
  type MusicVector,
} from "@/lib/date/affinity";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type MusicAffinityRequestBody = {
  baseScore?: number;
  distanceKm?: number;
  meMusic?: MusicVector;
  otherMusic?: MusicVector;
};

type MusicAffinitySuccessResponse = {
  ok: true;
  result: AffinityResult;
};

type MusicAffinityErrorResponse = {
  ok: false;
  error: string;
};

export async function POST(
  req: NextRequest,
): Promise<
  NextResponse<MusicAffinitySuccessResponse | MusicAffinityErrorResponse>
> {
  try {
    const body = (await req.json()) as MusicAffinityRequestBody | null;

    if (!body?.meMusic || !body?.otherMusic) {
      return NextResponse.json(
        { ok: false, error: "missing_music_vectors" },
        { status: 400 },
      );
    }

    const result = totalAffinity({
      baseScore: body.baseScore ?? 0,
      distanceKm: body.distanceKm,
      meMusic: body.meMusic,
      otherMusic: body.otherMusic,
    });

    return NextResponse.json(
      {
        ok: true,
        result,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/date/music-affinity error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
