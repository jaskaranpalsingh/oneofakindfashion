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

export const registerSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128).optional(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(30).optional(),
    acceptTerms: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
    if (data.acceptTerms === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["acceptTerms"],
        message: "You must accept the terms and conditions",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  marketingConsent: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(200),
});

export const savedAddressSchema = addressSchema.extend({
  label: z.string().trim().max(50).optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

export const productFilterSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  collection: z.string().trim().optional(),
  /** Comma-separated product ObjectIds (e.g. wishlist). */
  ids: z.string().trim().max(2000).optional(),
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

export const createCouponSchema = z
  .object({
    code: couponCodeSchema,
    description: z.string().trim().max(500).optional(),
    type: z.nativeEnum(DiscountType),
    value: z.number().positive(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    noExpiry: z.boolean().optional(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perCustomerLimit: z.number().int().positive().optional().nullable(),
    minimumOrderCents: z.number().int().min(0).optional(),
    maximumDiscountCents: z.number().int().positive().optional().nullable(),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === DiscountType.PERCENTAGE && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage cannot exceed 100",
        path: ["value"],
      });
    }
    if (!data.noExpiry && data.endsAt && data.startsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry must be after the start date",
        path: ["endsAt"],
      });
    }
  });

export const updateCouponSchema = z
  .object({
    description: z.string().trim().max(500).optional(),
    type: z.nativeEnum(DiscountType).optional(),
    value: z.number().positive().optional(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    noExpiry: z.boolean().optional(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perCustomerLimit: z.number().int().positive().optional().nullable(),
    minimumOrderCents: z.number().int().min(0).optional(),
    maximumDiscountCents: z.number().int().positive().optional().nullable(),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === DiscountType.PERCENTAGE &&
      data.value !== undefined &&
      data.value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage cannot exceed 100",
        path: ["value"],
      });
    }
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
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
