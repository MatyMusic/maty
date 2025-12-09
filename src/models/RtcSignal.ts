// src/models/RtcSignal.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export type RtcSignalKind = "offer" | "answer" | "candidate" | "bye" | "ring";

export interface IRtcSignal extends Document {
  roomId: string; // מזהה החדר (למשל live._id או jamRoomId)
  fromUserId: string; // מי שלח את הסיגנל
  toUserId?: string | null; // למי מיועד (לא חובה, אפשר null = broadcast)
  kind: RtcSignalKind; // offer / answer / candidate / bye / ring
  payload: any; // SDP / ICE / מידע כללי
  createdAt: Date;
}

const RtcSignalSchema = new Schema<IRtcSignal>(
  {
    roomId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, default: null, index: true },
    kind: {
      type: String,
      required: true,
      enum: ["offer", "answer", "candidate", "bye", "ring"],
    },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: "rtc_signals",
  },
);

// אינדקסים שימושיים
RtcSignalSchema.index({ roomId: 1, createdAt: 1 });
RtcSignalSchema.index({ toUserId: 1, createdAt: 1 });

const RtcSignal: Model<IRtcSignal> =
  mongoose.models.RtcSignal ||
  mongoose.model<IRtcSignal>("RtcSignal", RtcSignalSchema);

export default RtcSignal;
