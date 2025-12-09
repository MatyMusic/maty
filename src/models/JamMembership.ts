// src/models/JamMembership.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export type JamRole = "owner" | "admin" | "member";

export interface JamMembershipDoc extends Document {
  userId: string;
  groupId: string;
  role: JamRole;
  instruments?: string[];
  skillLevel?: string;
  note?: string;
  joinedAt: Date;
}

const JamMembershipSchema = new Schema<JamMembershipDoc>(
  {
    userId: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    instruments: [{ type: String }],
    skillLevel: { type: String },
    note: { type: String },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// כדי לא לקבל דופליקט אינדקסים
JamMembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const JamMembership: Model<JamMembershipDoc> =
  mongoose.models.JamMembership ||
  mongoose.model<JamMembershipDoc>("JamMembership", JamMembershipSchema);
