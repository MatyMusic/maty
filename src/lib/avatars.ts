// src/lib/avatars.ts
// מודול יציב לשימוש גם ב-SSR וגם ב-CSR (שומרים גישה ל-localStorage מאובטחת)

export type AvatarId = "vinyl" | "chabad" | "mizrahi" | "soft" | "fun";

export type AvatarDef = {
  id: AvatarId;
  label: string;
  sprites: {
    idle: string; // אייקון סטטי (עיגול חמוד)
  };
  tint?: string; // גרדיאנט רקע אופציונלי, אם תרצה
};

// ✅ מערך קבוע של אוואטרים (תוכל לשנות נתיבים/שמות כפי שיש לך בפרויקט)
export const AVATARS: ReadonlyArray<AvatarDef> = [
  {
    id: "vinyl",
    label: "ויניל",
    sprites: { idle: "/assets/avatars/vinyl.svg" },
    tint: "from-slate-300 to-slate-400",
  },
  {
    id: "chabad",
    label: "חסידי",
    sprites: { idle: "/assets/images/avatar-chabad.png" },
    tint: "from-amber-300 to-orange-400",
  },
  {
    id: "mizrahi",
    label: "מזרחי",
    sprites: { idle: "/assets/images/avatar-mizrahi.png" },
    tint: "from-rose-400 to-red-500",
  },
  {
    id: "soft",
    label: "שקט",
    sprites: { idle: "/assets/images/avatar-soft.png" },
    tint: "from-indigo-300 to-violet-400",
  },
  {
    id: "fun",
    label: "מקפיץ",
    sprites: { idle: "/assets/images/avatar-fun.png" },
    tint: "from-emerald-300 to-teal-400",
  },
];

// ---- עזרים בטוחים ל-SSR ----
const LS_KEY = "avatar:id";

export function getAvatar(id?: AvatarId): AvatarDef {
  const def = AVATARS.find((a) => a.id === id);
  return def || AVATARS[0]; // vinyl כברירת מחדל
}

export function saveAvatarId(id: AvatarId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, id);
  } catch {}
}

export function loadAvatarId(): AvatarId {
  if (typeof window === "undefined") return "vinyl";
  try {
    const raw = localStorage.getItem(LS_KEY) as AvatarId | null;
    return raw && AVATARS.some((a) => a.id === raw) ? raw : "vinyl";
  } catch {
    return "vinyl";
  }
}

// אופציונלי: לקבל את כל הרשימה לשימוש ב-Picker
export function listAvatars(): ReadonlyArray<AvatarDef> {
  return AVATARS;
}
