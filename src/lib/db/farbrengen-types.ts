// src/lib/db/farbrengen-types.ts
export type RoomType = "text" | "audio" | "video";
export type Audience = "mixed" | "men" | "women";
export type Visibility = "public" | "private" | "invite";

export type FarbrengenRoom = {
  _id: string;
  title: string;
  description?: string;
  type: RoomType;           // התחל ב-"text"
  audience: Audience;       // סינון צניעות
  visibility: Visibility;   // ציבורי/פרטי/הזמנה
  tags: string[];           // "שבת", "הלכה", "ניגונים", "משיח", "דיומא"...
  ownerId: string;
  moderators: string[];
  bannerUrl?: string;
  maxSeats?: number;
  live: boolean;
  startsAt?: string;        // ISO
  endsAt?: string;          // ISO
  createdAt: string;
  updatedAt: string;
  rulesVersion?: string;    // למשל "v1.2"
  location?: { country?: string; city?: string };
};

export type FarbrengenMember = {
  _id: string;
  roomId: string;
  userId: string;
  role: "host" | "mod" | "member";
  joinedAt: string;
  leftAt?: string;
  muted?: boolean;
  handRaised?: boolean;
};

export type FarbrengenMessage = {
  _id: string;
  roomId: string;
  userId: string;
  text: string;
  kind?: "text" | "image" | "audio";
  at: string;              // ISO
  replyToId?: string | null;
  pinned?: boolean;
};
