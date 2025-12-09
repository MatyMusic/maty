import { Schema, models, model } from "mongoose";

const OrderSchema = new Schema(
  {
    orderId: { type: String, unique: true, index: true },
    amountILS: Number,
    description: String,
    status: { type: String, default: "paid" },
    paypal: { captureId: String, raw: Schema.Types.Mixed },
    customer: { name: String, email: String },
    invoiceNumber: String,
  },
  { timestamps: true }
);

export default models.Order || model("Order", OrderSchema);
