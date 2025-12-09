import mongoose, { Schema, Types } from "mongoose";

export type BeatDoc = {
  _id: Types.ObjectId;
  ownerId: string;
  title: string;
  bpm?: number;
  key?: string;
  genre?: string;
  aiProvider?: "suno" | "riffusion" | "stable-audio" | "openai";
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

const BeatSchema = new Schema<BeatDoc>(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    bpm: { type: Number, default: 100 },
    key: String,
    genre: { type: String, default: "club", index: true },
    aiProvider: { type: String, default: "openai" },
    audioUrl: { type: String, required: true },
  },
  { timestamps: true }
);

BeatSchema.index({ createdAt: -1 });

const BeatModel =
  (mongoose.models.Beat as mongoose.Model<BeatDoc>) ||
  mongoose.model<BeatDoc>("Beat", BeatSchema);

export default BeatModel;
