// src/server/email/sendBooking.ts
import { sendMail } from "@/lib/mailer";
import { renderBookingEmailHTML } from "@/lib/email-templates";
import { buildBookingPdfBuffer } from "@/lib/booking-pdf";
import { buildBookingICS } from "@/lib/ics";
import { sendSms, sendWhatsApp, buildBookingTextMessage } from "@/lib/notify";

export async function sendBookingConfirmation(args: {
  to: string;                 // אימייל הלקוח
  bookingId: string;
  name: string;
  email: string;
  phone?: string;             // לטקסט/וואטסאפ
  eventDate: string;          // YYYY-MM-DD
  amount: number;
  note?: string;
  notifySms?: boolean;        // אם true נשלח SMS
  notifyWhatsApp?: boolean;   // אם true נשלח WA
}) {
  const pdfBuffer = await buildBookingPdfBuffer({
    id: args.bookingId,
    name: args.name,
    email: args.email,
    phone: args.phone,
    eventDate: args.eventDate,
    amount: args.amount,
    note: args.note,
    createdAt: new Date(),
  });

  const icsBuffer = buildBookingICS({
    date: args.eventDate,
    summary: `MATY MUSIC – אירוע של ${args.name}`,
    description: `אישור הזמנה ${args.bookingId}`,
    uid: args.bookingId,
  });

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "http://localhost:3000";

  // שליחת אימייל עם PDF + ICS
  await sendMail({
    to: args.to,
    subject: "אישור הזמנה — MATY MUSIC",
    category: "booking",
    html: renderBookingEmailHTML({
      site: siteOrigin.replace(/^https?:\/\//, ""),
      bookingUrl: `${siteOrigin}/orders/${encodeURIComponent(args.bookingId)}`,
      name: args.name,
      eventDate: args.eventDate,
      amount: `${args.amount.toLocaleString("he-IL")} ₪`,
    }),
    attachments: [
      { filename: `order-${args.bookingId}.pdf`, content: pdfBuffer, contentType: "application/pdf" },
      { filename: `event-${args.bookingId}.ics`, content: icsBuffer, contentType: "text/calendar" },
    ],
  });

  // טקסט/וואטסאפ (אופציונלי, אם יש טלפון)
  if (args.phone && (args.notifySms || args.notifyWhatsApp)) {
    const msg = buildBookingTextMessage({
      name: args.name,
      dateISO: args.eventDate,
      amountILS: args.amount,
      bookingId: args.bookingId,
      siteUrl: siteOrigin,
    });

    // שולחים לפי דגלים; אם אין קונפיג של Twilio – יעבור למצב demo (console.log)
    if (args.notifySms)      await sendSms(args.phone, msg);
    if (args.notifyWhatsApp) await sendWhatsApp(args.phone, msg);
  }
}
