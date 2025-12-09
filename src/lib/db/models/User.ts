import mongoose, { Schema, models, model, type Model } from "mongoose";

export type UserRole = "user" | "admin" | "superadmin";

export type UserDoc = {
  _id: mongoose.Types.ObjectId;
  name?: string | null;
  email: string;
  image?: string | null;
  role: UserRole;

  // moderation
  approved: boolean; // נכנס לרשת אחרי אישורך
  banned: boolean; // חסום מגישה
  bannedReason?: string | null;
  bannedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String },
    email: { type: String, required: true }, // אינדקס ייחודי מוצהר למטה פעם אחת
    image: { type: String },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
      index: true, // שימושי לשאילתות אדמין
    },

    // === moderation fields ===
    approved: { type: Boolean, default: false, index: true },
    banned: { type: Boolean, default: false, index: true },
    bannedReason: { type: String },
    bannedAt: { type: Date },
  },
  { timestamps: true },
);

// אינדקס ייחודי מוגדר פעם אחת בלבד (למנוע התנגשויות)
UserSchema.index({ email: 1 }, { unique: true, name: "email_unique" });

const User =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);

export default User;
