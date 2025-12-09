// src/app/api/flub/beats/route.ts
import connectDB from "@/lib/db/mongoose";
import Beat from "@/models/club/Beat";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1),
  genre: z.string().optional(),
  bpm: z.number().int().min(40).max(220).optional(),
  provider: z.enum(["suno", "riffusion", "stable-audio", "openai"]).optional(),
  audioUrl: z.string().url().optional(), // חדש: אפשר לתת URL מוכן
});

// placeholder – כאן בעתיד מחברים למנוע AI אמיתי
async function generateBeatAudioUrl(_opts: {
  title: string;
  genre?: string;
  bpm?: number;
  provider?: "suno" | "riffusion" | "stable-audio" | "openai";
}): Promise<string> {
  // כרגע: לא מייצר באמת, רק זורק שגיאה כדי שתדע שצריך לחבר
  throw new Error("AI beat generation לא מחובר עדיין (generateBeatAudioUrl).");
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, genre, bpm, provider, audioUrl } = parsed.data;

  try {
    let finalUrl = audioUrl;

    if (!finalUrl) {
      // אם לא נשלח audioUrl מוכן – ננסה לייצר דרך AI (בעתיד)
      try {
        finalUrl = await generateBeatAudioUrl({
          title,
          genre,
          bpm,
          provider,
        });
      } catch (e: any) {
        console.error("[flub/beats] AI generation failed:", e?.message || e);
        return NextResponse.json(
          {
            ok: false,
            error:
              "לא התקבל audioUrl וה־AI ליצירת ביטים לא מחובר עדיין. שלח audioUrl מוכן או חבר את generateBeatAudioUrl.",
          },
          { status: 502 },
        );
      }
    }

    const doc = await Beat.create({
      ownerId: "system", // אפשר לעדכן בהמשך ל-userId אמיתי
      title,
      genre,
      bpm,
      aiProvider: provider,
      audioUrl: finalUrl,
    });

    return NextResponse.json({ ok: true, beat: doc });
  } catch (err: any) {
    console.error("[flub/beats][POST] error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "שגיאה בשמירת ה־Beat." },
      { status: 500 },
    );
  }
}

export async function GET() {
  await connectDB();
  const items = await Beat.find().sort({ createdAt: -1 }).limit(50);
  return NextResponse.json({ ok: true, items });
}
