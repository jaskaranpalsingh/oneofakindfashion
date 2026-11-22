import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const collectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    imageUrl: String,
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isFeatured: { type: Boolean, default: false, index: true },
    isVisible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
    deletedAt: Date,
  },
  { timestamps: true }
);

export type CollectionDocument = HydratedDocument<
  InferSchemaType<typeof collectionSchema>
>;
export const CollectionModel = model("Collection", collectionSchema);
