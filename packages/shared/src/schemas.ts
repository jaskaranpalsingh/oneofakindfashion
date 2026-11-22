import { z } from "zod";
import { CANADIAN_PROVINCES, CLOTHING_SIZES } from "./constants";
import {
  AdminRole,
  DiscountType,
  FulfillmentStatus,
  PaymentStatus,
  ProductStatus,
  ProductType,
  ReviewStatus,
  ShippingMethod,
  UserRole,
} from "./enums";

const provinceCodes = CANADIAN_PROVINCES.map((p) => p.code) as [
  string,
  ...string[],
];

/** Formats raw input toward Canadian A1A 1A1 (max 6 alphanumeric chars). */
export function formatCanadianPostalCode(value: string): string {
  const chars = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  if (chars.length <= 3) return chars;
  return `${chars.slice(0, 3)} ${chars.slice(3)}`;
}

export const canadianPostalCodeSchema = z
  .string()
  .trim()
  .transform((value) => formatCanadianPostalCode(value))
  .refine(
    (value) => /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(value),
    "Use Canadian format A1A 1A1"
  );

export const addressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().max(120).optional(),
  line1: z.string().trim().min(1).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(100),
  province: z.enum(provinceCodes),
  postalCode: canadianPostalCodeSchema,
  country: z.literal("Canada").default("Canada"),
  phone: z.string().trim().max(30).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const productFilterSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  collection: z.string().trim().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  size: z.enum(CLOTHING_SIZES).optional(),
  colour: z.string().trim().optional(),
  fabric: z.string().trim().optional(),
  jewelleryType: z.string().trim().optional(),
  occasion: z.string().trim().optional(),
  availability: z.enum(["in_stock", "out_of_stock", "all"]).optional(),
  onSale: z.coerce.boolean().optional(),
  /** When true, only products flagged isNewArrival (published new-arrival policy). */
  newArrivals: z.coerce.boolean().optional(),
  sort: z
    .enum([
      "featured",
      "newest",
      "price_asc",
      "price_desc",
      "name",
      "best_selling",
    ])
    .default("featured"),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const couponCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .transform((value) => value.toUpperCase());

export const createCouponSchema = z.object({
  code: couponCodeSchema,
  type: z.nativeEnum(DiscountType),
  value: z.number().positive(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  minimumOrderCents: z.number().int().min(0).optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const reviewCreateSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10).max(2000),
});

export const enumsSchema = z.object({
  userRole: z.nativeEnum(UserRole),
  adminRole: z.nativeEnum(AdminRole),
  productStatus: z.nativeEnum(ProductStatus),
  productType: z.nativeEnum(ProductType),
  paymentStatus: z.nativeEnum(PaymentStatus),
  fulfillmentStatus: z.nativeEnum(FulfillmentStatus),
  reviewStatus: z.nativeEnum(ReviewStatus),
  shippingMethod: z.nativeEnum(ShippingMethod),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
