// src/lib/billing.ts
import clientPromise from "@/lib/mongodb";
import { Db } from "mongodb";

export type Membership = {
  _id?: string;
  userId: string;
  plan: "free" | "plus" | "pro";
  status: "active" | "past_due" | "canceled";
  activeUntil?: string | null; // ISO
  provider?: "stripe" | "manual";
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  updatedAt: string; // ISO
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

export async function getMembership(userId: string): Promise<Membership> {
  const db = await getDb();
  const C = db.collection("billing_memberships");
  const m = (await C.findOne({ userId })) as Membership | null;
  if (!m) {
    return {
      userId,
      plan: "free",
      status: "active",
      activeUntil: null,
      provider: "manual",
      updatedAt: new Date().toISOString(),
    };
  }
  return m;
}

export async function setMembership(
  userId: string,
  patch: Partial<Membership>,
) {
  const db = await getDb();
  const C = db.collection("billing_memberships");
  const now = new Date().toISOString();
  const cur = await getMembership(userId);
  const next: Membership = {
    ...cur,
    ...patch,
    userId,
    updatedAt: now,
  };
  await C.updateOne({ userId }, { $set: next }, { upsert: true });
  return next;
}

/** בדיקת “פעיל” (כולל activeUntil) */
export function isMembershipActive(m: Membership) {
  if (m.status !== "active") return false;
  if (!m.activeUntil) return true;
  try {
    return new Date(m.activeUntil).getTime() > Date.now();
  } catch {
    return false;
  }
}

/** האם עומד בדרישת תכנית */
export function planGte(actual: Membership["plan"], need: Membership["plan"]) {
  const order = ["free", "plus", "pro"] as const;
  return order.indexOf(actual) >= order.indexOf(need);
}
