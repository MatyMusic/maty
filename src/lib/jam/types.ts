// src/lib/jam/types.ts

export type JamVisibility = "public" | "private" | "unlisted";
export type JamRole = "owner" | "admin" | "member";
export type JamSkillLevel = "beginner" | "intermediate" | "advanced" | "pro";

/**
 * קבוצה של MATY-JAM
 * שימו לב: ב-DB זה נשמר כמסמך ב-"jam_groups"
 */
export type JamGroup = {
  _id?: string; // במונגו זה ObjectId, ב-API נחזיר כמחרוזת
  title: string;
  slug: string;
  description?: string;

  city?: string;
  country?: string;
  // מיקום גאוגרפי בסיסי
  location?: {
    lat: number;
    lon: number;
  };

  // ז'אנרים / סגנונות / DAW וכו'
  genres?: string[];
  daws?: string[];
  purposes?: string[]; // חזרות, הופעות, לימוד וכו'
  skillsWanted?: string[]; // איזה תפקידים מחפשים: קלידן, גיטרה...

  ownerId: string;
  adminIds: string[];

  memberCount: number;
  isOpen: boolean; // האם אפשר להצטרף חופשי
  visibility: JamVisibility;

  // טאגים כלליים לחיפוש
  tags?: string[];

  createdAt: string;
  updatedAt: string;
};

/**
 * חברות בקבוצה
 */
export type JamMembership = {
  _id?: string;
  userId: string;
  groupId: string;
  role: JamRole;
  instruments?: string[];
  skillLevel?: JamSkillLevel;
  note?: string;
  joinedAt: string;
};

/**
 * סשן ג'אם (לייב / פיזי)
 */
export type JamSession = {
  _id?: string;
  groupId: string;
  hostId: string;

  title?: string;
  startAt: string;
  endAt?: string | null;

  isOnline: boolean;
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };

  status: "scheduled" | "live" | "ended" | "cancelled";

  createdAt: string;
  updatedAt: string;
};
