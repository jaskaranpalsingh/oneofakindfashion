import { DiscountType } from "@ookf/shared";
import { Types } from "mongoose";
import { CouponModel } from "../models/coupon.model";
import { AppError } from "../utils/app-error";

export async function listCoupons() {
  const coupons = await CouponModel.find({}).sort({ createdAt: -1 }).lean();
  return coupons.map((coupon) => ({
    id: String(coupon._id),
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    startsAt: coupon.startsAt ?? null,
    endsAt: coupon.endsAt ?? null,
    usageLimit: coupon.usageLimit ?? null,
    perCustomerLimit: coupon.perCustomerLimit ?? null,
    usedCount: coupon.usedCount ?? 0,
    minimumOrderCents: coupon.minimumOrderCents ?? 0,
    productIds: (coupon.productIds ?? []).map(String),
    categoryIds: (coupon.categoryIds ?? []).map(String),
    isActive: coupon.isActive ?? true,
    createdAt: coupon.createdAt,
  }));
}

export async function createCoupon(input: {
  code: string;
  type: string;
  value: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  minimumOrderCents?: number;
  productIds?: string[];
  categoryIds?: string[];
  isActive?: boolean;
}) {
  if (!Object.values(DiscountType).includes(input.type as never)) {
    throw new AppError(400, "INVALID_TYPE", "Invalid discount type");
  }
  if (!Number.isFinite(input.value) || input.value < 0) {
    throw new AppError(400, "INVALID_VALUE", "Invalid discount value");
  }

  const existing = await CouponModel.exists({
    code: input.code.trim().toUpperCase(),
  });
  if (existing) {
    throw new AppError(409, "CODE_EXISTS", "Coupon code already exists");
  }

  const coupon = await CouponModel.create({
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    usageLimit: input.usageLimit,
    perCustomerLimit: input.perCustomerLimit,
    minimumOrderCents: input.minimumOrderCents ?? 0,
    productIds: (input.productIds ?? []).filter((id) =>
      Types.ObjectId.isValid(id)
    ),
    categoryIds: (input.categoryIds ?? []).filter((id) =>
      Types.ObjectId.isValid(id)
    ),
    isActive: input.isActive ?? true,
  });

  return listCoupons().then((rows) =>
    rows.find((row) => row.id === String(coupon._id))
  );
}

export async function updateCoupon(
  id: string,
  input: Partial<{
    type: string;
    value: number;
    startsAt: string | null;
    endsAt: string | null;
    usageLimit: number | null;
    perCustomerLimit: number | null;
    minimumOrderCents: number;
    productIds: string[];
    categoryIds: string[];
    isActive: boolean;
  }>
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid coupon id");
  }
  const coupon = await CouponModel.findById(id);
  if (!coupon) {
    throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }

  if (input.type !== undefined) coupon.type = input.type as never;
  if (input.value !== undefined) coupon.value = input.value;
  if (input.startsAt !== undefined) {
    coupon.startsAt = input.startsAt ? new Date(input.startsAt) : undefined;
  }
  if (input.endsAt !== undefined) {
    coupon.endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
  }
  if (input.usageLimit !== undefined) {
    coupon.usageLimit = input.usageLimit ?? undefined;
  }
  if (input.perCustomerLimit !== undefined) {
    coupon.perCustomerLimit = input.perCustomerLimit ?? undefined;
  }
  if (input.minimumOrderCents !== undefined) {
    coupon.minimumOrderCents = input.minimumOrderCents;
  }
  if (input.productIds !== undefined) {
    coupon.productIds = input.productIds.filter((id) =>
      Types.ObjectId.isValid(id)
    ) as never;
  }
  if (input.categoryIds !== undefined) {
    coupon.categoryIds = input.categoryIds.filter((id) =>
      Types.ObjectId.isValid(id)
    ) as never;
  }
  if (input.isActive !== undefined) coupon.isActive = input.isActive;

  await coupon.save();
  const rows = await listCoupons();
  return rows.find((row) => row.id === id);
}
