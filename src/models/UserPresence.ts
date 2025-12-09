// src/models/UserPresence.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserPresenceDoc extends Document {
  userId: string;
  area?: string; // "club" | "jam" | "date" | ...
  lastSeen: Date;
  status: "online" | "away" | "offline";
}

const UserPresenceSchema = new Schema<UserPresenceDoc>(
  {
    userId: { type: String, required: true, index: true },
    area: { type: String },
    lastSeen: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "online",
      index: true,
    },
  },
  { timestamps: true },
);

// שים לב לא ליצור שוב את אותו אינדקס פעמיים
UserPresenceSchema.index(
  { userId: 1, area: 1 },
  { unique: false, name: "user_area_idx" },
);

export const UserPresence: Model<UserPresenceDoc> =
  mongoose.models.UserPresence ||
  mongoose.model<UserPresenceDoc>("UserPresence", UserPresenceSchema);
