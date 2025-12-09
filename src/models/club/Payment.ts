// src/models/club/Payment.ts
import mongoose, {
  Schema,
  type InferSchemaType,
  type Model,
  type HydratedDocument,
} from "mongoose";

/** ---- Enums ---- */
export const PAYMENT_STATUSES = [
  "created",
  "pending",
  "authorized",
  "captured",
  "approved",
  "declined",
  "failed",
  "refunded",
  "canceled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = [
  "cardcom",
  "tranzilla",
  "manual",
  "test",
] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/** אופציונלי: היסטוריית שינויים */
const HistorySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    status: { type: String, enum: PAYMENT_STATUSES },
    note: { type: String },
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

/** ---- Main Schema ---- */
const PaymentSchema = new Schema(
  {
    userId: { type: String, index: true },
    orderId: { type: String, index: true }, // מזהה הזמנה פנימי/חיצוני
    provider: {
      type: String,
      required: true,
      enum: PAYMENT_PROVIDERS,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ILS", uppercase: true, trim: true },
    status: {
      type: String,
      default: "created",
      enum: PAYMENT_STATUSES,
      index: true,
    },
    description: { type: String },

    // מזהה מהספק (Transaction/Approval/Invoice וכו')
    providerRef: { type: String, index: true },
    receiptUrl: { type: String },

    // הרחבות גמישות
    meta: { type: Schema.Types.Mixed },

    // לא חובה, אבל שימושי לטראקינג
    history: { type: [HistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        // סילוק שדות פנימיים מיותרים אם יש
        delete ret.__v;
        return ret;
      },
    },
  },
);

/** ---- Indexes ---- */
// חיפוש נפוץ: להזמנה מספק מסוים
PaymentSchema.index({ orderId: 1, provider: 1 }, { unique: false });
// סטטוס אחרונים
PaymentSchema.index({ status: 1, updatedAt: -1 });
// סכומים/מטבע (דוחות)
PaymentSchema.index({ currency: 1, amount: -1 });

/** ---- Hooks ---- */
PaymentSchema.pre("save", function (next) {
  if (this.currency) {
    this.currency = String(this.currency).toUpperCase();
  }
  next();
});

/** ---- Methods / Statics ---- */
export interface PaymentMethods {
  setStatus: (
    status: PaymentStatus,
    opts?: { note?: string; raw?: any },
  ) => void;
}
PaymentSchema.methods.setStatus = function (
  this: HydratedDocument<PaymentDoc>,
  status: PaymentStatus,
  opts?: { note?: string; raw?: any },
) {
  this.status = status;
  this.history.push({
    status,
    note: opts?.note,
    raw: opts?.raw,
  });
};

export interface PaymentDoc
  extends InferSchemaType<typeof PaymentSchema>,
    PaymentMethods {}
export interface PaymentModel extends Model<PaymentDoc> {
  findByOrder: (
    orderId: string,
    provider?: PaymentProvider,
  ) => Promise<PaymentDoc | null>;
}

PaymentSchema.statics.findByOrder = function (
  this: PaymentModel,
  orderId: string,
  provider?: PaymentProvider,
) {
  if (!orderId) return Promise.resolve(null);
  const q: any = { orderId };
  if (provider) q.provider = provider;
  return this.findOne(q).exec();
};

/** ---- Export ---- */
const Payment =
  (mongoose.models.Payment as PaymentModel) ||
  mongoose.model<PaymentDoc, PaymentModel>("Payment", PaymentSchema);

export default Payment;
