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
    description: { type: String, trim: true, maxlength: 500, default: "" },
    type: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
    },
    /** Percentage: 1–100. Fixed: CAD cents. */
    value: { type: Number, required: true, min: 0 },
    startsAt: Date,
    endsAt: Date,
    usageLimit: Number,
    perCustomerLimit: Number,
    usedCount: { type: Number, default: 0, min: 0 },
    minimumOrderCents: { type: Number, default: 0, min: 0 },
    /** Optional cap for percentage discounts (CAD cents). */
    maximumDiscountCents: Number,
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    isActive: { type: Boolean, default: true, index: true },
    archivedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, endsAt: 1 });
couponSchema.index({ archivedAt: 1, createdAt: -1 });

export type CouponDocument = HydratedDocument<InferSchemaType<typeof couponSchema>>;
export const CouponModel = model("Coupon", couponSchema);
