import mongoose, { Schema } from "mongoose";

const SongSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: "Maty Music", trim: true },
    genre: { type: String, default: "", trim: true },
    mood: { type: String, default: "", trim: true },
    bpm: { type: Number, default: 0 },
    key: { type: String, default: "", trim: true },

    // קישורים למדיה
    audioUrl: { type: String, required: true },
    audioPublicId: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    coverPublicId: { type: String, default: "" },

    // אבני בניין לאפליקציית סטרימינג
    duration: { type: Number, default: 0 },
    format: { type: String, default: "" },
    tags: [{ type: String }],

    // מצב פרסום
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.models.Song || mongoose.model("Song", SongSchema);
