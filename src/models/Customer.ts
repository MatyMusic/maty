// src/models/Customer.ts
import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const CustomerSchema = new Schema(
  {
    // אם תרצה סכימה קשיחה—תגיד לי ואכין. כרגע רופף כדי לא לשבור נתונים קיימים.
  },
  {
    strict: false,
    timestamps: true,
  },
);

export type CustomerDoc = InferSchemaType<typeof CustomerSchema>;

export default (mongoose.models.Customer as Model<CustomerDoc>) ||
  mongoose.model<CustomerDoc>("Customer", CustomerSchema);
