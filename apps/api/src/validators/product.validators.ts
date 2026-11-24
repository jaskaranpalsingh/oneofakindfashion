import { ProductStatus, ProductType, ShippingClass } from "@ookf/shared";
import { z } from "zod";

const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    { message: "Image URL must be absolute or a site path" }
  );

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1).max(64),
  options: z
    .object({
      size: z.string().trim().max(40).optional(),
      colour: z.string().trim().max(40).optional(),
      material: z.string().trim().max(80).optional(),
      other: z.string().trim().max(80).optional(),
    })
    .default({}),
  priceCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  imageUrl: imageUrlSchema.optional(),
  isAvailable: z.boolean().optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(200).optional(),
  sku: z.string().trim().min(1).max(64),
  productType: z.nativeEnum(ProductType),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
  brand: z.string().trim().max(120).optional(),
  shortDescription: z.string().trim().max(400).optional(),
  description: z.string().trim().max(20000).optional(),
  priceCents: z.number().int().min(0),
  compareAtPriceCents: z.number().int().min(0).optional(),
  costPriceCents: z.number().int().min(0).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
  allowPreorder: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  tags: z.array(z.string().trim().max(40)).optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: imageUrlSchema,
        publicId: z.string().optional(),
        alt: z.string().max(200).optional(),
        sortOrder: z.number().int().min(0).optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .max(6, "A product can have at most 6 images")
    .optional(),
  isPhysical: z.boolean().optional(),
  weightGrams: z.number().min(0).optional(),
  weightUnit: z.enum(["g", "kg"]).optional(),
  dimensionsCm: z
    .object({
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    })
    .optional(),
  shippingClass: z.nativeEnum(ShippingClass).optional(),
  freeShippingEligible: z.boolean().optional(),
  additionalHandlingCents: z.number().int().min(0).optional(),
  clothing: z
    .object({
      fabric: z.string().optional(),
      embroideryDetails: z.string().optional(),
      workType: z.string().optional(),
      sleeveStyle: z.string().optional(),
      neckDesign: z.string().optional(),
      dupattaIncluded: z.boolean().optional(),
      stitchingType: z.string().optional(),
      occasion: z.string().optional(),
      careInstructions: z.string().optional(),
      sizeChartRef: z.string().optional(),
    })
    .optional(),
  jewellery: z
    .object({
      jewelleryType: z.string().optional(),
      material: z.string().optional(),
      finishColour: z.string().optional(),
      stoneType: z.string().optional(),
      size: z.string().optional(),
      dimensions: z.string().optional(),
      weight: z.string().optional(),
      careInstructions: z.string().optional(),
    })
    .optional(),
  variants: z.array(variantSchema).min(1),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
