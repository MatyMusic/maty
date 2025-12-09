// src/lib/tracks.ts
export type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";

export type Track = {
  id: string;
  title: string;
  artist: string;
  url: string; // שים כאן קובץ אמיתי ב־public/audio/... (כרגע דמו)
  cover?: string;
};

export const TRACKS: Record<CategoryKey, Track[]> = {
  chabad: [
    { id: "ch-1", title: "ניגון שמחה", artist: "MATY", url: "/demo.mp3" },
    { id: "ch-2", title: "ריקוד חסידי", artist: "MATY", url: "/demo.mp3" },
    { id: "ch-3", title: "לכתחילה אריבער", artist: "MATY", url: "/demo.mp3" },
  ],
  mizrahi: [
    { id: "mi-1", title: "חאפלה בערב", artist: "MATY", url: "/demo.mp3" },
    { id: "mi-2", title: "גל ים", artist: "MATY", url: "/demo.mp3" },
    { id: "mi-3", title: "שמח בנשמה", artist: "MATY", url: "/demo.mp3" },
  ],
  soft: [
    { id: "so-1", title: "לילה רגוע", artist: "MATY", url: "/demo.mp3" },
    { id: "so-2", title: "נשימה עמוקה", artist: "MATY", url: "/demo.mp3" },
    { id: "so-3", title: "כוכבים", artist: "MATY", url: "/demo.mp3" },
  ],
  fun: [
    { id: "fu-1", title: "בוסט אנרגיה", artist: "MATY", url: "/demo.mp3" },
    { id: "fu-2", title: "Dance Now", artist: "MATY", url: "/demo.mp3" },
    { id: "fu-3", title: "Hands Up", artist: "MATY", url: "/demo.mp3" },
  ],
};
