// src/models/date/DatePreferences.ts
import mongoose, { Schema, InferSchemaType, models } from "mongoose";

const DatePreferencesSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    ageMin: { type: Number, default: 18 },
    ageMax: { type: Number, default: 99 },
    distanceKm: { type: Number, default: 50 },
    denominations: [{ type: String }],
    goals: [{ type: String, enum: ["serious", "marriage", "friendship"] }],
  },
  { timestamps: true }
);

export type DatePreferencesDoc = InferSchemaType<typeof DatePreferencesSchema>;
export default (models.DatePreferences as mongoose.Model<DatePreferencesDoc>) ||
  mongoose.model<DatePreferencesDoc>("DatePreferences", DatePreferencesSchema);
