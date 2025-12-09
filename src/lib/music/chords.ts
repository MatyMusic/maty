// src/lib/music/chords.ts
const PITCHES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const ENHARMONIC: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

function normRoot(root: string) {
  const r = root.replace(/^(Db|Eb|Gb|Ab|Bb)$/, (m) => ENHARMONIC[m]);
  return r;
}

// מחזיר root+suffix (למשל D#m7 → root=D#, suffix=m7)
function splitChord(ch: string) {
  const m = ch.match(/^([A-G](?:[#b])?)(.*)$/);
  if (!m) return { root: ch, suffix: "" };
  return { root: m[1], suffix: m[2] ?? "" };
}

export function transposeChord(rootWithSuffix: string, semitones: number) {
  const { root, suffix } = splitChord(rootWithSuffix);
  const R = normRoot(root);
  const i = PITCHES.indexOf(R);
  if (i < 0) return rootWithSuffix;
  const t = (i + (semitones % 12) + 12) % 12;
  return PITCHES[t] + suffix;
}

// ממיר טקסט ChordPro תוך הסטה של אקורדים בתבנית [C#m7]
export function transposeChordPro(chordpro: string, semitones: number) {
  return chordpro.replace(
    /\[([A-G][#b]?(?:maj7|m7|m6|m9|maj9|add9|sus2|sus4|dim|aug|m|7|6|9)?)\]/g,
    (_m, g1) => `[${transposeChord(g1, semitones)}]`
  );
}
