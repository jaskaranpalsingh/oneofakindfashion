import { InventoryAdjustmentType } from "@ookf/shared";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const inventoryAdjustmentSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: { type: Schema.Types.ObjectId, required: true, index: true },
    sku: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(InventoryAdjustmentType),
      required: true,
    },
    quantityDelta: { type: Number, required: true },
    quantityAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

inventoryAdjustmentSchema.index({ createdAt: -1 });

export type InventoryAdjustmentDocument = HydratedDocument<
  InferSchemaType<typeof inventoryAdjustmentSchema>
>;
export const InventoryAdjustmentModel = model(
  "InventoryAdjustment",
  inventoryAdjustmentSchema
);
