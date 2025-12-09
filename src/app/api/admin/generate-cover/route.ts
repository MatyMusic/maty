// src/app/api/admin/generate-cover/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, artist, category } = body ?? {};

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[generate-cover] missing OPENAI_API_KEY");
      return NextResponse.json(
        { ok: false, error: "אין מפתח OpenAI מוגדר בשרת" },
        { status: 500 },
      );
    }

    const prompt = `Album cover art for a ${category || "music"} track called "${title || "Track"}" by ${artist || "Maty Music"}, vibrant, modern, high quality, square 1:1, no text.`;

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("AI image error:", data);
      const code = data?.error?.code as string | undefined;

      // 🔴 אין קרדיט / הגעת לגבול החיוב – מחזירים עטיפה דיפולטית במקום 500
      if (code === "billing_hard_limit_reached") {
        return NextResponse.json({
          ok: true,
          // תעדכן לנתיב של תמונה משלך ב-public
          url: "/assets/covers/ai-fallback.png",
          note: "billing_hard_limit_reached",
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.message || "שגיאה ביצירת עטיפה מה-AI (שרת OpenAI)",
        },
        { status: res.status || 500 },
      );
    }

    const url: string | undefined = data?.data?.[0]?.url;
    if (!url) {
      console.error("[generate-cover] no URL from OpenAI:", data);
      return NextResponse.json(
        { ok: false, error: "לא התקבלה כתובת תמונה מה-AI" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    console.error("[generate-cover] fatal error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    );
  }
}
