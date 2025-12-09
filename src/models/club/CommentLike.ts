// src/models/club/CommentLike.ts
import mongoose, {
  Schema,
  type InferSchemaType,
  models,
  model,
} from "mongoose";

const CommentLikeSchema = new Schema(
  {
    commentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false, collection: "club_comment_likes" },
);

CommentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export type CommentLike = InferSchemaType<typeof CommentLikeSchema>;
export default (models.ClubCommentLike as mongoose.Model<CommentLike>) ||
  model<CommentLike>("ClubCommentLike", CommentLikeSchema);
