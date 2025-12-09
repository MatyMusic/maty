import mongoose, { Schema, models, model, InferSchemaType } from "mongoose";

const NigunSchema = new Schema(
  {
    title: { type: String, required: true },
    album: { type: String },
    artist: { type: String },
    year: { type: String },
    tags: { type: [String], default: [] },
    origin: {
      type: String,
      enum: ["internet-archive", "chabad.org", "manual"],
      required: true,
    },
    audioUrl: { type: String }, // אם יש קובץ אמיתי
    embedUrl: { type: String }, // אם זה רק הטמעה (חב״ד.אורג)
    format: { type: String },
    coverUrl: { type: String },
    sourceItemUrl: { type: String }, // דף המקור (IA / Chabad)
    sourceFilesUrl: { type: [String], default: [] },
    rights: {
      type: String,
      enum: ["public", "embed-only", "licensed", "unknown"],
      default: "unknown",
    },
    creditedTo: { type: String },
  },
  { timestamps: true },
);

export type NigunDoc = InferSchemaType<typeof NigunSchema>;
export default (models.Nigun as mongoose.Model<NigunDoc>) ||
  model<NigunDoc>("Nigun", NigunSchema);
