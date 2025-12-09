// src/app/api/quote/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const browser = await puppeteer.launch({
      // "new" אינו חוקי ב-v24; השתמש ב-true או "shell"
      headless: process.env.NODE_ENV === "production" ? "shell" : true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    // ... שאר הלוגיקה שלך ...
    await browser.close();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "failed" },
      { status: 500 }
    );
  }
}
