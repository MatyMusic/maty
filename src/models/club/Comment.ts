// src/models/club/Comment.ts
import mongoose, {
  Schema,
  type InferSchemaType,
  models,
  model,
} from "mongoose";

const CommentSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    body: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "club_comments" },
);

export type ClubComment = InferSchemaType<typeof CommentSchema>;
export default (models.ClubComment as mongoose.Model<ClubComment>) ||
  model<ClubComment>("ClubComment", CommentSchema);
