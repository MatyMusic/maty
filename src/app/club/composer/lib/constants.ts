export const MAX_TEXT = 500;
export const DEFAULT_TAGS = ["maty", "club"] as const;

export const GENRES = [
  { value: "", label: "ללא" },
  { value: "club", label: "Club" },
  { value: "chabad", label: "Chabad" },
  { value: "mizrahi", label: "Mizrahi" },
  { value: "edm", label: "EDM" },
  { value: "hiphop", label: "HipHop" },
] as const;

export const GENRE_SUGGESTED_TAGS: Record<string, string[]> = {
  "": ["maty", "club"],
  club: ["maty", "club", "dance", "dj"],
  chabad: ["maty", "club", "chabad", "nigun"],
  mizrahi: ["maty", "club", "mizrahi", "hafla"],
  edm: ["maty", "club", "edm", "electro"],
  hiphop: ["maty", "club", "hiphop", "beat"],
};
