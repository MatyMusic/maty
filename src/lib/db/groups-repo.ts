// src/lib/db/groups-repo.ts
import { type Collection, type IndexDescription, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type GroupVisibility = "public" | "private";
export type GroupStatus = "pending" | "approved" | "rejected" | "suspended";

export type SportHeb =
  | "ריצה"
  | "הליכה"
  | "חדר כושר"
  | "יוגה"
  | "פילאטיס"
  | "HIIT"
  | "אופניים"
  | "קרוספיט"
  | "שחייה"
  | "כדורגל"
  | "כדורסל"
  | "אחר";

export type Group = {
  _id?: ObjectId;
  ownerId: string; // userId
  title: string;
  description?: string;
  sports: SportHeb[]; // בעברית
  city?: string | null;
  visibility: GroupVisibility; // ציבורי/פרטי
  status: GroupStatus; // מאושר רק ע"י אדמין
  membersCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type GroupMember = {
  _id?: ObjectId;
  groupId: ObjectId;
  userId: string;
  role: "owner" | "member";
  joinedAt?: string;
};

export type GroupPost = {
  _id?: ObjectId;
  groupId: ObjectId;
  userId: string;
  content: string;
  createdAt?: string;
  // לוגים לאדמין
  audit?: { flagged?: boolean; reason?: string | null } | null;
};

function nowISO() {
  return new Date().toISOString();
}

async function colGroups(): Promise<Collection<Group>> {
  const db = await getDb();
  const c = db.collection<Group>("fit_groups");
  try {
    const wanted: Array<IndexDescription & { name: string; unique?: boolean }> =
      [
        {
          key: { status: 1, visibility: 1, updatedAt: -1 },
          name: "status_vis",
        },
        { key: { "sports.0": 1 }, name: "sports0" },
        {
          key: { title: "text", description: "text" },
          name: "text_title_desc",
        },
        { key: { ownerId: 1, createdAt: -1 }, name: "owner_created" },
      ];
    const have = new Set(
      (
        await c
          .listIndexes()
          .toArray()
          .catch(() => [])
      ).map((i: any) => i.name),
    );
    for (const idx of wanted)
      if (!have.has(idx.name))
        await c.createIndex(idx.key as any, {
          name: idx.name,
          unique: idx.unique,
        });
  } catch {}
  return c;
}

async function colMembers(): Promise<Collection<GroupMember>> {
  const db = await getDb();
  const c = db.collection<GroupMember>("fit_group_members");
  try {
    await c.createIndex(
      { groupId: 1, userId: 1 },
      { unique: true, name: "group_user_unique" },
    );
  } catch {}
  return c;
}

async function colPosts(): Promise<Collection<GroupPost>> {
  const db = await getDb();
  const c = db.collection<GroupPost>("fit_group_posts");
  try {
    await c.createIndex(
      { groupId: 1, createdAt: -1 },
      { name: "group_created" },
    );
  } catch {}
  return c;
}

/* ---------- יצירת בקשה לקבוצה (pending) ---------- */
export async function createGroupRequest(
  ownerId: string,
  data: {
    title: string;
    description?: string;
    sports: SportHeb[];
    city?: string | null;
    visibility: GroupVisibility;
  },
) {
  const C = await colGroups();
  const now = nowISO();
  const doc: Group = {
    ownerId,
    title: data.title.slice(0, 80),
    description: (data.description || "").slice(0, 1000),
    sports: Array.from(new Set(data.sports || [])),
    city: data.city?.slice(0, 60) || null,
    visibility: data.visibility,
    status: "pending",
    membersCount: 1,
    createdAt: now,
    updatedAt: now,
  };
  const res = await C.insertOne(doc as any);
  // בעל הקבוצה כחבר owner
  const M = await colMembers();
  await M.insertOne({
    groupId: res.insertedId,
    userId: ownerId,
    role: "owner",
    joinedAt: now,
  } as any);
  return { ...(doc as any), _id: res.insertedId };
}

/* ---------- אישור/דחייה/השהיה ע"י אדמין ---------- */
export async function adminUpdateGroupStatus(
  groupId: string,
  status: GroupStatus,
) {
  const C = await colGroups();
  const _id = new ObjectId(groupId);
  await C.updateOne({ _id }, { $set: { status, updatedAt: nowISO() } });
  return await C.findOne({ _id });
}

/* ---------- רשימות ---------- */
export async function listGroupsPublic(opts: {
  q?: string;
  sport?: SportHeb;
  city?: string | null;
  limit?: number;
  page?: number;
}) {
  const C = await colGroups();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const query: any = { status: "approved" };
  if (opts.city) query.city = opts.city;
  if (opts.sport) query.sports = opts.sport;
  if (opts.q) query.$text = { $search: opts.q };

  const items = await C.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  const total = await C.countDocuments(query);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

export async function listGroupsForAdmin(opts: {
  status?: GroupStatus;
  limit?: number;
}) {
  const C = await colGroups();
  const query: any = {};
  if (opts.status) query.status = opts.status;
  const items = await C.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(Math.min(opts.limit ?? 100, 200))
    .toArray();
  return items;
}

/* ---------- פרטי קבוצה, חברים, פוסטים ---------- */
export async function getGroupById(id: string) {
  const C = await colGroups();
  return C.findOne({ _id: new ObjectId(id) });
}

export async function addMember(
  groupId: string,
  userId: string,
  role: "member" | "owner" = "member",
) {
  const M = await colMembers();
  const C = await colGroups();
  const gid = new ObjectId(groupId);
  await M.updateOne(
    { groupId: gid, userId },
    { $setOnInsert: { role, joinedAt: nowISO() } },
    { upsert: true },
  );
  await C.updateOne(
    { _id: gid },
    { $inc: { membersCount: 1 }, $set: { updatedAt: nowISO() } },
  );
}

const BAD_WORDS = ["זונה", "זונות", "קללה1", "קללה2"]; // אפשר להרחיב

export async function addPost(
  groupId: string,
  userId: string,
  content: string,
) {
  const P = await colPosts();
  const gid = new ObjectId(groupId);
  const text = (content || "").toString().slice(0, 2000).trim();

  const lower = text.toLowerCase();
  const flagged = BAD_WORDS.some((w) => lower.includes(w));

  const post: GroupPost = {
    groupId: gid,
    userId,
    content: text,
    createdAt: nowISO(),
    audit: flagged ? { flagged: true, reason: "מילות לא הולמות" } : null,
  };
  const res = await P.insertOne(post as any);
  return { ...(post as any), _id: res.insertedId };
}

export async function listPosts(groupId: string, limit = 50) {
  const P = await colPosts();
  const gid = new ObjectId(groupId);
  return P.find({ groupId: gid })
    .sort({ createdAt: -1, _id: -1 })
    .limit(Math.min(limit, 200))
    .toArray();
}
