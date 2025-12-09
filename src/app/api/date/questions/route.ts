import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/date/questions
 * body: { answers: { questionId:number; answer:string }[] }
 * הערה: כרגע שומר רק בלוג/מדמה שמירה. חבר למונגו/פרופיל כשנוח לך.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { answers } = body || {};
  if (!Array.isArray(answers)) {
    return NextResponse.json(
      { ok: false, error: "invalid payload" },
      { status: 400 }
    );
  }
  console.log("[date/questions] save", answers);
  return NextResponse.json({ ok: true });
}
