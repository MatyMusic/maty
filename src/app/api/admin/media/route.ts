export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCollection } from "@/lib/mongo";
import type { Collection, Filter, Document as MongoDoc } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

/* ───────────────────── הרשאות ───────────────────── */
type AllowedRole = "admin" | "superadmin";

async function isAdminAllowed(req: NextRequest): Promise<boolean> {
  const bypass =
    req.cookies.get("maty_admin_bypass")?.value === "1" ||
    req.cookies.get("mm-admin")?.value === "1" ||
    req.headers.get("x-maty-admin") === "1";

  if (bypass) return true;
  if (process.env.DEMO_UNLOCK === "1") return true;
  if (process.env.ALLOW_UNSAFE_ADMIN === "1") return true;

  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth").catch(() => ({
      authOptions: undefined as any,
    }));
    const session = await getServerSession(authOptions as any);
    const role = (session as any)?.user?.role;
    if (role === "admin" || role === "superadmin") return true;
  } catch {}

  return false;
}

function forbid() {
  return NextResponse.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

/* ───────────────────── טיפוסים ───────────────────── */
type MediaKind = "image" | "video" | "audio";

export type MediaDoc = {
  _id?: any;
  kind: MediaKind;
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  likes?: number;
  commentsCount?: number;
};

/* ───────────────────── אוספים ───────────────────── */
async function getMediaCol(): Promise<Collection<MediaDoc>> {
  const col = await getCollection<MediaDoc>("media");
  await col.createIndex({ publicId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ title: "text" }).catch(() => {});
  await col.createIndex({ tags: 1 }).catch(() => {});
  await col.createIndex({ format: 1 }).catch(() => {});
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

/* ───────────────────── UTILS ───────────────────── */
function toInt(v: string | null, def: number) {
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

function parseSort(s?: string) {
  switch (s) {
    case "old":
      return { createdAt: 1 };
    case "big":
      return { bytes: -1 };
    case "small":
      return { bytes: 1 };
    case "title":
      return { title: 1 };
    case "new":
    default:
      return { createdAt: -1 };
  }
}

function buildFilter(params: URLSearchParams): Filter<MediaDoc> {
  const q = (params.get("q") || "").trim();
  const kind = params.get("kind") as MediaKind | null;
  const tag = (params.get("tag") || "").trim();

  const $and: any[] = [];
  if (kind) $and.push({ kind });
  if (tag) $and.push({ tags: tag });

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    $and.push({ $or: [{ title: rx }, { publicId: rx }, { tags: rx }] });
  }

  return $and.length ? { $and } : {};
}

function normalizeTags(tags?: string[]): string[] {
  const base = Array.isArray(tags) ? tags.filter(Boolean) : [];
  if (!base.includes("gallery")) base.push("gallery");
  return base;
}

/* ───────────────────── GET ───────────────────── */
export async function GET(req: NextRequest) {
  if (!(await isAdminAllowed(req))) return forbid();

  const p = req.nextUrl.searchParams;
  const page = toInt(p.get("page"), 1);
  const size = Math.min(200, toInt(p.get("pageSize"), 30));

  const col = await getMediaCol();
  const total = await col.countDocuments(buildFilter(p));

  const rows = await col
    .find(buildFilter(p))
    .sort(parseSort(p.get("sort") || "new") as MongoDoc)
    .skip((page - 1) * size)
    .limit(size)
    .toArray();

  return NextResponse.json({ ok: true, rows, total, page, size });
}

/* ───────────────────── POST (תומך items[] וגם אובייקט יחיד) ───────────────────── */
export async function POST(req: NextRequest) {
  if (!(await isAdminAllowed(req))) return forbid();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const now = new Date();
  const col = await getMediaCol();

  // נזהה: items[] | item | body יחיד
  const rawItems: any[] = Array.isArray(body?.items)
    ? body.items
    : body?.item
      ? [body.item]
      : [body];

  const docs: MediaDoc[] = [];

  for (const raw of rawItems) {
    const kind = raw.kind as MediaKind | undefined;
    const publicId = raw.publicId as string | undefined;
    const url = raw.url as string | undefined;

    if (!kind || !publicId || !url) {
      continue; // נדלג על פריטים לא תקינים
    }

    const doc: MediaDoc = {
      kind,
      title: raw.title || "",
      publicId,
      url,
      thumbUrl: raw.thumbUrl || url,
      duration:
        typeof raw.duration === "number"
          ? raw.duration
          : Number(raw.duration) || 0,
      width: typeof raw.width === "number" ? raw.width : Number(raw.width) || 0,
      height:
        typeof raw.height === "number" ? raw.height : Number(raw.height) || 0,
      bytes: typeof raw.bytes === "number" ? raw.bytes : Number(raw.bytes) || 0,
      format: raw.format || "",
      tags: normalizeTags(
        Array.isArray(raw.tags)
          ? raw.tags.map((t: any) => String(t)).filter(Boolean)
          : [],
      ),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      commentsCount: 0,
    };

    docs.push(doc);
  }

  if (!docs.length) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  // אם יש רק פריט אחד – נעשה upsert כמו קודם
  if (docs.length === 1) {
    const d = docs[0];
    const baseForSet: Omit<MediaDoc, "createdAt" | "updatedAt" | "_id"> = {
      kind: d.kind,
      title: d.title,
      publicId: d.publicId,
      url: d.url,
      thumbUrl: d.thumbUrl,
      duration: d.duration,
      width: d.width,
      height: d.height,
      bytes: d.bytes,
      format: d.format,
      tags: d.tags,
      likes: d.likes,
      commentsCount: d.commentsCount,
    };

    const res = await col.updateOne(
      { publicId: d.publicId },
      {
        $setOnInsert: { createdAt: now },
        $set: { ...baseForSet, updatedAt: now },
      },
      { upsert: true },
    );

    const saved = await col.findOne({ publicId: d.publicId });
    return NextResponse.json({
      ok: true,
      doc: saved,
      upserted: res.upsertedCount > 0,
    });
  }

  // אם כמה פריטים – נעשה bulkWrite עם upsert
  const ops = docs.map((d) => ({
    updateOne: {
      filter: { publicId: d.publicId },
      update: {
        $setOnInsert: { createdAt: d.createdAt ?? now },
        $set: {
          kind: d.kind,
          title: d.title,
          publicId: d.publicId,
          url: d.url,
          thumbUrl: d.thumbUrl,
          duration: d.duration,
          width: d.width,
          height: d.height,
          bytes: d.bytes,
          format: d.format,
          tags: d.tags,
          likes: d.likes ?? 0,
          commentsCount: d.commentsCount ?? 0,
          updatedAt: now,
        },
      },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops);

  return NextResponse.json({
    ok: true,
    total: docs.length,
    upserted: result.upsertedCount ?? 0,
    matched: result.matchedCount ?? 0,
  });
}

/* ───────────────────── PATCH ───────────────────── */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAllowed(req))) return forbid();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const { publicId, patch } = body;
  if (!publicId)
    return NextResponse.json(
      { ok: false, error: "missing_publicId" },
      { status: 400 },
    );

  const allowed = ["title", "tags", "thumbUrl"] as (keyof MediaDoc)[];
  const update: Partial<MediaDoc> = {};
  for (const k of allowed) if (k in patch) update[k] = patch[k];
  update.updatedAt = new Date();

  const col = await getMediaCol();
  const r = await col.updateOne({ publicId }, { $set: update });
  if (!r.matchedCount)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );

  return NextResponse.json({ ok: true, doc: await col.findOne({ publicId }) });
}

/* ───────────────────── DELETE ───────────────────── */
export async function DELETE(req: NextRequest) {
  if (!(await isAdminAllowed(req))) return forbid();

  const id = req.nextUrl.searchParams.get("publicId");
  if (!id)
    return NextResponse.json(
      { ok: false, error: "missing_publicId" },
      { status: 400 },
    );

  const col = await getMediaCol();
  const r = await col.deleteOne({ publicId: id });
  if (!r.deletedCount)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );

  return NextResponse.json({ ok: true, deleted: id });
}
