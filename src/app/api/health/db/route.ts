// src/app/api/health/db/route.ts
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";

export async function GET() {
  try {
    await connectDB();
    const dbName = mongoose.connection.db?.databaseName || "unknown";
    const collections = await mongoose.connection.db
      ?.listCollections()
      .toArray();
    return Response.json({
      ok: true,
      dbName,
      collections: collections?.map((c) => c.name).slice(0, 10) || [],
      time: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[health/db] ERROR:", e?.message, e);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), {
      status: 500,
    });
  }
}
