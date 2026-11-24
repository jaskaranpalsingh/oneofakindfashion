import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { ShippingMethod } from "@ookf/shared";

const zoneRateSchema = new Schema(
  {
    methodCode: { type: String, required: true },
    rateCents: { type: Number, required: true, min: 0 },
    etaLabel: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    /** Optional per-kg surcharge after freeWeightGrams (0 = flat only). */
    perKgCents: { type: Number, default: 0, min: 0 },
    freeWeightGrams: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const shippingZoneSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    provinces: [{ type: String, uppercase: true, trim: true }],
    /** FSA / postal prefixes e.g. "T6", "X0A" — empty means province-only match */
    postalPrefixes: [{ type: String, uppercase: true, trim: true }],
    isRemote: { type: Boolean, default: false },
    remoteSurchargeCents: { type: Number, default: 0, min: 0 },
    rates: [zoneRateSchema],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const shippingMethodSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    /** Fallback flat rate when no zone rate matches */
    baseRateCents: { type: Number, required: true, min: 0 },
    etaLabel: { type: String, default: "" },
    isPickup: { type: Boolean, default: false },
    qualifiesForFreeShipping: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shippingZoneSchema.index({ isActive: 1, sortOrder: 1 });
shippingMethodSchema.index({ isActive: 1, sortOrder: 1 });

export type ShippingZoneDocument = HydratedDocument<
  InferSchemaType<typeof shippingZoneSchema>
>;
export type ShippingMethodDocument = HydratedDocument<
  InferSchemaType<typeof shippingMethodSchema>
>;

export const ShippingZoneModel = model("ShippingZone", shippingZoneSchema);
export const ShippingMethodModel = model(
  "ShippingMethodConfig",
  shippingMethodSchema
);

export const CORE_METHOD_CODES = [
  ShippingMethod.STANDARD,
  ShippingMethod.EXPRESS,
  ShippingMethod.LOCAL_PICKUP,
] as const;
