

// src/models/User.ts
import mongoose, { Schema, model, models } from "mongoose";

export type Genre = "chabad" | "mizrahi" | "soft" | "fun";
export type Strategy = "genre" | "gallery" | "upload" | "profile";
export type Role = "user" | "admin" | "superadmin";
export type Status = "active" | "blocked" | "deleted";

export interface IUser {
  name?: string;
  email: string;
  passwordHash?: string | null;
  role: Role;
  image?: string;
  phone?: string;

  preferredGenres: Genre[];
  lastPlayedGenre: Genre | null;

  avatarStrategy: Strategy; // ← חדש/קריטי ל-/api/me
  avatarId: string | null;
  avatarUrl: string | null; // ← חדש/קריטי ל-/api/me

  status: Status;
  createdAt?: Date;
  updatedAt?: Date;
}

const GENRES: Genre[] = ["chabad", "mizrahi", "soft", "fun"];
const STRATEGIES: Strategy[] = ["genre", "gallery", "upload", "profile"];
const ROLES: Role[] = ["user", "admin", "superadmin"];
const STATUSES: Status[] = ["active", "blocked", "deleted"];

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, default: null },

    role: { type: String, enum: ROLES, default: "user", index: true },

    image: { type: String, default: "" },
    phone: { type: String, default: "" },

    preferredGenres: {
      type: [String],
      enum: GENRES,
      default: [],
    },
    lastPlayedGenre: {
      type: String,
      enum: [...GENRES, null],
      default: null,
    },

    // 🧑‍🎤 אווטארים
    avatarStrategy: {
      type: String,
      enum: STRATEGIES,
      default: "genre",
      index: true,
    },
    avatarId: { type: String, default: null },
    avatarUrl: { type: String, default: null },

    status: { type: String, enum: STATUSES, default: "active", index: true },
  },
  { timestamps: true }
);

/** אינדקסים שמיים יציבים כדי להימנע מהתנגשויות */
UserSchema.index({ email: 1 }, { unique: true, name: "email_unique" });
UserSchema.index({ role: 1 }, { name: "by_role" });
UserSchema.index({ status: 1 }, { name: "by_status" });

/** שמירה נקייה בהמרה ל-JSON (לא חובה, אבל טוב להיגיינה) */
UserSchema.set("toJSON", {
  transform(_doc, ret) {
    // הצג id במקום _id והחבא פרטים פנימיים
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export default models.User || model<IUser>("User", UserSchema);
