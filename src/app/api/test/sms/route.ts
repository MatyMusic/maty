import { NextResponse } from "next/server";
import { sendSms, buildBookingTextMessage } from "@/lib/notify";

export async function GET() {
  const to = "+972547700019"; // המספר שלך
  const body = buildBookingTextMessage({
    name: "טסט",
    dateISO: "2025-09-01",
    amountILS: 2900,
    bookingId: "MATY-TEST",
    siteUrl: process.env.NEXT_PUBLIC_SITE_ORIGIN || "http://localhost:3000",
  });
  const res = await sendSms(to, body);
  return NextResponse.json(res);
}
