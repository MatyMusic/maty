import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Gift from "@/models/club/Gift"; // ⬅️ דיפולט
import { z } from "zod";

const schema = z.object({
  toUserId: z.string(),
  kind: z.string(),
  amount: z.number().optional(),
  message: z.string().optional(),
  postId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const doc = await Gift.create({
    fromUserId: "temp-user", // TODO: session.user.id
    ...parsed.data,
  });
  return NextResponse.json({ ok: true, gift: doc });
}
