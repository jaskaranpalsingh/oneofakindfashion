import { DiscountType } from "@ookf/shared";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    startsAt: Date,
    endsAt: Date,
    usageLimit: Number,
    perCustomerLimit: Number,
    usedCount: { type: Number, default: 0, min: 0 },
    minimumOrderCents: { type: Number, default: 0, min: 0 },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type CouponDocument = HydratedDocument<InferSchemaType<typeof couponSchema>>;
export const CouponModel = model("Coupon", couponSchema);
