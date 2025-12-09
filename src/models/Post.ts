// src/models/Post.ts
import { Schema, model, models } from "mongoose";

export interface IPost {
  _id: string;
  authorId: string;
  text?: string;
  coverUrl?: string;
  videoUrl?: string;
  trackUrl?: string;
  tags?: string[];
  genre?: string;
  likeCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: String, required: true, index: true },
    text: String,
    coverUrl: String,
    videoUrl: String,
    trackUrl: String,
    tags: [String],
    genre: String,
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PostModel = models.Post || model<IPost>("Post", PostSchema);

export const Post = PostModel;
export default PostModel;
