import { auth } from "@/lib/auth";
import { createUserMessage } from "@/lib/messages";
import db from "@/lib/mongoose";
import User from "@/models/User";
import { NextResponse } from "next/server";

type Mode = "single-id" | "single-email" | "broadcast";

type BodyType = {
  mode: Mode;
  userId?: string;
  email?: string;
  kind: string;
  title: string;
  body: string;
  meta?: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const session = await auth();

    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== "admin" && role !== "superadmin")) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as BodyType;

    if (!body?.mode || !body.title || !body.body) {
      return NextResponse.json(
        { ok: false, error: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    await db(); // חיבור למונגוס + User

    const kind = body.kind || "system";
    let createdCount = 0;

    // === מצב 1: לפי User ID ===
    if (body.mode === "single-id") {
      if (!body.userId) {
        return NextResponse.json(
          { ok: false, error: "userId חסר" },
          { status: 400 },
        );
      }

      await createUserMessage({
        userId: String(body.userId),
        kind,
        title: body.title,
        body: body.body,
        meta: body.meta,
      });
      createdCount = 1;
    }

    // === מצב 2: לפי Email ===
    if (body.mode === "single-email") {
      if (!body.email) {
        return NextResponse.json(
          { ok: false, error: "email חסר" },
          { status: 400 },
        );
      }

      const email = body.email.toLowerCase();
      const u = await User.findOne({ email }, { _id: 1 }).lean();

      if (!u?._id) {
        return NextResponse.json(
          { ok: false, error: "לא נמצא משתמש עם האימייל הזה" },
          { status: 404 },
        );
      }

      await createUserMessage({
        userId: String(u._id),
        kind,
        title: body.title,
        body: body.body,
        meta: body.meta,
      });
      createdCount = 1;
    }

    // === מצב 3: broadcast ===
    if (body.mode === "broadcast") {
      const users = await User.find({}, { _id: 1 }).lean();

      if (!users.length) {
        return NextResponse.json(
          { ok: false, error: "אין משתמשים לשלוח אליהם הודעה" },
          { status: 404 },
        );
      }

      for (const u of users) {
        await createUserMessage({
          userId: String(u._id),
          kind,
          title: body.title,
          body: body.body,
          meta: body.meta,
        });
        createdCount++;
      }
    }

    return NextResponse.json({ ok: true, createdCount }, { status: 200 });
  } catch (err) {
    console.error("Admin messages API error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
