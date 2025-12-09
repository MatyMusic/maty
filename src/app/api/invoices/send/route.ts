import { NextResponse } from "next/server";
import { getTransport } from "@/lib/mail";

export async function POST(req: Request) {
  const {
    to,
    subject,
    html,
    pdfBufferBase64,
    filename = "invoice.pdf",
  } = await req.json();
  const transporter = getTransport();

  const info = await transporter.sendMail({
    to,
    from: process.env.INVOICES_FROM!,
    subject,
    html,
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBufferBase64, "base64"),
        contentType: "application/pdf",
      },
    ],
  });

  return NextResponse.json({ ok: true, messageId: info.messageId });
}
