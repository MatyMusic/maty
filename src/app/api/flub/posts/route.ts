import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Post from "@/models/club/Post"; // ⬅️ דיפולט מהקובץ, לא מה-barrel
import { z } from "zod";

const schema = z.object({
  text: z.string().max(500).optional(),
  genre: z.string().optional(),
  trackUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  await connectDB();
  const items = await Post.find().sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ ok: true, items });
}

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
  const doc = await Post.create({
    authorId: "temp-user", // TODO: להחליף ל-session.user.id
    ...parsed.data,
  });
  return NextResponse.json({ ok: true, post: doc });
}
