// src/app/api/contact/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import type { MailAttachment } from "@/lib/mail";
import sendMail from "@/lib/mail";

/* =============== Rate-limit (5 לדקה לפי IP) =============== */
const WINDOW_MS = 60_000;
const MAX_HITS = 5;
const bucket = new Map<string, { n: number; exp: number }>();

function getIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = bucket.get(ip);
  if (!rec || rec.exp < now) {
    bucket.set(ip, { n: 1, exp: now + WINDOW_MS });
    return false;
  }
  if (rec.n >= MAX_HITS) return true;
  rec.n++;
  return false;
}

/* ================== DB helper (best-effort) ================== */
async function insertContact(doc: any): Promise<string | null> {
  try {
    const mod: any = await import("@/lib/mongo");
    if (typeof mod?.getCollection === "function") {
      const col = await mod.getCollection("contact_messages");
      const { insertedId } = await col.insertOne(doc);
      return insertedId?.toString?.() ?? null;
    }
  } catch {
    // נמשיך ל־MongoClient ישיר
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  const client = await new MongoClient(uri, { maxPoolSize: 10 }).connect();
  try {
    const db = client.db(process.env.MONGODB_DB || "maty-music");
    await db.collection("contact_messages").createIndex({ createdAt: -1 });
    const { insertedId } = await db
      .collection("contact_messages")
      .insertOne(doc);
    return insertedId?.toString?.() ?? null;
  } finally {
    await client.close().catch(() => {});
  }
}

/* ======================= Utils ======================= */
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const sanitizePhone = (s: string) => s.replace(/[^\d+()\- ]+/g, "").trim();
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
const nl2br = (s: string) => s.replace(/\r\n|\r|\n/g, "<br/>");

const CONTACT_TO =
  process.env.CONTACT_TO ||
  process.env.ADMIN_EMAIL ||
  process.env.SMTP_USER ||
  "matymusic770@gmail.com";
const CONTACT_FROM =
  process.env.CONTACT_FROM ||
  (process.env.SMTP_USER
    ? `MATY MUSIC <${process.env.SMTP_USER}>`
    : "MATY MUSIC <no-reply@maty-music.local>");

/* ======================= Handler ======================= */
export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429 },
      );
    }

    // קריאת הגוף (JSON או multipart)
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let body: any = {};
    const files: MailAttachment[] = [];

    if (
      ct.includes("multipart/form-data") ||
      ct.includes("application/x-www-form-urlencoded")
    ) {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        if (v instanceof File) continue;
        body[k] = String(v);
      }
      const fileEntries = (fd.getAll("files") as unknown as File[]) || [];
      for (const f of fileEntries) {
        if (!(f instanceof File)) continue;
        if (f.size > MAX_FILE_SIZE) continue;
        const arr = await f.arrayBuffer();
        files.push({
          filename: f.name || "file",
          content: Buffer.from(arr),
          contentType: f.type || undefined,
        });
      }
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    // תמיכה בשדות ישנים
    const name = String(body.name ?? body.fullName ?? "").trim();
    const phone = sanitizePhone(String(body.phone ?? "").trim());
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const subject = String(body.subject ?? "פניה מהאתר").trim();
    const message = String(body.message ?? "").trim();
    const website = String(body.website ?? "").trim(); // honeypot

    const date = String(body.date ?? "").trim();
    const time = String(body.time ?? "").trim();
    const city = String(body.city ?? "").trim();
    const attendees = String(body.attendees ?? "").trim();

    if (!name || message.length < 2) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }
    if (email && !isEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "invalid_email" },
        { status: 400 },
      );
    }
    if (website) {
      // בוט → החזר הצלחה שקטה
      return NextResponse.json({ ok: true });
    }

    // שמירה למסד (best-effort)
    const doc = {
      name,
      phone: phone || null,
      email: email || null,
      subject,
      message,
      date: date || null,
      time: time || null,
      city: city || null,
      attendees: attendees || null,
      createdAt: new Date(),
      meta: { ua: req.headers.get("user-agent") || null, ip },
    };
    const insertedId = await insertContact(doc);

    // שליחת מייל — לא מפילים את הבקשה אם נכשל (נחזיר ok:true)
    try {
      const adminHtml = `
        <div dir="rtl" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
          <h2>📬 הודעת צור קשר — MATY MUSIC</h2>
          <ul style="margin:0 0 12px;padding:0;list-style:none">
            <li><b>שם:</b> ${esc(name)}</li>
            <li><b>טלפון:</b> ${esc(phone || "-")}</li>
            <li><b>אימייל:</b> ${esc(email || "-")}</li>
            <li><b>נושא:</b> ${esc(subject)}</li>
            <li><b>תאריך:</b> ${esc(date || "-")}</li>
            <li><b>שעה:</b> ${esc(time || "-")}</li>
            <li><b>עיר:</b> ${esc(city || "-")}</li>
            <li><b>משתתפים:</b> ${esc(attendees || "-")}</li>
          </ul>
          <div><b>הודעה:</b></div>
          <div style="white-space:pre-wrap;border:1px solid #eee;padding:8px;border-radius:8px">${esc(message)}</div>
          <hr>
          <small>id: ${insertedId ?? "-"} • ${new Date().toLocaleString("he-IL")}</small>
        </div>
      `;

      await sendMail({
        to: CONTACT_TO,
        from: CONTACT_FROM,
        subject: `צור קשר — ${name}`,
        html: adminHtml,
        text: `פניה חדשה מהאתר\nשם: ${name}\nאימייל: ${email || "-"}\nטלפון: ${phone || "-"}\nנושא: ${subject}\nתאריך: ${date || "-"}\nשעה: ${time || "-"}\nעיר: ${city || "-"}\nמשתתפים: ${attendees || "-"}\n---\n${message}`,
        replyTo: email || undefined,
        attachments: files,
        category: "general",
      });

      if (email) {
        await sendMail({
          to: email,
          from: CONTACT_FROM,
          subject: "קיבלנו את ההודעה שלך — MATY MUSIC",
          html: `<div dir="rtl"><h3>תודה ${esc(name)}</h3><p>קיבלנו את הפנייה שלך ונחזור בהקדם 🙌</p><small>MATY MUSIC</small></div>`,
          category: "general",
        });
      }
    } catch (err) {
      // אל תכשיל את הבקשה בגלל בעיית TLS/SMTP
      console.warn("[contact] mail error:", (err as any)?.message || err);
    }

    return NextResponse.json({ ok: true, id: insertedId ?? null });
  } catch (e) {
    console.error("[contact] error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
