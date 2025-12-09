// src/lib/club/types.ts
// ------------------------------------------------------------
// טייפים משותפים לכל מודולי ה-CLUB (קליינט + שרת)
// ------------------------------------------------------------

export type Msg = { id: string; fromMe: boolean; text: string; at: string };

export type Post = {
  _id: string;
  authorId: string;
  text?: string;
  genre?: string;
  trackUrl?: string;
  videoUrl?: string;
  coverUrl?: string;
  tags?: string[];
  createdAt?: string;
  likes?: number; // סכימה ישנה
  likeCount?: number; // סכימה חדשה
  comments?: number;
};

export type FeedResp = {
  ok: boolean;
  items: Post[];
  nextCursor: string | null;
};

export type Promo = {
  id?: string;
  _id?: string;
  title: string;
  text?: string; // שדה טקסט קצר
  body?: string; // שדה טקסט ארוך (לפי ה-route שלך)
  image?: string;
  imageUrl?: string; // תאימות
  href?: string;
  link?: string; // תאימות
  ctaText?: string;
  couponCode?: string;
};
