// src/models/presence/Presence.ts
import mongoose, {
  model,
  models,
  Schema,
  type InferSchemaType,
} from "mongoose";

const PresenceSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    where: { type: String, default: "site", index: true },
    // בלי index על lastSeen – רק default
    lastSeen: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false, collection: "presence" },
);

// אינדקס יחיד בסכימה הזו – לא על lastSeen לבד
PresenceSchema.index({ userId: 1, where: 1 }, { unique: true });

export type Presence = InferSchemaType<typeof PresenceSchema>;
export default (models.Presence as mongoose.Model<Presence>) ||
  model<Presence>("Presence", PresenceSchema);
