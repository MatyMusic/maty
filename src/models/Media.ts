import mongoose, { Schema, models, model } from "mongoose";

const MediaSchema = new Schema(
  {
    kind: { type: String, enum: ["image", "video", "audio"], required: true },
    title: { type: String, default: "" },
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    thumbUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    format: { type: String, default: "" },
    createdBy: { type: String, default: "" }, // אימייל המנהל שהעלה
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

MediaSchema.index({ kind: 1, createdAt: -1 });

export default models.Media || model("Media", MediaSchema);
