import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData(); // Twilio שולחת x-www-form-urlencoded
  const status = form.get("MessageStatus") || form.get("SmsStatus");
  const sid = form.get("MessageSid");
  console.log("[twilio][status]", sid, status, Object.fromEntries(form as any));
  return NextResponse.text("OK");
}
