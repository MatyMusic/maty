// src/models/AuditEvent.ts
import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const AuditEventSchema = new Schema(
  {
    kind: { type: String, required: true, index: true }, // כמו: "login", "post.created"
    userId: { type: String, default: null, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type AuditEventDoc = InferSchemaType<typeof AuditEventSchema>;

export default (mongoose.models.AuditEvent as Model<AuditEventDoc>) ||
  mongoose.model<AuditEventDoc>("AuditEvent", AuditEventSchema);
