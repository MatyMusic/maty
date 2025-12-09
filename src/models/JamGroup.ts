// src/models/JamGroup.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export type JamVisibility = "public" | "private" | "unlisted";

export interface JamGroupDoc extends Document {
  title: string;
  slug: string;
  description?: string;
  city?: string;
  country?: string;
  genres?: string[];
  daws?: string[];
  purposes?: string[];
  skillsWanted?: string[];
  ownerId: string;
  adminIds: string[];
  memberCount: number;
  isOpen: boolean;
  visibility: JamVisibility;
  tags?: string[];
  lat?: number;
  lng?: number;
  createdAt: Date;
  updatedAt: Date;
}

const JamGroupSchema = new Schema<JamGroupDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },

    city: { type: String },
    country: { type: String },

    genres: [{ type: String }],
    daws: [{ type: String }],
    purposes: [{ type: String }],
    skillsWanted: [{ type: String }],

    ownerId: { type: String, required: true, index: true },
    adminIds: [{ type: String }],

    memberCount: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
      index: true,
    },

    tags: [{ type: String }],

    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true },
);

JamGroupSchema.index({ city: 1, visibility: 1 });
JamGroupSchema.index({ lat: 1, lng: 1 });

export const JamGroup: Model<JamGroupDoc> =
  mongoose.models.JamGroup ||
  mongoose.model<JamGroupDoc>("JamGroup", JamGroupSchema);
