// src/models/presence/Presence.ts
import mongoose, {
  Schema,
  type InferSchemaType,
  models,
  model,
} from "mongoose";

const PresenceSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    where: { type: String, default: "site", index: true },
    lastSeen: { type: Date, default: () => new Date() }, // שים לב: בלי index כאן
  },
  { timestamps: true, versionKey: false, collection: "presence" },
);

// אינדקסים — פעם אחת בלבד
PresenceSchema.index({ lastSeen: 1 });
PresenceSchema.index({ userId: 1, where: 1 }, { unique: true });

export type Presence = InferSchemaType<typeof PresenceSchema>;
export default (models.Presence as mongoose.Model<Presence>) ||
  model<Presence>("Presence", PresenceSchema);
