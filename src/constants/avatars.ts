// src/constants/avatars.ts
export type Genre = "chabad" | "mizrahi" | "soft" | "fun";

export type AvatarDef = {
  id: Genre;
  label: string;
  /** הנתיב המדויק שקיים אצלך בפועל (ללא גרסאות נוספות) */
  src: string;
  /** אופציונלי: אייקון עגול אם תוסיף בעתיד */
  circleSrc?: string;
};

export const AVATARS: Readonly<AvatarDef[]> = [
  {
    id: "chabad",
    label: "חסידי (חב״ד)",
    src: "/assets/images/avatar-chabad.png",
  },
  {
    id: "mizrahi",
    label: "מזרחי",
    src: "/assets/images/avatar-mizrahi.png",
  },
  {
    id: "soft",
    label: "שקט",
    src: "/assets/images/avatar-soft.png",
  },
  {
    id: "fun",
    label: "מקפיץ",
    src: "/assets/images/avatar-fun.png",
  },
];

export const AVATAR_MAP: Readonly<Record<Genre, AvatarDef>> = AVATARS.reduce(
  (acc, a) => ((acc[a.id] = a), acc),
  {} as Record<Genre, AvatarDef>
);
