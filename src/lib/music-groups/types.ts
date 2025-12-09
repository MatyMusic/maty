export type Daw =
  | "cubase"
  | "ableton"
  | "logic"
  | "reaper"
  | "studioone"
  | "protools"
  | "other";
export type GroupPurpose =
  | "collab"
  | "rehearsal"
  | "learning"
  | "mix_master"
  | "gear_swap"
  | "jam"
  | "community";
export type Skill = "beginner" | "intermediate" | "advanced" | "pro";
export type GroupStatus = "pending" | "approved" | "rejected" | "suspended";

export type GeoPoint = { type: "Point"; coordinates: [number, number] }; // [lng, lat]

export type MusicGroup = {
  _id?: string;
  title: string;
  description?: string;
  purposes: GroupPurpose[];
  daws?: Daw[];
  skills?: Skill[];
  tags?: string[];
  ownerId: string;
  admins: string[];
  members: string[];
  city?: string | null;
  location?: GeoPoint | null;
  visibility: "public" | "private" | "hidden";
  joinPolicy: "open" | "request" | "invite";
  maxMembers?: number | null;

  meetingDays?: ("sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat")[];
  meetingTime?: string | null;

  /** 승인 */
  status: GroupStatus; // ← מצב הקבוצה
  requestedBy: string; // ← מי פתח את הבקשה
  reviewedBy?: string | null; // ← מי אישר/דחה
  reviewedAt?: string | null; // ← מתי אושר/נדחה
  reviewNote?: string | null; // ← סיבת דחייה/הערה

  membersCount: number;
  postsCount?: number;
  createdAt: string;
  updatedAt: string;

  canJoin?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
};
