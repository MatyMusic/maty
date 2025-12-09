// src/lib/db/models/Song.ts (הוסף אם חסר)
import mongoose, { Schema } from "mongoose";
const SongSchema = new Schema({
  title_he: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  category: String,
  tags: [String],
  key: String,
  tempo_bpm: Number,
  chords_chordpro: String,
  lyrics_he: String,
  links: {
    youtube: String, spotify: String, source: String,
  },
  assets: {
    audio_mp3: String, backing_track: String, pdf_chords: String, stems_zip: String, qr_svg: String,
  },
  status: { type: String, default: "published" },
}, { timestamps: true });

// אינדקסים יעילים
SongSchema.index({ title_he: "text", tags: "text", lyrics_he: "text" });
SongSchema.index({ category: 1, status: 1, tempo_bpm: 1 });
SongSchema.index({ "links.youtube": 1 });

export default mongoose.models.Song || mongoose.model("Song", SongSchema);
