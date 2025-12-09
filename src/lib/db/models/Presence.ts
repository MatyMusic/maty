import mongoose, { Schema, Types } from "mongoose";

export type PresenceDoc = {
  _id: Types.ObjectId;
  userId?: string | null;
  anonId: string;
  ua?: string | null;
  path?: string | null;
  lastSeen: Date;
};

const PresenceSchema = new Schema<PresenceDoc>(
  {
    userId: { type: String },
    anonId: { type: String, required: true, index: true },
    ua: { type: String },
    path: { type: String },
    lastSeen: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
);

// TTL: מסמכים נמחקים 5 דקות אחרי העדכון
PresenceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });

export default (mongoose.models.Presence as mongoose.Model<PresenceDoc>) ||
  mongoose.model<PresenceDoc>("Presence", PresenceSchema);
