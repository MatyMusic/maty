// src/app/api/book/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";
import { randomUUID } from "crypto";
import { sendMail } from "@/lib/mailer";

function calcPrice(input: {
  baseHours?: number;
  extraHours?: number;
  soundSystem?: boolean;
  extraMusicians?: number;
  audience?: number;
  distanceKm?: number;
}) {
  const base = 2900;
  const extraHours = Math.max(0, input.extraHours ?? 0);
  const sound = input.soundSystem ? 500 : 0;
  const extraPlayers = Math.max(0, input.extraMusicians ?? 0) * 1800;
  const distance = (input.distanceKm ?? 0) > 100 ? 100 : 0;
  const total = base + extraHours * 200 + sound + extraPlayers + distance;
  return Math.max(0, Math.round(total));
}

function toBool(v: any) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true" || v === "1" || v === "on";
  return !!v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = (body?.name || "").toString().trim().slice(0, 120);
    const email = (body?.email || "").toString().trim().toLowerCase();
    const phone = (body?.phone || "").toString().trim().slice(0, 40);
    const eventDate = (body?.eventDate || "").toString().slice(0, 10);
    const note = (body?.note || "").toString().slice(0, 600);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return NextResponse.json(
        { ok: false, error: "invalid_date", message: "תאריך לא תקין." },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "missing_email", message: "מייל נדרש." },
        { status: 400 }
      );
    }

    const amount = calcPrice({
      baseHours: Number(body?.baseHours ?? 6),
      extraHours: Number(body?.extraHours ?? 0),
      soundSystem: toBool(body?.soundSystem),
      extraMusicians: Number(body?.extraMusicians ?? 0),
      audience: Number(body?.audience ?? 0),
      distanceKm: Number(body?.distanceKm ?? 0),
    });

    const availability = await getCollection("availability");
    const now = new Date();

    const isBusy = await availability.findOne({
      date: eventDate,
      status: "busy",
    });
    if (isBusy) {
      return NextResponse.json(
        {
          ok: false,
          error: "date_busy",
          message: "התאריך שבחרת תפוס. נסה/י תאריך אחר.",
        },
        { status: 409 }
      );
    }

    let liveHold = await availability.findOne({
      date: eventDate,
      status: "hold",
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    });

    let holdToken = liveHold?.token as string | undefined;
    let holdExpiresAt = liveHold?.expiresAt as Date | undefined;

    if (!holdToken || !holdExpiresAt) {
      holdToken = randomUUID();
      holdExpiresAt = new Date(Date.now() + 3 * 3600 * 1000);
      await availability.updateOne(
        { date: eventDate, status: "hold" },
        {
          $set: {
            date: eventDate,
            status: "hold",
            note: `Hold by booking (${email})`,
            expiresAt: holdExpiresAt,
            token: holdToken,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      liveHold = await availability.findOne({
        date: eventDate,
        status: "hold",
      });
    }

    const bookings = await getCollection("bookings");
    const ins = await bookings.insertOne({
      name,
      email,
      phone,
      eventDate,
      note: note || undefined,
      status: "pending",
      amount,
      payments: [],
      holdToken,
      holdExpiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_ORIGIN ||
      "http://localhost:3000";

    const pdfUrl = `${siteUrl}/api/bookings/${String(ins.insertedId)}/pdf`;

    const adminTo =
      process.env.BOOK_NOTIFICATIONS_TO ||
      process.env.BOOK_TO ||
      process.env.CONTACT_TO ||
      "";

    const mailHtml = `
      <h3>אישור הזמנה</h3>
      <p>שלום ${name || "חבר/ה"}, קיבלנו את ההזמנה שלך ל-${eventDate}.</p>
      <ul>
        <li><b>שם:</b> ${name || "-"}</li>
        <li><b>אימייל:</b> ${email}</li>
        <li><b>טלפון:</b> ${phone || "-"}</li>
        <li><b>תאריך אירוע:</b> ${eventDate}</li>
        <li><b>סכום משוער:</b> ${amount.toLocaleString("he-IL")} ₪</li>
      </ul>
      <p>הוחזקה לך החזקה זמנית לתאריך (פוקעת ב־ ${holdExpiresAt?.toLocaleString(
        "he-IL"
      )}).</p>
      <p style="margin:10px 0">
        <a href="${pdfUrl}">⬇ הורדת סיכום הזמנה (PDF)</a>
      </p>
      <p>ניצור קשר להשלים תשלום וסגירה.</p>
    `;

    (async () => {
      try {
        await sendMail({
          to: email,
          subject: `אישור הזמנה — ${eventDate}`,
          html: mailHtml,
          from:
            process.env.BOOK_FROM ||
            process.env.CONTACT_FROM ||
            "MATY MUSIC <no-reply@maty-music.local>",
        });
      } catch {}
    })();

    if (adminTo) {
      (async () => {
        try {
          await sendMail({
            to: adminTo,
            subject: `Booking חדשה: ${eventDate} — ${name || email}`,
            html: `
              <h3>התקבלה הזמנה חדשה</h3>
              <ul>
                <li><b>שם:</b> ${name || "-"}</li>
                <li><b>אימייל:</b> ${email}</li>
                <li><b>טלפון:</b> ${phone || "-"}</li>
                <li><b>תאריך אירוע:</b> ${eventDate}</li>
                <li><b>סכום:</b> ${amount.toLocaleString("he-IL")} ₪</li>
                <li><b>הערות:</b> ${note || "-"}</li>
              </ul>
              <p>Hold עד: ${holdExpiresAt?.toLocaleString(
                "he-IL"
              )} | token: ${holdToken}</p>
              <p><a href="${pdfUrl}">⬇ הורדת PDF</a></p>
            `,
          });
        } catch {}
      })();
    }

    return NextResponse.json({
      ok: true,
      message: "נוצרה החזקה זמנית ל־3 שעות. קיבלת מייל אישור + קישור ל-PDF.",
      bookingId: String(ins.insertedId),
      amount,
      hold: { token: holdToken, expiresAt: holdExpiresAt?.toISOString() },
      pdfUrl,
    });
  } catch (e) {
    console.error("[/api/book] error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
