import mongoose, { Schema, Types } from "mongoose";

export type ProfileDoc = {
  _id: Types.ObjectId;
  userId: string;
  displayName?: string;
  avatarUrl?: string | null;
  avatarStrategy?: "genre" | "gallery" | "upload" | "profile";
  avatarId?: string | null;
  bio?: string;
  genres?: string[];
  followers: number;
  following: number;
  createdAt: Date;
  updatedAt: Date;
};

const ProfileSchema = new Schema<ProfileDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: String,
    avatarUrl: { type: String, default: null },
    avatarStrategy: {
      type: String,
      enum: ["genre", "gallery", "upload", "profile"],
      default: "genre",
    },
    avatarId: { type: String, default: null },
    bio: String,
    genres: { type: [String], default: [] },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ProfileModel =
  (mongoose.models.Profile as mongoose.Model<ProfileDoc>) ||
  mongoose.model<ProfileDoc>("Profile", ProfileSchema);

export default ProfileModel;
