// src/lib/branding.ts

export type Brand = {
  app: string;
  appName: string; // alias ל־app לשימושים קיימים
  shortName: string;
  club: string;
  tagline: string;

  postSuccess: string;
  postError: string;
  giftSuccess: string;
  giftError: string;

  colors: {
    brand: string;
    brandDark: string;
  };

  links: {
    home: string;
    club: string;
    shorts: string;
  };
};

export const BRAND: Readonly<Brand> = {
  app: "MATY MUSIC",
  appName: "MATY MUSIC",
  shortName: "MATY",

  club: "MATY-CLUB",
  tagline: "פיד שירים/ביטים + Shorts + מתנות 🎁",

  postSuccess: "פורסם ב־MATY-CLUB!",
  postError: "שגיאה בפרסום",
  giftSuccess: "המתנה נשלחה ב־MATY-CLUB 🎁",
  giftError: "בעיה בשליחת מתנה",

  colors: {
    brand: "#6C5CE7",
    brandDark: "#4B32D1",
  },

  links: {
    home: "/",
    club: "/club",
    shorts: "/shorts",
  },
} as const;

// קיצורי דרך שימושיים/תאימות לאחור
export const APP_NAME = BRAND.appName;
export const CLUB_NAME = BRAND.club;
export const TAGLINE = BRAND.tagline;

// מחולל כותרת לעמודים
export const brandTitle = (title?: string) =>
  title ? `${title} • ${BRAND.appName}` : BRAND.appName;
