import { PaymentStatus } from "@ookf/shared";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    provider: { type: String, required: true, default: "stripe" },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      index: true,
    },
    amountCents: { type: Number, required: true },
    currency: { type: String, required: true, default: "CAD" },
    stripeCheckoutSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    stripeEventId: { type: String, unique: true, sparse: true },
    rawProviderStatus: String,
    failureMessage: String,
    refundedAmountCents: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1, createdAt: -1 });

export type PaymentDocument = HydratedDocument<
  InferSchemaType<typeof paymentSchema>
>;
export const PaymentModel = model("Payment", paymentSchema);
