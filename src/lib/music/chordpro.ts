// src/lib/music/chordpro.ts
import { transposeChordPro } from "./chords";

export function renderChordProToHTML(chordpro = "", semitones = 0) {
  const src = semitones ? transposeChordPro(chordpro, semitones) : chordpro;
  return src
    .split("\n")
    .map((line) =>
      line.replace(
        /\[([A-G][#b]?(?:maj7|m7|m6|m9|maj9|add9|sus2|sus4|dim|aug|m|7|6|9)?)\]/g,
        '<span class="font-bold">$1</span>'
      )
    )
    .join("<br/>");
}
