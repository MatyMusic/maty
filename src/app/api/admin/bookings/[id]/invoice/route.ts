// src/app/api/admin/bookings/[id]/invoice/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";
import { requireAdmin } from "@/lib/require-admin";
import { sendMail } from "@/lib/mailer";

async function makePdfBuffer(data: {
  number: string;
  customer: { name?: string; email?: string };
  date: string;     // YYYY-MM-DD
  items: { title: string; qty: number; unitPrice: number }[];
  subtotal: number;
  total: number;
}) {
  try {
    // נסיון להפיק PDF עם pdf-lib (אם מותקן)
    // npm i pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const draw = (text: string, x: number, y: number, size = 12) =>
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });

    let y = 800;
    draw("MATY MUSIC", 50, y, 18); y -= 24;
    draw(`חשבונית: ${data.number}`, 50, y); y -= 18;
    draw(`תאריך: ${data.date}`, 50, y); y -= 28;

    draw(`לכבוד: ${data.customer.name || ""}`, 50, y); y -= 16;
    draw(`אימייל: ${data.customer.email || ""}`, 50, y); y -= 28;

    draw("פריטים:", 50, y); y -= 16;
    data.items.forEach((it) => {
      draw(`• ${it.title}  x${it.qty}  —  ₪${(it.unitPrice).toFixed(0)}`, 60, y);
      y -= 14;
    });
    y -= 10;
    draw(`ביניים: ₪${data.subtotal.toFixed(0)}`, 50, y); y -= 16;
    draw(`סה״כ לתשלום: ₪${data.total.toFixed(0)}`, 50, y, 14);

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch {
    return null; // נשלח בלי קובץ
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const _id = new ObjectId(String(params.id));
  const bookings = await getCollection("bookings");
  const b: any = await bookings.findOne({ _id });
  if (!b) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const amount = Number(b.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "no_amount" }, { status: 400 });
  }

  // מספר חשבונית
  const d = new Date();
  const num = `MM-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(d.getTime()).slice(-5)}`;

  const invoice = {
    number: num,
    issuedAt: new Date().toISOString(),
    total: amount,
    items: [{ title: "מופע חי", qty: 1, unitPrice: amount }],
  };

  // עדכון במסמך ההזמנה
  await bookings.updateOne(
    { _id },
    {
      $set: {
        invoice: { number: invoice.number, total: invoice.total, issuedAt: invoice.issuedAt, items: invoice.items },
      },
    }
  );

  // הפקת PDF (אם אפשר) + שליחה במייל ללקוח
  try {
    const pdf = await makePdfBuffer({
      number: invoice.number,
      customer: { name: b.name, email: b.email },
      date: (b.eventDate || new Date().toISOString().slice(0,10)),
      items: invoice.items,
      subtotal: amount,
      total: amount,
    });

    if (b.email) {
      await sendMail({
        to: b.email,
        from: process.env.INVOICES_FROM || process.env.CONTACT_FROM || "MATY MUSIC <no-reply@maty-music.local>",
        subject: `חשבונית ${invoice.number} – MATY MUSIC`,
        html: `
          <p>שלום ${b.name || ""},</p>
          <p>מצ״ב חשבונית עבור המופע בתאריך <b>${b.eventDate || "-"}</b>, בסך <b>₪${amount.toFixed(0)}</b>.</p>
          <p>תודה,<br/>MATY MUSIC</p>
        `,
        ...(pdf ? { /* @ts-ignore */ attachments: [{ filename: `${invoice.number}.pdf`, content: pdf, contentType: "application/pdf" }] } : {}),
      });
    }
  } catch {/* לא עוצר אם המייל נכשל */}

  return NextResponse.json({ ok: true, invoice });
}
