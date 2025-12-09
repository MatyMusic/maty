import { Schema, model, models } from "mongoose";
import db from "@/lib/mongoose";

await db();

const availabilitySchema = new Schema(
  {
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["busy", "hold"],
      required: true,
      index: true,
    },
    source: { type: String, default: "manual" },
    bookingId: { type: String, default: null },
    note: { type: String, default: "" },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

availabilitySchema.index({ date: 1, status: 1 }, { unique: false });

export default models.Availability || model("Availability", availabilitySchema);
