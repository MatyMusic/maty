import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const CommentSchema = new Schema(
  {
    postId: { type: String, index: true, required: true },
    userId: { type: String, index: true, required: true },
    userName: { type: String, default: "" },
    userImage: { type: String, default: "" },
    text: { type: String, required: true, maxlength: 1000 },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type CommentDoc = InferSchemaType<typeof CommentSchema>;

const Comment =
  (mongoose.models.Comment as Model<CommentDoc>) ||
  mongoose.model<CommentDoc>("Comment", CommentSchema);

export default Comment;
export { Comment };
