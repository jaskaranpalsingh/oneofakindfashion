import {
  FulfillmentStatus,
  PaymentStatus,
  ShippingMethod,
} from "@ookf/shared";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const moneySnapshotSchema = new Schema(
  {
    subtotalCents: { type: Number, required: true },
    discountCents: { type: Number, required: true, default: 0 },
    shippingCents: { type: Number, required: true, default: 0 },
    taxCents: { type: Number, required: true, default: 0 },
    totalCents: { type: Number, required: true },
    currency: { type: String, required: true, default: "CAD" },
  },
  { _id: false }
);

const addressSnapshotSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    company: String,
    line1: String,
    line2: String,
    city: String,
    province: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    variantId: Schema.Types.ObjectId,
    productName: { type: String, required: true },
    productSlug: String,
    sku: { type: String, required: true },
    options: {
      size: String,
      colour: String,
      material: String,
      other: String,
    },
    unitPriceCents: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotalCents: { type: Number, required: true },
    imageUrl: String,
  },
  { _id: true }
);

const orderEventSchema = new Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    guestId: { type: String, index: true, sparse: true },
    guestEmail: { type: String, lowercase: true, trim: true },
    inventoryReserved: { type: Boolean, default: false },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: String,
    items: { type: [orderItemSchema], required: true },
    totals: { type: moneySnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    shippingMethod: {
      type: String,
      enum: Object.values(ShippingMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: Object.values(FulfillmentStatus),
      default: FulfillmentStatus.PENDING_PAYMENT,
      index: true,
    },
    couponCode: String,
    discountCents: { type: Number, default: 0 },
    taxBreakdown: [
      {
        name: String,
        rateBps: Number,
        amountCents: Number,
      },
    ],
    stripeCheckoutSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    trackingNumber: String,
    trackingUrl: String,
    shippingCarrier: String,
    shippingSnapshot: {
      methodCode: String,
      methodName: String,
      rateCents: Number,
      etaLabel: String,
      zoneName: String,
      freeShippingApplied: Boolean,
      remoteSurchargeCents: Number,
      postalCode: String,
      province: String,
      calculatedAt: String,
    },
    deliveryInstructions: { type: String, trim: true, maxlength: 500 },
    shippedAt: Date,
    estimatedDeliveryAt: Date,
    customerNotes: { type: String, trim: true, maxlength: 500 },
    internalNotes: String,
    paidAt: Date,
    cancelledAt: Date,
    refundedAt: Date,
    events: [orderEventSchema],
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1, _id: -1 });
orderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, paidAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export type OrderDocument = HydratedDocument<InferSchemaType<typeof orderSchema>>;
export const OrderModel = model("Order", orderSchema);
