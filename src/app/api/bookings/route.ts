// src/app/api/bookings/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";
import nodemailer from "nodemailer";
import path from "node:path";
import fs from "node:fs/promises";
import { buildBookingPdfBuffer } from "@/lib/booking-pdf";

function env(n: string, f = "") {
  return process.env[n] || f;
}
const SITE = env("NEXT_PUBLIC_SITE_ORIGIN", "https://maty-music.com");

// SMTP transport
function createSmtpTransport() {
  const port = Number(env("SMTP_PORT", "465"));
  return nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });
}

// לוגו inline (cid). אם אין logo-email.png → fallback ל-icon-192.png
async function loadInlineLogo() {
  let file = "logo-email.png";
  let full = path.join(process.cwd(), "public", file);
  try {
    await fs.access(full);
  } catch {
    file = "icon-192.png";
    full = path.join(process.cwd(), "public", file);
  }
  const content = await fs.readFile(full);
  return {
    filename: file,
    content,
    cid: "maty-logo@cid",
    contentType: "image/png",
  };
}

// HTML קצר ויפה (RTL)
function renderBookingHtml(b: {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string;
  amount: number;
  note?: string;
  createdAt?: string | Date;
}) {
  const ilDate = b.eventDate
    ? new Date(b.eventDate).toLocaleDateString("he-IL")
    : "—";
  const amount = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(b.amount ?? 0);
  const pdfUrl = `${SITE}/api/bookings/${b.id}/pdf`;

  return `
  <div dir="rtl" style="font:15px/1.7 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0b0b;color:#fafafa;padding:20px">
    <div style="max-width:700px;margin:auto;border-radius:16px;overflow:hidden;background:#111">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 18px;background:linear-gradient(135deg,#6C5CE7,#8b7bf0)">
        <img src="cid:maty-logo@cid" width="36" height="36" style="display:block;border-radius:10px" alt="MATY MUSIC"/>
        <div style="font-weight:900;font-size:16px;color:#fff;letter-spacing:.5px">MATY MUSIC</div>
      </div>

      <div style="padding:22px 18px">
        <h1 style="margin:0 0 8px 0;font-size:22px">אישור הזמנה</h1>
        <p style="margin:0 0 14px 0;color:#cfcfcf">שלום ${
          b.name || "לקוח/ה יקר/ה"
        }, קיבלנו את ההזמנה שלך לתאריך <b>${ilDate}</b>.</p>

        <ul style="margin:0 0 14px 0;padding:0 18px;color:#dcdcdc">
          <li><b>שם:</b> ${b.name || "—"}</li>
          <li><b>אימייל:</b> <a href="mailto:${
            b.email || ""
          }" style="color:#9aa8ff">${b.email || "—"}</a></li>
          <li><b>טלפון:</b> ${b.phone || "—"}</li>
          <li><b>תאריך אירוע:</b> ${ilDate}</li>
          <li><b>סכום משוער:</b> ${amount}</li>
        </ul>

        <p style="margin:0 0 14px 0"><a href="${pdfUrl}" style="color:#9aa8ff;text-decoration:none">⬇ הורדת סיכום הזמנה (PDF)</a></p>
        <p style="margin:0 0 18px 0;color:#bdbdbd">ניצור קשר לתיאום תשלום וסגירה.</p>

        <div style="margin-top:16px">
          <a href="${SITE}" style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">כניסה לאתר</a>
        </div>
      </div>

      <div style="padding:14px 18px;border-top:1px solid #222;color:#9f9f9f;font-size:12px">
        maty-music.com • שירות לקוחות
      </div>
    </div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    // נתוני ההזמנה מהטופס
    const body = await req.json().catch(() => ({}));
    const name = (body.fullName || body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const eventDate = (body.dateISO || body.eventDate || "").toString().trim(); // YYYY-MM-DD
    const amount = Number(body?.breakdown?.total ?? body.amount ?? 0);
    const note = (body.notes || body.note || "").toString();

    if (!email || !eventDate) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }

    // שמירה ב־Mongo
    const col = await getCollection("bookings");
    const now = new Date();
    const doc = {
      name,
      email,
      phone,
      eventDate,
      amount,
      note: note || null,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    };
    const ins = await col.insertOne(doc as any);
    const id = String(ins.insertedId);

    // PDF
    const pdfBuffer = await buildBookingPdfBuffer({
      id,
      name,
      email,
      phone,
      eventDate,
      amount,
      note,
      createdAt: now,
    });

    // מייל ללקוח + BCC למנהל
    const transporter = createSmtpTransport();
    const logo = await loadInlineLogo();
    await transporter.sendMail({
      from: env("BOOK_FROM", env("SMTP_USER")),
      to: email,
      bcc: env("BOOK_NOTIFICATIONS_TO") || undefined,
      subject: "אישור הזמנה — MATY MUSIC",
      html: renderBookingHtml({
        id,
        name,
        email,
        phone,
        eventDate,
        amount,
        note,
        createdAt: now,
      }),
      attachments: [
        {
          filename: `booking-${id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
        logo,
      ],
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error("[booking-create]", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
