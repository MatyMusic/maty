// src/db/nigunim.types.ts
export type NiggunSourceType =
  | "youtube"
  | "chabadorg"
  | "soundcloud"
  | "mp3"
  | "cloudinary"
  | "other";

export interface Niggun {
  _id?: any;
  title: string; // שם הניגון ("כינדערעך", "טשערנאביל" וכו')
  altTitles?: string[]; // שמות חלופיים / כתיב אחר
  artists?: string[]; // מבצעים/מקהלה/כלי נגינה
  tags?: string[]; // למשל: ["chabad","nigun","farbrengen","slow","dance"]
  cat?: "chabad"; // ליישור קו עם המערכת שלך
  durationSec?: number;
  cover?: string; // עטיפה/תמונה
  audioUrl?: string; // אם יש רשות לאחסן/להשמיע – קישור ישיר
  sourceType?: NiggunSourceType;
  sourceUrl?: string; // קישור למקור (YouTube/Chabad.org וכו')
  license?: "unknown" | "public-domain" | "allowed" | "restricted";
  creditedTo?: string; // קרדיט נדרש אם יש
  createdAt?: Date;
  updatedAt?: Date;
}
