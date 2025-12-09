// src/lib/fit/models/Exercise.ts
import { Schema, model, models, type InferSchemaType } from "mongoose";

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

const ExerciseSchema = new Schema(
  {
    // מזהה פנימי
    signature: { type: String, required: true, unique: true, index: true }, // name_lc|category_lc
    // נתונים עיקריים
    name: { type: String, required: true, index: true },
    name_lc: { type: String, required: true, index: true },
    description: String,
    category: { type: String, default: "other", index: true },
    primaryMuscles: { type: [String], default: [], index: true },
    equipment: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: ["", "beginner", "intermediate", "advanced"],
      default: "",
    },
    // מדיה ומקורות
    media: { type: [MediaSchema], default: [] },
    sources: { type: [String], default: [] },
    providerHint: String,
    // איסוף מזהים חלופיים מכל ספק
    altIds: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

// אינדקס טקסט פשוט (חיפוש מהיר)
ExerciseSchema.index({ name: "text", description: "text" });

export type ExerciseDoc = InferSchemaType<typeof ExerciseSchema>;
export const ExerciseModel =
  models.fit_exercises || model("fit_exercises", ExerciseSchema);
