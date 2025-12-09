// src/lib/db/club-promotions.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Collection, type IndexDescription } from "mongodb";

export type PromoPlacement =
  | "feed_top"
  | "feed_middle"
  | "feed_bottom"
  | "sidebar"
  | "interstitial";

export type PromotionDoc = {
  _id?: ObjectId;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaText?: string | null;
  link?: string | null;
  couponCode?: string | null;

  placement: PromoPlacement;
  weight?: number; // ככל שגבוה — נשלף יותר
  active: boolean;
  startsAt?: string | null; // ISO
  endsAt?: string | null; // ISO

  createdBy?: string | null; // userId
  createdAt: string; // ISO
  updatedAt?: string | null;

  // אנליטיקות בסיסיות
  impressions?: number;
  clicks?: number;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}

async function col(): Promise<Collection<PromotionDoc>> {
  const cli = await clientPromise;
  const c = cli.db(dbName()).collection<PromotionDoc>("club_promotions");

  // אינדקסים בטוחים
  const wanted: Array<IndexDescription & { name: string; unique?: boolean }> = [
    {
      key: { active: 1, placement: 1, weight: -1, startsAt: -1 },
      name: "active_placement_weight",
    },
    { key: { createdAt: -1, _id: -1 }, name: "created_desc" },
    { key: { endsAt: 1 }, name: "endsAt" },
  ];
  const exist = await c
    .listIndexes()
    .toArray()
    .catch(() => []);
  const have = new Set(exist.map((i: any) => i.name));
  for (const idx of wanted) {
    if (!have.has(idx.name)) {
      try {
        await c.createIndex(idx.key as any, {
          name: idx.name,
          unique: !!idx.unique,
        });
      } catch {}
    }
  }
  return c;
}

function nowISO() {
  return new Date().toISOString();
}

export async function listPromotions(opts?: {
  placement?: PromoPlacement;
  activeOnly?: boolean;
  limit?: number;
}) {
  const C = await col();
  const q: any = {};
  if (opts?.placement) q.placement = opts.placement;
  if (opts?.activeOnly) q.active = true;

  // מסנן תוקף זמנים כשה-activeOnly=true
  if (opts?.activeOnly) {
    const now = nowISO();
    q.$and = [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ];
  }

  const rows = await C.find(q)
    .sort({ active: -1, weight: -1, createdAt: -1, _id: -1 })
    .limit(Math.min(Math.max(opts?.limit ?? 50, 1), 200))
    .toArray();

  return rows;
}

export async function getPromotion(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const C = await col();
  return C.findOne({ _id: new ObjectId(id) });
}

export async function createPromotion(input: Partial<PromotionDoc>) {
  const C = await col();
  const doc: PromotionDoc = {
    title: String(input.title || "")
      .trim()
      .slice(0, 140),
    body: input.body ? String(input.body).slice(0, 1000) : null,
    imageUrl: input.imageUrl ? String(input.imageUrl) : null,
    ctaText: input.ctaText ? String(input.ctaText).slice(0, 60) : null,
    link: input.link ? String(input.link) : null,
    couponCode: input.couponCode ? String(input.couponCode).slice(0, 60) : null,
    placement: (input.placement as PromoPlacement) || "feed_top",
    weight: Number.isFinite(input.weight) ? Number(input.weight) : 1,
    active: !!input.active,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    createdBy: input.createdBy || null,
    createdAt: nowISO(),
    updatedAt: null,
    impressions: 0,
    clicks: 0,
  };
  const r = await C.insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

export async function updatePromotion(
  id: string,
  patch: Partial<PromotionDoc>,
) {
  if (!ObjectId.isValid(id)) throw new Error("invalid id");
  const C = await col();
  const set: Partial<PromotionDoc> = {
    title: patch.title ? String(patch.title).slice(0, 140) : undefined,
    body:
      patch.body !== undefined
        ? String(patch.body || "").slice(0, 1000)
        : undefined,
    imageUrl:
      patch.imageUrl !== undefined ? String(patch.imageUrl || "") : undefined,
    ctaText:
      patch.ctaText !== undefined
        ? String(patch.ctaText || "").slice(0, 60)
        : undefined,
    link: patch.link !== undefined ? String(patch.link || "") : undefined,
    couponCode:
      patch.couponCode !== undefined
        ? String(patch.couponCode || "").slice(0, 60)
        : undefined,
    placement: (patch.placement as PromoPlacement) || undefined,
    weight: Number.isFinite(patch.weight) ? Number(patch.weight) : undefined,
    active:
      patch.active === true || patch.active === false
        ? patch.active
        : undefined,
    startsAt: patch.startsAt === null ? null : patch.startsAt || undefined,
    endsAt: patch.endsAt === null ? null : patch.endsAt || undefined,
    updatedAt: nowISO(),
  };
  Object.keys(set).forEach(
    (k) => (set as any)[k] === undefined && delete (set as any)[k],
  );
  await C.updateOne({ _id: new ObjectId(id) }, { $set: set });
  return getPromotion(id);
}

export async function deletePromotion(id: string) {
  if (!ObjectId.isValid(id)) return { ok: false };
  const C = await col();
  const r = await C.deleteOne({ _id: new ObjectId(id) });
  return { ok: r.acknowledged };
}

export async function bumpImpression(id: string) {
  if (!ObjectId.isValid(id)) return;
  const C = await col();
  await C.updateOne({ _id: new ObjectId(id) }, { $inc: { impressions: 1 } });
}
export async function bumpClick(id: string) {
  if (!ObjectId.isValid(id)) return;
  const C = await col();
  await C.updateOne({ _id: new ObjectId(id) }, { $inc: { clicks: 1 } });
}
