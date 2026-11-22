import type {
  AdminRole,
  FulfillmentStatus,
  PaymentStatus,
  ProductStatus,
  ProductType,
  ShippingMethod,
  UserRole,
} from "./enums";
import type { MoneyCents } from "./money";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface Address {
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface MoneyBreakdown {
  subtotalCents: MoneyCents;
  discountCents: MoneyCents;
  shippingCents: MoneyCents;
  taxCents: MoneyCents;
  totalCents: MoneyCents;
  currency: "CAD";
}

export interface AuthUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  adminRole?: AdminRole;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productType: ProductType;
  status: ProductStatus;
  priceCents: MoneyCents;
  compareAtPriceCents?: MoneyCents | null;
  primaryImageUrl?: string | null;
  /** Second gallery image for hover crossfade when available. */
  secondaryImageUrl?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  inStock: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  itemCount: number;
  totalCents: MoneyCents;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingMethod?: ShippingMethod;
}
