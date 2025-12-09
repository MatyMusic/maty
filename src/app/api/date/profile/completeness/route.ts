// src/app/api/date/profile/completeness/route.ts
import {
  computeProfileCompleteness,
  type ProfileLike,
} from "@/lib/date/completeness";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompletenessRequestBody = {
  profile: ProfileLike;
};

type CompletenessSuccessResponse = {
  ok: true;
  percent: number;
  missingLabels: string[];
};

type CompletenessErrorResponse = {
  ok: false;
  error: string;
};

export async function POST(
  req: NextRequest,
): Promise<
  NextResponse<CompletenessSuccessResponse | CompletenessErrorResponse>
> {
  try {
    const body = (await req.json()) as CompletenessRequestBody | null;

    if (!body?.profile) {
      return NextResponse.json(
        { ok: false, error: "missing_profile" },
        { status: 400 },
      );
    }

    const result = computeProfileCompleteness(body.profile);

    return NextResponse.json(
      {
        ok: true,
        percent: result.percent,
        missingLabels: result.missingLabels,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/date/profile/completeness error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
