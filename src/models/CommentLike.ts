import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const CommentLikeSchema = new Schema(
  {
    commentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

CommentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export type CommentLikeDoc = InferSchemaType<typeof CommentLikeSchema>;

const CommentLike =
  (mongoose.models.CommentLike as Model<CommentLikeDoc>) ||
  mongoose.model<CommentLikeDoc>("CommentLike", CommentLikeSchema);

export default CommentLike;
export { CommentLike };
