// import mongoose, { Schema, models, model } from "mongoose";

// export type Level = "strict" | "partial" | "none";
// export type JudaismDirection =
//   | "orthodox"
//   | "haredi"
//   | "chassidic"
//   | "modern_orthodox"
//   | "conservative"
//   | "reform"
//   | "reconstructionist"
//   | "secular";

// export interface IDateProfile {
//   userId: string;
//   email?: string | null;

//   displayName?: string | null;
//   birthDate?: string | null; // YYYY-MM-DD
//   gender?: "male" | "female" | "other" | null;
//   country?: string | null;
//   city?: string | null;
//   languages?: string[];

//   jewish_by_mother?: boolean;
//   conversion?: boolean;
//   judaism_direction?: JudaismDirection | null;

//   kashrut_level?: Level | null;
//   shabbat_level?: Level | null;
//   tzniut_level?: Level | null;

//   looking_for?: "serious" | "marriage" | "friendship" | null;

//   createdAt?: Date;
//   updatedAt?: Date;
// }

// const DateProfileSchema = new Schema<IDateProfile>(
//   {
//     userId: { type: String, required: true, unique: true, index: true },
//     email: { type: String },

//     displayName: String,
//     birthDate: String,
//     gender: {
//       type: String,
//       enum: ["male", "female", "other", null],
//       default: null,
//     },
//     country: String,
//     city: String,
//     languages: { type: [String], default: [] },

//     jewish_by_mother: Boolean,
//     conversion: Boolean,
//     judaism_direction: {
//       type: String,
//       enum: [
//         "orthodox",
//         "haredi",
//         "chassidic",
//         "modern_orthodox",
//         "conservative",
//         "reform",
//         "reconstructionist",
//         "secular",
//         null,
//       ],
//       default: null,
//     },

//     kashrut_level: {
//       type: String,
//       enum: ["strict", "partial", "none", null],
//       default: null,
//     },
//     shabbat_level: {
//       type: String,
//       enum: ["strict", "partial", "none", null],
//       default: null,
//     },
//     tzniut_level: {
//       type: String,
//       enum: ["strict", "partial", "none", null],
//       default: null,
//     },

//     looking_for: {
//       type: String,
//       enum: ["serious", "marriage", "friendship", null],
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// /* אינדקסים — שמות מתואמים למסד כדי למנוע התנגשויות */
// DateProfileSchema.index({ userId: 1 }, { unique: true, name: "user_unique" });
// DateProfileSchema.index(
//   { updatedAt: -1, _id: -1 },
//   { name: "updated_desc_id_desc" }
// );
// DateProfileSchema.index({ judaism_direction: 1 }, { name: "by_direction" });
// DateProfileSchema.index(
//   { gender: 1, city: 1, country: 1 },
//   { name: "by_gender_city_country" }
// );

// export default models.DateProfile ||
//   model<IDateProfile>("DateProfile", DateProfileSchema);

// src/models/DateProfile.ts
import mongoose, { Schema, models, model } from "mongoose";

const DateProfileSchema = new Schema(
  {
    userId: { type: String, index: true, unique: true, required: true },
    displayName: { type: String, default: "" },
    email: { type: String, default: "" },
    avatarUrl: { type: String, default: null },
    photos: { type: [String], default: [] },

    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    languages: { type: [String], default: [] },
    judaism_direction: {
      type: String,
      enum: [
        "orthodox",
        "haredi",
        "chasidic",
        "chassidic",
        "modern",
        "conservative",
        "reform",
        "reconstructionist",
        "secular",
        null,
      ],
      default: null,
    },
    kashrut_level: {
      type: String,
      enum: ["strict", "partial", "none", null],
      default: null,
    },
    shabbat_level: {
      type: String,
      enum: ["strict", "partial", "none", null],
      default: null,
    },
    tzniut_level: {
      type: String,
      enum: ["strict", "partial", "none", null],
      default: null,
    },

    subscription: {
      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive",
      },
      tier: {
        type: String,
        enum: ["free", "plus", "pro", "vip"],
        default: "free",
      },
      expiresAt: { type: Date, default: null },
    },

    trust: { type: Number, default: null },
  },
  { timestamps: true, collection: "date_profiles" }
);

export default models.DateProfile || model("DateProfile", DateProfileSchema);
