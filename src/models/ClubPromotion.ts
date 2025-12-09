// src/models/ClubPromotion.ts
import mongoose, { Schema, models, model } from "mongoose";

export type ClubPromotionDoc = {
  _id: any;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  active: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  order: number; // לסידור ידני
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
};

const ClubPromotionSchema = new Schema<ClubPromotionDoc>(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    linkUrl: { type: String, trim: true },
    active: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    order: { type: Number, default: 0, index: true },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

export default models.ClubPromotion ||
  model<ClubPromotionDoc>("ClubPromotion", ClubPromotionSchema);
