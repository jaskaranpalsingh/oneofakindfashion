export const UserRole = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AdminRole = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const ProductStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  UNPUBLISHED: "unpublished",
  ARCHIVED: "archived",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProductType = {
  CLOTHING: "clothing",
  JEWELLERY: "jewellery",
  ACCESSORY: "accessory",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const PaymentStatus = {
  PENDING: "pending",
  REQUIRES_ACTION: "requires_action",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const FulfillmentStatus = {
  PENDING_PAYMENT: "pending_payment",
  AWAITING_FULFILLMENT: "awaiting_fulfillment",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPED: "shipped",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  DELIVERY_EXCEPTION: "delivery_exception",
  RETURNED: "returned",
  PREPARING_PICKUP: "preparing_pickup",
  READY_FOR_PICKUP: "ready_for_pickup",
  COLLECTED: "collected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
} as const;
export type FulfillmentStatus =
  (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];

export const ShippingClass = {
  STANDARD_CLOTHING: "standard_clothing",
  HEAVY_BRIDAL: "heavy_bridal",
  JEWELLERY: "jewellery",
  OVERSIZED: "oversized",
} as const;
export type ShippingClass = (typeof ShippingClass)[keyof typeof ShippingClass];

export const DiscountType = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const ReviewStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  FLAGGED: "flagged",
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const InventoryAdjustmentType = {
  RESTOCK: "restock",
  SALE: "sale",
  RETURN: "return",
  MANUAL: "manual",
  RESERVE: "reserve",
  RELEASE: "release",
  DAMAGE: "damage",
} as const;
export type InventoryAdjustmentType =
  (typeof InventoryAdjustmentType)[keyof typeof InventoryAdjustmentType];

export const ShippingMethod = {
  STANDARD: "standard",
  EXPRESS: "express",
  LOCAL_PICKUP: "local_pickup",
} as const;
export type ShippingMethod =
  (typeof ShippingMethod)[keyof typeof ShippingMethod];
