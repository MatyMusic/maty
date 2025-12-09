import mongoose, { Schema, Types } from "mongoose";

export type ConsentDoc = {
  _id: Types.ObjectId;
  a: string; // userId קטן אלפביתית
  b: string; // userId גדול אלפביתית
  types: ("chat" | "video")[];
  grantedBy: string; // מי נתן בפעולה האחרונה
  updatedAt: Date;
  createdAt: Date;
};

const ConsentSchema = new Schema<ConsentDoc>(
  {
    a: { type: String, required: true, index: true },
    b: { type: String, required: true, index: true },
    types: { type: [String], default: [] },
    grantedBy: { type: String, required: true },
  },
  { timestamps: true },
);

ConsentSchema.index({ a: 1, b: 1 }, { unique: true });

export default (mongoose.models.Consent as mongoose.Model<ConsentDoc>) ||
  mongoose.model<ConsentDoc>("Consent", ConsentSchema);
