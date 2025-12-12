// src/app/api/events/request/route.ts
import { getCollection } from "@/lib/db/mongo";
import type { Collection } from "mongodb";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type EventRequestDoc = {
  _id?: any;
  createdAt: Date;
  fullName: string;
  phone: string;
  email?: string;
  eventDate?: string;
  eventType?: string;
  notes?: string;
  favSongIds: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fullName = (formData.get("fullName") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const eventDate = (formData.get("eventDate") || "").toString().trim();
    const eventType = (formData.get("eventType") || "").toString().trim();
    const notes = (formData.get("notes") || "").toString().trim();

    const userId = (formData.get("userId") || "").toString().trim();
    const userName = (formData.get("userName") || "").toString().trim();
    const userEmail = (formData.get("userEmail") || "").toString().trim();

    const favSongIdsRaw = (formData.get("favSongIds") || "").toString();
    const favSongIds = favSongIdsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!fullName || !phone) {
      return NextResponse.json(
        { ok: false, error: "חסר שם מלא או טלפון" },
        { status: 400 },
      );
    }

    const col: Collection<EventRequestDoc> =
      await getCollection<EventRequestDoc>("event_requests");

    const doc: EventRequestDoc = {
      createdAt: new Date(),
      fullName,
      phone,
      email,
      eventDate,
      eventType,
      notes,
      favSongIds,
      userId,
      userName,
      userEmail,
    };

    await col.insertOne(doc);

    // שליחת מייל אליך עם סיכום ההזמנה
    try {
      await sendEventRequestEmail(doc);
    } catch (mailErr) {
      console.error("[events.request] mail error:", mailErr);
      // לא מפיל את הלקוח – עדיין יראה success
    }

    // Redirect חזרה לעמוד עם success=1
    const url = new URL(req.url);
    url.pathname = "/events";
    url.searchParams.set("success", "1");

    return NextResponse.redirect(url.toString(), {
      status: 303,
    });
  } catch (err) {
    console.error("[events.request] error:", err);
    return NextResponse.json(
      { ok: false, error: "שגיאה פנימית" },
      { status: 500 },
    );
  }
}

async function sendEventRequestEmail(doc: EventRequestDoc) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    EVENT_REQUESTS_EMAIL_TO,
    EVENT_REQUESTS_EMAIL_FROM,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !EVENT_REQUESTS_EMAIL_TO
  ) {
    console.warn(
      "[events.request] missing SMTP / EVENT_REQUESTS_EMAIL_* env vars – skipping mail",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const subject = `בקשת אירוע חדשה מ-${doc.fullName} (${doc.eventType || "אירוע"})`;

  const lines: string[] = [];
  lines.push(`שם מלא: ${doc.fullName}`);
  lines.push(`טלפון: ${doc.phone}`);
  if (doc.email) lines.push(`אימייל: ${doc.email}`);
  if (doc.eventDate) lines.push(`תאריך משוער: ${doc.eventDate}`);
  if (doc.eventType) lines.push(`סוג אירוע: ${doc.eventType}`);
  lines.push("");
  if (doc.notes) {
    lines.push("הערות הלקוח:");
    lines.push(doc.notes);
    lines.push("");
  }
  if (doc.userId || doc.userEmail) {
    lines.push("פרטי משתמש במערכת MATY-MUSIC:");
    if (doc.userId) lines.push(`userId: ${doc.userId}`);
    if (doc.userName) lines.push(`userName: ${doc.userName}`);
    if (doc.userEmail) lines.push(`userEmail: ${doc.userEmail}`);
    lines.push("");
  }
  if (doc.favSongIds.length) {
    lines.push(
      `מספר שירים שסומנו: ${doc.favSongIds.length} (IDs מתוך ספריית השירים)`,
    );
    lines.push(doc.favSongIds.join(", "));
  } else {
    lines.push("לא סומנו שירים ספציפיים ברשימה.");
  }

  await transporter.sendMail({
    from: EVENT_REQUESTS_EMAIL_FROM || SMTP_USER,
    to: EVENT_REQUESTS_EMAIL_TO,
    subject,
    text: lines.join("\n"),
  });
}
