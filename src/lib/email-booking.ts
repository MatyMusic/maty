// src/lib/email-booking.ts
import nodemailer from "nodemailer";
import path from "node:path";
import fs from "node:fs/promises";
import { buildBookingPdfBuffer } from "@/lib/booking-pdf";

type BookingEmailPayload = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  createdAt?: string | Date;
};

// קריאת משתנה סביבה עם פולבאק
function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

// URL בסיסי לאתר (לינקים במייל + תצוגת תמונות)
const SITE = env("NEXT_PUBLIC_SITE_ORIGIN", "https://maty-music.com");

// טרנספורטר SMTP משותף
export function createSmtpTransport() {
  const port = Number(env("SMTP_PORT", "465"));
  return nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });
}

// מעלה לוגו כ-CID (inline). אם אין public/logo-email.png → ננסה icon-192.png
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
    cid: "maty-logo@cid", // חייב להתאים ל-src="cid:maty-logo@cid"
    contentType: "image/png",
  };
}

// גוף HTML (RTL) – קצר, רספונסיבי, כהה/בהיר
export function renderBookingHtml(b: BookingEmailPayload) {
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
        <h1 style="margin:0 0 8px 0;font-size:22px;letter-spacing:.3px">אישור הזמנה</h1>
        <p style="margin:0 0 14px 0;color:#cfcfcf">שלום ${
          b.name || "לקוח/ה יקר/ה"
        }, קיבלנו את ההזמנה שלך לתאריך <b>${ilDate}</b>.</p>

        <ul style="margin:0 0 14px 0;padding:0 18px;color:#dcdcdc">
          <li><b>שם:</b> ${b.name || "—"}</li>
          <li><b>אימייל:</b> <a href="mailto:${
            b.email
          }" style="color:#9aa8ff">${b.email || "—"}</a></li>
          <li><b>טלפון:</b> ${b.phone || "—"}</li>
          <li><b>תאריך אירוע:</b> ${ilDate}</li>
          <li><b>סכום משוער:</b> ${amount}</li>
        </ul>

        <p style="margin:0 0 14px 0">
          <a href="${pdfUrl}" style="color:#9aa8ff;text-decoration:none">⬇ הורדת סיכום הזמנה (PDF)</a>
        </p>

        <p style="margin:0 0 18px 0;color:#bdbdbd">ניצור קשר לתיאום תשלום וסגירה.</p>

        <div style="margin-top:16px">
          <a href="${SITE}"
             style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">
             כניסה לאתר
          </a>
        </div>
      </div>

      <div style="padding:14px 18px;border-top:1px solid #222;color:#9f9f9f;font-size:12px">
        maty-music.com • שירות לקוחות
      </div>
    </div>
  </div>
  `;
}

// שולח מייל ללקוח (עם PDF מצורף + לוגו inline)
export async function sendBookingEmailToCustomer(b: BookingEmailPayload) {
  const transporter = createSmtpTransport();
  const logo = await loadInlineLogo();
  const pdfBuffer = await buildBookingPdfBuffer(b);

  const info = await transporter.sendMail({
    from: env("BOOK_FROM", env("SMTP_USER")),
    to: b.email,
    bcc: env("BOOK_NOTIFICATIONS_TO") || undefined,
    subject: `אישור הזמנה — MATY MUSIC`,
    html: renderBookingHtml(b),
    attachments: [
      { filename: `booking-${b.id}.pdf`, content: pdfBuffer },
      logo,
    ],
  });

  return info.messageId;
}

// (רשות) שליחה ידנית מהאדמין – אותה תבנית
export async function sendBookingEmailAdmin(b: BookingEmailPayload) {
  return sendBookingEmailToCustomer(b);
}
