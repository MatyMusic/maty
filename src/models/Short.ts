import { Schema, model, models } from "mongoose";

const ShortSchema = new Schema(
  {
    mediaId: { type: Schema.Types.ObjectId, ref: "Media", required: true },
    caption: { type: String, default: "" },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: true },
    stats: {
      likes: { type: Number, default: 0 },
      plays: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

ShortSchema.index({ createdAt: -1 });
ShortSchema.index({ tags: 1, createdAt: -1 });

export default models.Short || model("Short", ShortSchema);
