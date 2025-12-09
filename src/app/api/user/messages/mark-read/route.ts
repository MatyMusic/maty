// src/app/api/user/messages/mark-read/route.ts
import { getMongoClient } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth";

const DB_NAME = process.env.MONGODB_DB || "maty-music";
const COLLECTION = "user-messages";

type MarkReadBody = {
  id?: string;
  read?: boolean;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // אימות (אם תרצה להשתמש ב-auth)
    // const session = await auth();
    // const userId = session?.user?.id ? String(session.user.id) : null;
    // if (!userId) {
    //   return NextResponse.json(
    //     { ok: false, error: "UNAUTHORIZED" },
    //     { status: 401 },
    //   );
    // }

    const body = (await req.json().catch(() => null)) as MarkReadBody | null;

    if (!body || !body.id) {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID" },
        { status: 400 },
      );
    }

    const read = body.read === true;

    const client = await getMongoClient("main");
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const _id = new ObjectId(body.id);

    // אם אתה רוצה לוודא שייך לאותו user – תוסיף גם userId ל-query
    const res = await col.updateOne({ _id }, { $set: { read } });

    return NextResponse.json(
      {
        ok: true,
        matched: res.matchedCount,
        modified: res.modifiedCount,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/user/messages/mark-read error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
