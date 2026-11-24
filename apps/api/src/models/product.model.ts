import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { ProductStatus, ProductType, ShippingClass } from "@ookf/shared";

const productImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    alt: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const clothingAttributesSchema = new Schema(
  {
    fabric: String,
    embroideryDetails: String,
    workType: String,
    sleeveStyle: String,
    neckDesign: String,
    dupattaIncluded: Boolean,
    stitchingType: String,
    occasion: String,
    careInstructions: String,
    sizeChartRef: String,
  },
  { _id: false }
);

const jewelleryAttributesSchema = new Schema(
  {
    jewelleryType: String,
    material: String,
    finishColour: String,
    stoneType: String,
    size: String,
    dimensions: String,
    weight: String,
    careInstructions: String,
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    options: {
      size: String,
      colour: String,
      material: String,
      other: String,
    },
    priceCents: Number,
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: String,
    isAvailable: { type: Boolean, default: true },
    barcode: String,
  },
  { _id: true }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    productType: {
      type: String,
      enum: Object.values(ProductType),
      required: true,
      index: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    brand: { type: String, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    priceCents: { type: Number, required: true, min: 0 },
    compareAtPriceCents: { type: Number, min: 0 },
    costPriceCents: { type: Number, min: 0, select: false },
    currency: { type: String, default: "CAD" },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    allowBackorder: { type: Boolean, default: false },
    allowPreorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    tags: [{ type: String, trim: true, lowercase: true }],
    seoTitle: String,
    seoDescription: String,
    images: [productImageSchema],
    isPhysical: { type: Boolean, default: true },
    weightGrams: Number,
    weightUnit: { type: String, enum: ["g", "kg"], default: "g" },
    dimensionsCm: {
      length: Number,
      width: Number,
      height: Number,
    },
    shippingClass: {
      type: String,
      enum: Object.values(ShippingClass),
      default: ShippingClass.STANDARD_CLOTHING,
    },
    freeShippingEligible: { type: Boolean, default: true },
    additionalHandlingCents: { type: Number, default: 0, min: 0 },
    clothing: clothingAttributesSchema,
    jewellery: jewelleryAttributesSchema,
    variants: {
      type: [variantSchema],
      validate: {
        validator: (variants: Array<{ sku: string }>) => variants.length > 0,
        message: "At least one variant is required",
      },
    },
    salesCount: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    publishedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });
productSchema.index({ status: 1, categoryId: 1, publishedAt: -1 });
productSchema.index({ status: 1, subcategoryId: 1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ status: 1, isNewArrival: 1 });
productSchema.index({ status: 1, isBestSeller: 1 });
productSchema.index({ deletedAt: 1, status: 1 });
productSchema.index({ priceCents: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ "variants.sku": 1 }, { unique: true });
productSchema.index({
  name: "text",
  shortDescription: "text",
  tags: "text",
  sku: "text",
});

export type ProductDocument = HydratedDocument<InferSchemaType<typeof productSchema>>;
export const ProductModel = model("Product", productSchema);
