import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    guestId: { type: String },
    items: [cartItemSchema],
    couponCode: String,
    currency: { type: String, default: "CAD" },
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });

export type CartDocument = HydratedDocument<InferSchemaType<typeof cartSchema>>;
export const CartModel = model("Cart", cartSchema);
