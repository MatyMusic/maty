// src/models/club/LiveSession.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface LiveSessionDoc extends Document {
  userId: string;
  userName?: string;
  userImage?: string;
  isAdmin?: boolean;

  lat?: number;
  lon?: number;
  areaName?: string;
  radiusMeters?: number;

  kind: "public" | "one_to_one" | "friends";
  active: boolean;
  blocked: boolean;

  startedAt: Date;
  lastPingAt: Date;

  meta?: Record<string, any>;
}

const LiveSessionSchema = new Schema<LiveSessionDoc>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String },
    userImage: { type: String },
    isAdmin: { type: Boolean, default: false },

    lat: { type: Number },
    lon: { type: Number },
    areaName: { type: String },
    radiusMeters: { type: Number, default: 500 },

    kind: {
      type: String,
      enum: ["public", "one_to_one", "friends"],
      default: "public",
    },

    active: { type: Boolean, default: true, index: true },
    blocked: { type: Boolean, default: false, index: true },

    startedAt: { type: Date, default: Date.now },
    lastPingAt: { type: Date, default: Date.now, index: true },

    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

// אינדקס לשידורים פעילים
LiveSessionSchema.index(
  { active: 1, blocked: 1, lastPingAt: -1 },
  { name: "live_active_recent" },
);

const LiveSession: Model<LiveSessionDoc> =
  (mongoose.models.LiveSession as Model<LiveSessionDoc>) ||
  mongoose.model<LiveSessionDoc>("LiveSession", LiveSessionSchema);

export default LiveSession;
