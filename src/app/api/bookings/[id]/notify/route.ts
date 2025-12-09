// src/app/api/admin/bookings/[id]/notify/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getCollection } from "@/lib/mongo";
import { sendMail } from "@/lib/mailer";
import { buildICS } from "@/lib/ics";
import { ObjectId } from "mongodb";

type Kind = "approved" | "declined" | "hold" | "payment_link";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { kind, holdDays } = (await req.json().catch(() => ({ kind: "" }))) as {
    kind: Kind;
    holdDays?: number;
  };
  if (!kind)
    return NextResponse.json(
      { ok: false, error: "missing_kind" },
      { status: 400 }
    );

  const _id = new ObjectId(String(params.id));
  const bookings = await getCollection("bookings");
  const b: any = await bookings.findOne({ _id });
  if (!b)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  if (!b.email)
    return NextResponse.json({ ok: false, error: "no_email" }, { status: 400 });

  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "MATY MUSIC";
  const phone = process.env.NEXT_PUBLIC_PHONE_TEL || "";
  const from = process.env.CONTACT_FROM || `Robot <no-reply@maty-music.local>`;
  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  let subject = "";
  let body = "";
  let attachments: any[] = [];

  const icsIfRelevant = () => {
    if (!b.eventDate) return;
    const ics = buildICS({
      uid: `${_id}@matymusic`,
      summary: `${brand} – הופעה`,
      description: `הזמנה ל-${brand} בתאריך ${b.eventDate}${
        b.note ? `\\nהערה: ${b.note}` : ""
      }`,
      date: b.eventDate,
      location: b.location || "",
      organizerEmail: process.env.NEXT_PUBLIC_EMAIL || "matymusic770@gmail.com",
      attendeeEmail: b.email || undefined,
    });
    attachments.push({
      filename: `maty-music-${(b.eventDate || "event").replace(/-/g, "")}.ics`,
      content: ics,
      contentType: "text/calendar; charset=utf-8",
    });
  };

  if (kind === "approved") {
    subject = `הזמנה אושרה – ${brand}`;
    body = `
      <p>שלום ${b.name || ""},</p>
      <p>שמחים לאשר את ההזמנה לתאריך <b>${b.eventDate || "-"}</b>.</p>
      <p>סכום כולל: <b>₪${Number(b.amount || 0).toFixed(0)}</b></p>
      <p>לשאלות: ${phone}</p>
      <p>מצורף קובץ להוספה ליומן.</p>
    `;
    icsIfRelevant();
  } else if (kind === "declined") {
    subject = `הזמנה לא אושרה – ${brand}`;
    body = `
      <p>שלום ${b.name || ""},</p>
      <p>לצערנו לא ניתן לאשר את ההזמנה לתאריך <b>${b.eventDate || "-"}</b>.</p>
      <p>נשמח להציע תאריך חלופי.</p>
    `;
  } else if (kind === "hold") {
    const days = Math.max(1, Math.min(14, Number(holdDays || 7)));
    subject = `החזקה זמנית (${days} ימים) – ${brand}`;
    body = `
      <p>שלום ${b.name || ""},</p>
      <p>שריינו עבורך זמנית את התאריך <b>${
        b.eventDate || "-"
      }</b> למשך <b>${days}</b> ימים.</p>
      <p>כדי להשלים הזמנה, יש לאשר תשלום מקדמה.</p>
      <p>מצורף קובץ להוספה ליומן.</p>
    `;
    icsIfRelevant();
  } else if (kind === "payment_link") {
    const res = await fetch(
      `${origin}/api/admin/bookings/${String(_id)}/paylink`,
      { method: "POST", cache: "no-store" }
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) {
      return NextResponse.json(
        { ok: false, error: "paylink_failed", raw: j },
        { status: 400 }
      );
    }
    const approveUrl = j.approveUrl || "";
    const amount = Number(b.amount || 0);
    subject = `קישור לתשלום – ${brand}`;
    body = `
      <p>שלום ${b.name || ""},</p>
      <p>להשלמת ההזמנה לתאריך <b>${
        b.eventDate || "-"
      }</b>, ניתן לשלם בסך <b>₪${amount.toFixed(0)}</b> בלינק הבא:</p>
      ${
        approveUrl
          ? `<p><a href="${approveUrl}" target="_blank">לתשלום מאובטח</a></p>`
          : `<p><i>כרגע המסוף בהקמה – נחזור אליך לאישור תשלום.</i></p>`
      }
      ${
        j?.sandbox
          ? `<p style="color:#666;font-size:12px">מצב SANDBOX — קישור תצוגה בלבד.</p>`
          : ""
      }
    `;
  }

  await sendMail({
    to: b.email,
    from,
    subject,
    html: body,
    ...(attachments.length ? { /* @ts-ignore */ attachments } : {}),
  });

  return NextResponse.json({ ok: true });
}
