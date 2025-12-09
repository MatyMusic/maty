// src/app/api/dev/test-email/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getTransport } from "@/lib/mailer"; // משאיר את ספריית המיילר שלך

function maskEmail(e?: string) {
  if (!e) return "";
  const i = e.indexOf("@");
  return i > 2 ? e.slice(0, 2) + "***" + e.slice(i) : "***";
}

export async function GET() {
  try {
    const transporter: any = getTransport();

    const isDemo = !!transporter?.options?.streamTransport;
    const host = process.env.SMTP_HOST || "";
    const port = Number(process.env.SMTP_PORT || 0);
    const user = process.env.SMTP_USER || "";
    const to =
      process.env.BOOK_NOTIFICATIONS_TO || user || process.env.CONTACT_TO || "";

    // מצב DEMO – חסרים פרטי SMTP
    if (isDemo) {
      return NextResponse.json(
        {
          ok: false,
          demo: true,
          error: "smtp_demo_mode",
          hint: "השלים/י SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (.env.local). ב-Gmail יש להשתמש ב-App Password.",
          env: { host, port, user: maskEmail(user) },
        },
        { status: 400 }
      );
    }

    // בדיקת חיבור SMTP לפני שליחה
    await transporter.verify();

    const info = await transporter.sendMail({
      from: process.env.BOOK_FROM || `MATY MUSIC <${user}>`,
      to: to || user,
      subject: "בדיקת שליחה — MATY MUSIC (לוקאלי)",
      html: `<div dir="rtl" style="font-family:system-ui">
               ✅ מייל בדיקה יצא בהצלחה מהשרת המקומי.<br/>
               תאריך: ${new Date().toLocaleString("he-IL")}
             </div>`,
    });

    return NextResponse.json({
      ok: true,
      demo: false,
      messageId: info?.messageId || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        message: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}
