// src/models/Presence.ts
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
    // שים לב: בלי index: true – רק default
    lastSeen: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

// TTL: מסמכים נמחקים 5 דקות אחרי העדכון
// זה האינדקס היחיד על lastSeen בסכימה הזו
PresenceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });

export default (mongoose.models.Presence as mongoose.Model<PresenceDoc>) ||
  mongoose.model<PresenceDoc>("Presence", PresenceSchema);
