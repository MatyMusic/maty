// src/models/date/DateProfile.ts
import mongoose, { Schema, models, model, InferSchemaType } from "mongoose";

/**
 * התאמה מלאה ל-UI ול-API:
 * - birthDate כמחרוזת "YYYY-MM-DD" (קל לחשב גיל ולסנן)
 * - gender כולל "other"
 * - judaism_direction (עם alias: "denomination" לתאימות לאחור)
 * - kashrut_level/shabbat_level/tzniut_level/goals (אופציונליים)
 * - languages: מחרוזות (רצוי lowercase בכניסה מה-API)
 * - avatarUrl + photos
 * - about_me (עם alias: "bio")
 */

const Level = ["strict", "partial", "none"] as const;
const Direction = [
  "orthodox",
  "haredi",
  "chasidic",
  "modern",
  "conservative",
  "reform",
  "reconstructionist",
  "secular",
] as const;
const Gender = ["male", "female", "other"] as const;
const Goal = ["serious", "marriage", "friendship"] as const;

const DateProfileSchema = new Schema(
  {
    // מזהה משתמש (ObjectId מאוסף המשתמשים/NextAuth)
    userId: { type: Schema.Types.ObjectId, required: true, index: true, unique: true },

    // פרטים בסיסיים
    displayName: { type: String, index: true, alias: "name" },
    email: { type: String, index: true },
    avatarUrl: { type: String }, // תמונת פרופיל ראשית
    photos: [{ type: String }],

    gender: { type: String, enum: Gender, default: null },
    // נשמור כמחרוזת YYYY-MM-DD כדי להימנע מחילוקי TZ ולחשב גיל קל
    birthDate: { type: String, default: null }, // "YYYY-MM-DD"

    country: { type: String, index: true, default: null },
    city: { type: String, index: true, default: null },
    coords: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    languages: [{ type: String }], // נשמרות lowercase ע"י ה-API

    // זהות/ערכים
    judaism_direction: { type: String, enum: Direction, default: null, alias: "denomination" },
    kashrut_level: { type: String, enum: Level, default: null },
    shabbat_level: { type: String, enum: Level, default: null },
    tzniut_level: { type: String, enum: Level, default: null },

    // מטרות ותיאור
    goals: { type: String, enum: Goal, default: null }, // ערך יחיד (תואם ל-API)
    about_me: { type: String, default: "", alias: "bio" },

    // סטטוס
    status: {
      type: String,
      enum: ["active", "paused", "blocked"],
      default: "active",
      index: true,
    },
    verified: { type: Boolean, default: false },
    online: { type: Boolean, default: false },

    // זמני יצירה/עדכון
  },
  { timestamps: true }
);

// אינדקסים מועילים לשאילתות התאמה
DateProfileSchema.index({
  country: 1,
  city: 1,
  judaism_direction: 1,
  gender: 1,
  goals: 1,
  birthDate: 1,
  updatedAt: -1,
  _id: -1,
}, { name: "match_filters_v1" });

export type DateProfileDoc = InferSchemaType<typeof DateProfileSchema>;
export default (models.DateProfile as mongoose.Model<DateProfileDoc>) ||
  model<DateProfileDoc>("DateProfile", DateProfileSchema);
