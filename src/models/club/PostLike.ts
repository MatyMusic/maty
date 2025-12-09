// src/models/club/PostLike.ts
import mongoose, {
  Schema,
  type InferSchemaType,
  models,
  model,
  type Model,
} from "mongoose";

const PostLikeSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false, collection: "club_post_likes" },
);

// משתמש יכול לעשות לייק פעם אחת לפוסט
PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export type PostLike = InferSchemaType<typeof PostLikeSchema>;

export default (models.ClubPostLike as Model<PostLike>) ||
  model<PostLike>("ClubPostLike", PostLikeSchema);
