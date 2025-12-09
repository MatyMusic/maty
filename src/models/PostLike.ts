// src/models/PostLike.ts
import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const PostLikeSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export type PostLikeDoc = InferSchemaType<typeof PostLikeSchema>;

export default (mongoose.models.PostLike as Model<PostLikeDoc>) ||
  mongoose.model<PostLikeDoc>("PostLike", PostLikeSchema);
