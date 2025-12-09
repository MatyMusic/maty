// src/lib/groups/types.ts
export type Space = "club" | "fit" | "date";
export type GroupStatus = "pending" | "approved" | "rejected" | "suspended";
export type MemberRole = "owner" | "admin" | "mod" | "member";
export type MemberStatus = "active" | "invited" | "left" | "banned";

export type Region = {
  country?: string | null;
  city?: string | null;
};

export type Instrument =
  | "keys"
  | "guitar"
  | "bass"
  | "drums"
  | "violin"
  | "clarinet"
  | "vocal"
  | "dj"
  | "sound"
  | "other";

export type GroupDoc = {
  _id?: import("mongodb").ObjectId;
  space: Space; // club/fit/date
  title: string;
  description?: string | null;
  focus?: Instrument[]; // כלי / תחום
  region?: Region | null; // אזור / עיר
  coverUrl?: string | null;
  ownerId: string; // userId
  membersCount?: number;
  status: GroupStatus;
  tags?: string[];
  createdAt: string; // ISO
  updatedAt?: string;
};

export type GroupMemberDoc = {
  _id?: import("mongodb").ObjectId;
  groupId: string; // as string
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string; // ISO
  lastActiveAt?: string;
};

export type MediaRef = {
  kind: "image" | "video" | "audio";
  url: string;
  thumb?: string | null;
};

export type GroupPostDoc = {
  _id?: import("mongodb").ObjectId;
  groupId: string;
  userId: string;
  text?: string | null;
  media?: MediaRef[];
  likes?: number;
  commentsCount?: number;
  createdAt: string;
  updatedAt?: string;
};
