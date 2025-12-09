// src/app/api/upload/avatar/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authConfig);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return j({ ok: false, error: "no_file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadsDir, { recursive: true });
    const fsPath = path.join(uploadsDir, filename);
    await fs.writeFile(fsPath, buf);

    const url = `/uploads/avatars/${filename}`;

    // נשמור גם אצל המשתמש (נוח ל־Header/useResolvedAvatar)
    await User.updateOne(
      { email },
      { $set: { avatarUrl: url, avatarStrategy: "upload" } }
    );

    return j({ ok: true, url });
  } catch (e: any) {
    return j(
      { ok: false, error: e?.message || "upload_failed" },
      { status: 500 }
    );
  }
}
