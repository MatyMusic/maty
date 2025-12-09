

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import fs from "node:fs";
import path from "node:path";

export type MailAttachment = {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
};

export type SendMailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: MailAttachment[];
  category?: "invoice" | "booking" | "general" | string;
};

let _cached: Transporter | null = null;

export function getTransport(): Transporter {
  if (_cached) return _cached;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // מצב דמו: לא שולח באמת, רק מדפיס את ההודעה ל-console
    _cached = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    } as any);
    return _cached;
  }

  _cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return _cached;
}

export async function verifyTransport(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await getTransport().verify();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

function pickFrom(explicit?: string): string {
  if (explicit) return explicit;
  return (
    process.env.INVOICES_FROM ||
    process.env.BOOK_FROM ||
    process.env.CONTACT_FROM ||
    "MATY MUSIC <no-reply@maty-music.local>"
  );
}

function wrapHtml(inner: string) {
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "MATY MUSIC";
  const reply = process.env.NEXT_PUBLIC_EMAIL || "matymusic770@gmail.com";
  const tel = process.env.NEXT_PUBLIC_PHONE_TEL || "";
  return `
  <div style="direction:rtl;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;background:#fff;padding:24px;line-height:1.55">
    <div style="max-width:640px;margin:auto">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <img src="cid:mm-logo" alt="${brand}" width="40" height="40" style="display:block;border-radius:8px"/>
        <h2 style="margin:0;font-weight:800">${brand}</h2>
      </div>
      <div style="border:1px solid #eee;border-radius:12px;padding:16px">${inner}</div>
      <div style="font-size:12px;opacity:.7;margin-top:16px">
        אימייל נשלח אוטומטית מהמערכת. מענה: ${reply}${
    tel ? " · טל׳ " + tel : ""
  }
      </div>
    </div>
  </div>`;
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendMail(opts: SendMailOptions) {
  const transporter = getTransport();
  const from = pickFrom(opts.from);

  const headers: Record<string, string> = {
    "X-Entity-Ref-ID": String(Date.now()),
    ...(opts.category ? { "X-Category": String(opts.category) } : {}),
    ...(opts.headers || {}),
  };

  const reply = process.env.NEXT_PUBLIC_EMAIL || "";
  if (reply)
    headers["List-Unsubscribe"] = `<mailto:${reply}?subject=unsubscribe>`;

  // הזרקת לוגו כ-CID אם לא צורף ידנית
  const attachments: MailAttachment[] = [...(opts.attachments || [])];
  const hasLogo = attachments.some((a) => a.cid === "mm-logo");
  if (!hasLogo) {
    const logoFile = ["logo-email.png", "icon-192.png"].find((f) =>
      fs.existsSync(path.join(process.cwd(), "public", f))
    );
    if (logoFile) {
      attachments.unshift({
        filename: "logo.png",
        path: path.join(process.cwd(), "public", logoFile),
        cid: "mm-logo",
        contentType: "image/png",
      });
    }
  }

  const info = await transporter.sendMail({
    to: opts.to,
    from,
    subject: opts.subject,
    html: wrapHtml(opts.html),
    text: opts.text || htmlToText(opts.html),
    cc: opts.cc,
    bcc: opts.bcc,
    replyTo: opts.replyTo || reply || undefined,
    headers,
    attachments,
  });

  if ((transporter as any).options?.streamTransport) {
    const out = (info as any)?.message?.toString?.() || "";
    console.log(
      "[mailer] (demo) built message (not sent). Subject:",
      opts.subject
    );
    if (out) console.log(out);
  }
  return info;
}

export default sendMail;
