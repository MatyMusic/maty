import mongoose, { Schema, Types } from "mongoose";

export type GiftDoc = {
  _id: Types.ObjectId;
  senderId: string; // במקום fromUserId
  receiverId: string; // במקום toUserId
  type: string; // במקום kind
  amount?: number;
  note?: string; // במקום message
  postId?: Types.ObjectId; // קישור אופציונלי לפוסט
  createdAt: Date;
  updatedAt: Date;
};

const GiftSchema = new Schema<GiftDoc>(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    amount: { type: Number, default: 1, min: 1 },
    note: { type: String, maxlength: 240 },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);

GiftSchema.index({ createdAt: -1 });

const GiftModel =
  (mongoose.models.Gift as mongoose.Model<GiftDoc>) ||
  mongoose.model<GiftDoc>("Gift", GiftSchema);

export default GiftModel;
