// src/models/TasteVector.ts
import mongoose, { Schema, models, model, InferSchemaType } from "mongoose";

const TasteVectorSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    // מיפוי תגיות/ז'אנרים → ניקוד (חיבור משקולות מהאזנות)
    tags: { type: Map, of: Number, default: {} },
    topArtists: { type: [String], default: [] },
    lastUpdatedAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
);

export type TasteVectorDoc = InferSchemaType<typeof TasteVectorSchema>;
export default (models.TasteVector as mongoose.Model<TasteVectorDoc>) ||
  model<TasteVectorDoc>("TasteVector", TasteVectorSchema);
