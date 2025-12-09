// tools/make-audio.mjs
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const sr = 44100;

// ===== כלי WAV בסיסיים (16bit PCM, סטריאו) =====
function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}
function interleaveStereo(int16) {
  const out = new Int16Array(int16.length * 2);
  for (let i = 0; i < int16.length; i++) {
    out[i * 2] = int16[i];
    out[i * 2 + 1] = int16[i];
  }
  return out;
}
function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++)
    view.setUint8(offset + i, str.charCodeAt(i));
}
function wavBufferFromFloatMono(float32, sampleRate = 44100) {
  // נרמול ל-3dB-
  let peak = 1e-9;
  for (const v of float32) peak = Math.max(peak, Math.abs(v));
  const gain = Math.pow(10, -3 / 20) / peak;
  const normalized = Float32Array.from(float32, (v) => v * gain);

  const pcm16 = floatTo16BitPCM(normalized);
  const stereo = interleaveStereo(pcm16);

  const numChannels = 2;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const subchunk2Size = stereo.length * 2;
  const chunkSize = 36 + subchunk2Size;

  const buffer = new ArrayBuffer(44 + subchunk2Size);
  const view = new DataView(buffer);

  // RIFF
  writeString(view, 0, "RIFF");
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, "WAVE");
  // fmt
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data
  writeString(view, 36, "data");
  view.setUint32(40, subchunk2Size, true);
  new Int16Array(buffer, 44, stereo.length).set(stereo);

  return Buffer.from(buffer);
}
function saveWav(floatData, path) {
  const buf = wavBufferFromFloatMono(floatData, sr);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
  console.log("✓ wrote", path);
}

// ===== סינתזה =====
const TAU = Math.PI * 2;
const sine = (f, t) => Math.sin(TAU * f * t);

function adsr(len, a = 0.01, d = 0.08, s = 0.7, r = 0.2) {
  const e = new Float32Array(len);
  const A = Math.floor(a * sr);
  const D = Math.floor(d * sr);
  const R = Math.floor(r * sr);
  const S = Math.max(0, len - A - D - R);
  let i = 0;
  for (; i < A; i++) e[i] = i / Math.max(1, A);
  for (let j = 0; j < D; j++, i++) e[i] = 1 + (s - 1) * (j / Math.max(1, D));
  for (let j = 0; j < S; j++, i++) e[i] = s;
  for (let j = 0; j < R && i < len; j++, i++)
    e[i] = s * (1 - j / Math.max(1, R));
  return e;
}

const C4 = 261.63;
const SEMI = Math.pow(2, 1 / 12);
const note = (n) => C4 * SEMI ** n;

// ===== 1) לופ פסנתר ~16s =====
function makePianoLoop() {
  const length = 16.0;
  const n = Math.floor(sr * length);
  const out = new Float32Array(n);

  const chords = [
    [note(0), note(3), note(7)], // Cm
    [note(-4), note(0), note(3)], // Ab
    [note(-7), note(-3), note(0)], // Eb
    [note(-2), note(2), note(5)], // Bb
  ];

  const bpm = 96;
  const bps = bpm / 60;
  const sixteenth = 1 / (4 * bps);

  let cursor = 0;
  for (let bar = 0; bar < 4; bar++) {
    const ch = chords[bar % chords.length];
    // במקום repeat() — שימוש ב-fill + flat:
    const pattern = new Array(4).fill([0, 1, 2, 1]).flat(); // 16 צעדים

    for (let i = 0; i < pattern.length; i++) {
      const start = cursor + i * sixteenth;
      const dur = sixteenth * 0.9;
      const sIdx = Math.floor(start * sr);
      const len = Math.min(n - sIdx, Math.floor(dur * sr));
      if (len <= 0) continue;
      const f = ch[pattern[i]];

      // טון פסנתרי פשוט: בסיס + דיטיון קל + אוקטבה
      for (let k = 0; k < len; k++) {
        const tt = k / sr;
        const tone =
          0.65 * sine(f, tt) +
          0.35 * sine(f * 1.003, tt) +
          0.2 * sine(f * 2, tt);
        out[sIdx + k] += tone;
      }
      const e = adsr(len, 0.003, 0.06, 0.4, 0.02);
      for (let k = 0; k < len; k++) out[sIdx + k] *= e[k];
    }
    cursor += 16 * sixteenth;
  }

  // Pad רך מתחת לכל תיבה
  const beatsPerBar = 4;
  const barLen = beatsPerBar / bps;
  for (let bar = 0; bar < 4; bar++) {
    const ch = chords[bar % chords.length];
    const start = bar * barLen;
    const sIdx = Math.floor(start * sr);
    const len = Math.min(n - sIdx, Math.floor(barLen * sr));
    const e = adsr(len, 0.3, 0.4, 0.6, 0.3);
    for (let k = 0; k < len; k++) {
      const tt = k / sr;
      const tone =
        0.2 * sine(ch[0] / 2, tt) +
        0.15 * sine(ch[1] / 2, tt) +
        0.15 * sine(ch[2] / 2, tt);
      out[sIdx + k] += tone * e[k] * 0.6;
    }
  }

  // פייד קצר ללופ חלק
  const fade = Math.floor(0.02 * sr);
  for (let i = 0; i < fade; i++) {
    out[i] *= i / fade;
    out[n - 1 - i] *= i / fade;
  }
  return out;
}

// ===== 2) Intro Hit ~0.9s =====
function makeIntroHit() {
  const len = Math.floor(sr * 0.9);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const low = Math.sin(TAU * 60 * t) * Math.exp(-t * 6);
    const mid = Math.sin(TAU * 220 * t) * Math.exp(-t * 8);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.3;
    out[i] = 0.9 * low + 0.6 * mid + noise;
  }
  // פייד אין/אאוט קצר
  const fi = Math.floor(0.005 * sr);
  const fo = Math.floor(0.02 * sr);
  for (let i = 0; i < fi; i++) out[i] *= i / fi;
  for (let i = 0; i < fo; i++) out[len - 1 - i] *= i / fo;
  return out;
}

// ===== הרצה =====
const piano = makePianoLoop();
const hit = makeIntroHit();
saveWav(piano, "public/audio/piano-loop.wav");
saveWav(hit, "public/audio/maty-intro-hit.wav");
console.log("Done.");
