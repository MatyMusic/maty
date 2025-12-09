// src/lib/payments/db.ts
import { getCollection } from "@/lib/mongodb";
import type { PaymentDoc, Subscription, PaymentStatus } from "./types";

/** ----------------------------------------------------------------
 *  Users collection shape (לצרכי אינדקסים בלבד)
 *  ---------------------------------------------------------------- */
type UserDoc = {
  userId: string;
  subscription?: Subscription;
  createdAt?: string;
  updatedAt?: string;
} & Record<string, any>;

/** ----------------------------------------------------------------
 *  Index bootstrap (runs once per server process)
 *  ---------------------------------------------------------------- */
const _ready = (async () => {
  // payments indexes
  const payments = await getCollection<PaymentDoc>("payments");
  try {
    await payments.createIndex(
      { pmid: 1 },
      { unique: true, name: "pmid_unique" },
    );
  } catch {}
  try {
    await payments.createIndex(
      { userId: 1, createdAt: -1 },
      { name: "user_createdAt" },
    );
  } catch {}
  try {
    await payments.createIndex(
      { status: 1, createdAt: -1 },
      { name: "status_createdAt" },
    );
  } catch {}
  try {
    await payments.createIndex({ providerRef: 1 }, { name: "providerRef" });
  } catch {}
  try {
    await payments.createIndex(
      { catalog: 1, itemId: 1 },
      { name: "catalog_itemId" },
    );
  } catch {}
  try {
    await payments.createIndex(
      { userId: 1, catalog: 1, status: 1, createdAt: -1 },
      { name: "user_catalog_status_createdAt" },
    );
  } catch {}

  // users indexes
  const users = await getCollection<UserDoc>("users");
  try {
    await users.createIndex(
      { userId: 1 },
      { unique: true, name: "userId_unique" },
    );
  } catch {}
  try {
    await users.createIndex(
      { "subscription.lastPaymentId": 1 },
      { name: "sub_lastPaymentId" },
    );
  } catch {}
})();

/** ----------------------------------------------------------------
 *  Payments CRUD
 *  ---------------------------------------------------------------- */
export async function createPayment(
  doc: Omit<PaymentDoc, "_id">,
): Promise<PaymentDoc> {
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");

  const now = new Date().toISOString();
  const payload: Omit<PaymentDoc, "_id"> = {
    ...doc,
    createdAt: doc.createdAt ?? now,
    updatedAt: doc.updatedAt ?? now,
  };

  try {
    await col.insertOne(payload as any);
    return payload;
  } catch (e: any) {
    // Duplicate pmid safeguard — מחזיר את הרשומה הקיימת (idempotent)
    if (e?.code === 11000) {
      const existing = await col.findOne({ pmid: doc.pmid });
      if (existing) return existing as PaymentDoc;
    }
    throw e;
  }
}

export async function updatePayment(
  pmid: string,
  patch: Partial<PaymentDoc>,
): Promise<void> {
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");
  await col.updateOne(
    { pmid },
    { $set: { ...patch, updatedAt: new Date().toISOString() } },
  );
}

export async function markPaymentStatus(
  pmid: string,
  status: PaymentStatus,
): Promise<void> {
  await updatePayment(pmid, { status });
}

/** עדכון מטא־דאטה בלי round-trip — דוט־נוטיישן */
export async function appendPaymentMeta(
  pmid: string,
  metaPatch: Record<string, any>,
): Promise<void> {
  if (!metaPatch || typeof metaPatch !== "object") return;
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");

  const $set: Record<string, any> = { updatedAt: new Date().toISOString() };
  for (const [k, v] of Object.entries(metaPatch)) {
    $set[`meta.${k}`] = v;
  }
  await col.updateOne({ pmid }, { $set });
}

export async function getPaymentByPMID(pmid: string) {
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");
  return col.findOne({ pmid });
}

export async function getPaymentByProviderRef(providerRef: string) {
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");
  return col.findOne({ providerRef });
}

export async function listPaymentsForUser(userId: string, limit = 50) {
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");
  return col
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 200)))
    .toArray();
}

/** חיתוך לפי קטלוג/סטטוס (נוח לדוחות/מסכים) */
export async function listUserPaymentsBy(
  userId: string,
  opts?: {
    catalog?: PaymentDoc["catalog"];
    status?: PaymentStatus;
    limit?: number;
  },
) {
  await _ready;
  const col = await getCollection<PaymentDoc>("payments");
  const q: any = { userId };
  if (opts?.catalog) q.catalog = opts.catalog;
  if (opts?.status) q.status = opts.status;
  const limit = Math.max(1, Math.min(opts?.limit ?? 100, 500));
  return col.find(q).sort({ createdAt: -1 }).limit(limit).toArray();
}

/** ----------------------------------------------------------------
 *  Subscription helpers (users collection)
 *  ---------------------------------------------------------------- */
export async function setUserSubscription(userId: string, s: Subscription) {
  await _ready;
  const col = await getCollection<UserDoc>("users");
  const now = new Date().toISOString();
  await col.updateOne(
    { userId },
    {
      $set: { subscription: s, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

/** Partial-merge גרסה — מאחד עם הקיים בזהירות */
export async function patchUserSubscription(
  userId: string,
  patch: Partial<Subscription>,
) {
  await _ready;
  const col = await getCollection<UserDoc>("users");
  const now = new Date().toISOString();

  const cur = await col.findOne(
    { userId },
    { projection: { subscription: 1 } as any },
  );
  const merged: Subscription = {
    ...(cur?.subscription ?? {}),
    ...patch,
  } as Subscription;

  await col.updateOne(
    { userId },
    {
      $set: { subscription: merged, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

export async function getUserSubscription(userId: string) {
  await _ready;
  const col = await getCollection<UserDoc>("users");
  const u = await col.findOne(
    { userId },
    { projection: { subscription: 1 } as any },
  );
  return (u as any)?.subscription as Subscription | undefined;
}
