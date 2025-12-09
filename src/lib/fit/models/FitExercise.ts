// src/lib/fit/models/FitExercise.ts
import mongoose, { Schema, InferSchemaType } from "mongoose";

const MediaSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["image", "gif", "video", "model3d"],
      required: true,
    },
    url: { type: String, required: true },
    thumb: String,
    title: String,
    source: String,
    width: Number,
    height: Number,
    durationSec: Number,
  },
  { _id: false },
);

const FitExerciseSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true }, // key: nameLower|category
    providerId: { type: String, index: true }, // wger:123, exdb:456...
    provider: { type: String, index: true },
    name: { type: String, required: true },
    nameLower: { type: String, index: true },
    description: { type: String, default: "" },
    category: { type: String, index: true }, // chest/back/legs/...
    primaryMuscles: { type: [String], index: true, default: [] },
    equipment: { type: [String], index: true, default: [] },
    difficulty: {
      type: String,
      enum: ["", "beginner", "intermediate", "advanced"],
      default: "",
    },
    media: { type: [MediaSchema], default: [] },
    sources: { type: [String], default: [] },
    providerHint: String,
  },
  { timestamps: true, collection: "fit_exercises" },
);

// ייחודי על nameLower + category כדי למנוע כפילויות בין ספקים
FitExerciseSchema.index({ nameLower: 1, category: 1 }, { unique: true });
FitExerciseSchema.index({ "media.type": 1 });
FitExerciseSchema.index({ difficulty: 1, provider: 1 });
FitExerciseSchema.index(
  {
    name: "text",
    description: "text",
    category: "text",
    primaryMuscles: "text",
  },
  { name: "fit_exercises_text" },
);

export type FitExercise = InferSchemaType<typeof FitExerciseSchema>;
export default (mongoose.models.FitExercise as mongoose.Model<FitExercise>) ||
  mongoose.model<FitExercise>("FitExercise", FitExerciseSchema);
