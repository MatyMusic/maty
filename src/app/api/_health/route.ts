// src/app/api/_health/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    const ready = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json(
        { ok: false, mongo: { ready }, error: "Missing MONGODB_URI" },
        { status: 500 }
      );
    }
    // אם לא מחובר – ננסה להתחבר (לא חובה אם יש לך סינגלטון)
    if (ready === 0) {
      await mongoose.connect(uri, { autoIndex: true, maxPoolSize: 10 } as any);
    }
    return NextResponse.json({
      ok: true,
      mongo: {
        readyState: mongoose.connection.readyState,
        dbName: mongoose.connection.db?.databaseName || null,
      },
      nextauth: {
        url: process.env.NEXTAUTH_URL || null,
        secret: !!process.env.NEXTAUTH_SECRET,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
