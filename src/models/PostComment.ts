import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const PostCommentSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "" },
    body: { type: String, required: true, maxlength: 1000 },
    parentId: { type: String, default: null },
  },
  { timestamps: true },
);

export type PostCommentDoc = InferSchemaType<typeof PostCommentSchema>;

export default (mongoose.models.PostComment as Model<PostCommentDoc>) ||
  mongoose.model<PostCommentDoc>("PostComment", PostCommentSchema);
