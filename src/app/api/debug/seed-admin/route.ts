import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function POST() {
  const db = await getDb();
  const email = "matymusic770@gmail.com";
  await db
    .collection("users")
    .updateOne(
      { email: email.toLowerCase() },
      { $set: { role: "admin" } },
      { upsert: false }
    );
  return NextResponse.json({ ok: true, email, role: "admin" });
}
