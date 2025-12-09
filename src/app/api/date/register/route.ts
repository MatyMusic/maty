import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db/mongoose";
// אם יש לך מודל משתמש/פרופיל – תייבא כאן. לדוגמה:
// import Profile from "@/models/flub/Profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(100), // אם זה MVP – אפשר גם לאכוף רק min
  gender: z.enum(["male", "female"]).optional(),
  lookingFor: z.array(z.enum(["male", "female"])).optional(),
  musicGenres: z.array(z.string()).max(12).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // ודא שיש header מתאים (נסבול גם בלי)
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      // עדיין ננסה json – אבל אם זה נכשל נחזיר שגיאה "ידידותית"
    }

    const body = await req.json().catch(() => null); // אם מישהו שלח בלי JSON – לא נקרוס

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          details: parsed.error.flatten(),
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = parsed.data;

    // התחבר DB (אם צריך לשמור)
    await connectDB();

    // TODO: לוגיקת יצירה אמיתית:
    // const profile = await Profile.create({
    //   userId: `date_${crypto.randomUUID()}`,
    //   displayName: data.name,
    //   bio: "MATY-DATE",
    //   genres: data.musicGenres || [],
    // });

    // דמו נחמד – נניח ש"נרשם" בהצלחה
    const payload = {
      ok: true,
      // id: profile._id.toString(),
      next: "/date/welcome", // שהקליינט ינווט לשם
    };

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// אופציונלי – healthcheck ידידותי בדפדפן
export async function GET() {
  return NextResponse.json(
    { ok: true, name: "MATY-DATE Register API" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
