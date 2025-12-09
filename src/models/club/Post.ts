// src/models/club/Post.ts
import mongoose, {
  Schema,
  type InferSchemaType,
  models,
  model,
} from "mongoose";

/**
 * חשוב: ה־_id הוא מחרוזת (UUID) ולא ObjectId.
 */
const PostSchema = new Schema(
  {
    _id: { type: String, required: true }, // <-- קריטי! UUID string
    authorId: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    media: [{ type: String }],
    likesCount: { type: Number, default: 0, index: true },
    commentsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "club_posts",
    _id: false, // כי אנו מגדירים _id ידנית כמחרוזת
  },
);

export type ClubPost = InferSchemaType<typeof PostSchema>;
export default (models.ClubPost as mongoose.Model<ClubPost>) ||
  model<ClubPost>("ClubPost", PostSchema);
