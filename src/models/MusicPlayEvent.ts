// src/models/MusicPlayEvent.ts
import mongoose, { Schema, models, model, InferSchemaType } from "mongoose";

const MusicPlayEventSchema = new Schema(
  {
    userId: { type: String, index: true, default: null }, // יכול להיות null לאנונימי
    anonId: { type: String, index: true, default: null }, // מזהה אנונימי מקומי (Cookie)
    trackId: { type: String, required: true, index: true }, // ObjectId כ־string
    type: {
      type: String,
      enum: ["start", "heartbeat", "stop"],
      required: true,
      index: true,
    },
    src: { type: String, default: "nigunim", index: true }, // מאיזה מסך הגיע הנגן
    // שמירה אנונימית של ip/ua באמצעות Hash בלבד:
    ipHash: { type: String, index: true, sparse: true },
    uaHash: { type: String, index: true, sparse: true },
    // טיימינג:
    startedAt: { type: Date }, // לאירועי start
    at: { type: Date, default: () => new Date(), index: true }, // זמן האירוע
    // מונה משך מאז ה-start האחרון (במיליציות/שניות):
    playedMs: { type: Number, default: 0 },
  },
  { timestamps: true },
);

MusicPlayEventSchema.index({ trackId: 1, type: 1, at: -1 });
MusicPlayEventSchema.index({ userId: 1, at: -1 });

export type MusicPlayEventDoc = InferSchemaType<typeof MusicPlayEventSchema>;
export default (models.MusicPlayEvent as mongoose.Model<MusicPlayEventDoc>) ||
  model<MusicPlayEventDoc>("MusicPlayEvent", MusicPlayEventSchema);
