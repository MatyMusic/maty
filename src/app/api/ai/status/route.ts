// import { NextRequest, NextResponse } from "next/server";
// import { provider } from "@/server/ai/provider";
// import { getMongoClient } from "@/lib/db/mongo-client";
// import { ObjectId } from "mongodb";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// export async function GET(req: NextRequest) {
//   try {
//     const id = new URL(req.url).searchParams.get("id");
//     if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

//     const client = await getMongoClient();
//     const db = client.db();
//     const doc = await db
//       .collection("ai_tracks")
//       .findOne({ _id: new ObjectId(id) });
//     if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

//     const st = await provider.status(doc.jobId);
//     const next = {
//       ...doc,
//       status: st.status,
//       audioUrl: st.audioUrl ?? doc.audioUrl,
//       mime: st.mime ?? doc.mime,
//       error: st.error,
//     };

//     await db
//       .collection("ai_tracks")
//       .updateOne({ _id: doc._id }, { $set: next });
//     // החזרת _id כמחרוזת
//     return NextResponse.json({ ...next, _id: String(doc._id) });
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: e?.message || "server_error" },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/ai/status/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  const enabled =
    process.env.NEXT_PUBLIC_AI_ENABLED === "1" && !!process.env.OPENAI_API_KEY;

  // אפשר להרחיב כאן בדיקות לפי משתמש/תפקיד/קריטריונים אחרים
  return Response.json(
    {
      enabled,
      model: enabled ? process.env.NEXT_PUBLIC_AI_MODEL || "gpt-4o-mini" : null,
    },
    { status: 200 },
  );
}
