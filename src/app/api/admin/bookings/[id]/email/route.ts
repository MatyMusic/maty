// src/app/api/admin/bookings/[id]/email/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

// לוגו כ-CID (inline). אם אין logo-email.png → נשתמש ב-icon-192.png
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

// HTML קצר ורספונסיבי (RTL)
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
          <a href="${SITE}" style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">כניסה לאתר</a>
        </div>
      </div>

      <div style="padding:14px 18px;border-top:1px solid #222;color:#9f9f9f;font-size:12px">
        maty-music.com • שירות לקוחות
      </div>
    </div>
  </div>`;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role ?? "user";
    if (!session || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const { id } = await ctx.params; // שים לב: await לפי Next 15
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "invalid_id" },
        { status: 400 }
      );
    }

    const col = await getCollection("bookings");
    const b = await col.findOne({ _id: new ObjectId(id) });
    if (!b)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );

    const transporter = createSmtpTransport();
    const logo = await loadInlineLogo();
    const pdfBuffer = await buildBookingPdfBuffer({
      id: String(b._id),
      name: b.name,
      email: b.email,
      phone: b.phone,
      eventDate: b.eventDate,
      amount: b.amount ?? 0,
      note: b.note,
      createdAt: b.createdAt,
    });

    const info = await transporter.sendMail({
      from: env("BOOK_FROM", env("SMTP_USER")),
      to: b.email,
      bcc: env("BOOK_NOTIFICATIONS_TO") || undefined,
      subject: `אישור הזמנה — MATY MUSIC`,
      html: renderBookingHtml({
        id: String(b._id),
        name: b.name,
        email: b.email,
        phone: b.phone,
        eventDate: b.eventDate,
        amount: b.amount ?? 0,
        note: b.note,
        createdAt: b.createdAt,
      }),
      attachments: [
        { filename: `booking-${String(b._id)}.pdf`, content: pdfBuffer },
        logo,
      ],
    });

    return NextResponse.json({ ok: true, id: info.messageId });
  } catch (e: any) {
    console.error("[email-admin]", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
