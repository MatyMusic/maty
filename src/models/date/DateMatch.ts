// src/models/date/DateMatch.ts
import mongoose, { Schema, InferSchemaType, models } from "mongoose";

const DateMatchSchema = new Schema(
  {
    a: { type: Schema.Types.ObjectId, required: true, index: true }, // userId A
    b: { type: Schema.Types.ObjectId, required: true, index: true }, // userId B
    score: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["new", "liked", "pass", "chatted", "matched", "blocked"],
      default: "new",
      index: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

DateMatchSchema.index({ a: 1, b: 1 }, { unique: true });

export type DateMatchDoc = InferSchemaType<typeof DateMatchSchema>;
export default (models.DateMatch as mongoose.Model<DateMatchDoc>) ||
  mongoose.model<DateMatchDoc>("DateMatch", DateMatchSchema);
