import { DiscountType, createCouponSchema, updateCouponSchema } from "@ookf/shared";
import { Types } from "mongoose";
import { CouponModel } from "../models/coupon.model";
import { OrderModel } from "../models/order.model";
import { PaymentStatus } from "@ookf/shared";
import { AppError } from "../utils/app-error";
import { computeCouponStatus } from "./coupon-validation.service";

function mapCoupon(coupon: Record<string, unknown>) {
  const status = computeCouponStatus(coupon as never);
  return {
    id: String(coupon._id),
    code: coupon.code,
    description: (coupon.description as string | undefined) ?? "",
    type: coupon.type,
    value: coupon.value,
    startsAt: coupon.startsAt ?? null,
    endsAt: coupon.endsAt ?? null,
    usageLimit: coupon.usageLimit ?? null,
    perCustomerLimit: coupon.perCustomerLimit ?? null,
    usedCount: coupon.usedCount ?? 0,
    minimumOrderCents: coupon.minimumOrderCents ?? 0,
    maximumDiscountCents: coupon.maximumDiscountCents ?? null,
    productIds: ((coupon.productIds as unknown[]) ?? []).map(String),
    categoryIds: ((coupon.categoryIds as unknown[]) ?? []).map(String),
    isActive: coupon.isActive ?? true,
    archivedAt: coupon.archivedAt ?? null,
    status,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

export async function listCoupons(options?: {
  includeArchived?: boolean;
  status?: string;
  type?: string;
  q?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (!options?.includeArchived) {
    filter.archivedAt = null;
  }
  if (options?.type && Object.values(DiscountType).includes(options.type as never)) {
    filter.type = options.type;
  }
  if (options?.q?.trim()) {
    filter.code = new RegExp(options.q.trim(), "i");
  }

  const coupons = await CouponModel.find(filter).sort({ createdAt: -1 }).lean();
  let rows = coupons.map((coupon) => mapCoupon(coupon as never));
  if (options?.status) {
    rows = rows.filter((row) => row.status === options.status);
  }
  return rows;
}

export async function getCouponStats() {
  const coupons = await CouponModel.find({ archivedAt: null }).lean();
  const mapped = coupons.map((coupon) => mapCoupon(coupon as never));
  const paid = await OrderModel.aggregate([
    {
      $match: {
        paymentStatus: {
          $in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED],
        },
        couponCode: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: null,
        redemptions: { $sum: 1 },
        discountCents: { $sum: "$totals.discountCents" },
      },
    },
  ]);

  return {
    total: mapped.length,
    active: mapped.filter((row) => row.status === "active").length,
    expired: mapped.filter((row) => row.status === "expired").length,
    scheduled: mapped.filter((row) => row.status === "scheduled").length,
    disabled: mapped.filter((row) => row.status === "disabled").length,
    usageLimitReached: mapped.filter(
      (row) => row.status === "usage_limit_reached"
    ).length,
    totalRedemptions: paid[0]?.redemptions ?? 0,
    totalDiscountCents: paid[0]?.discountCents ?? 0,
  };
}

function parseObjectIds(ids?: string[]) {
  return (ids ?? [])
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

export async function createCoupon(input: unknown) {
  const data = createCouponSchema.parse(input);

  if (data.type === DiscountType.PERCENTAGE && data.value > 100) {
    throw new AppError(
      400,
      "INVALID_VALUE",
      "Percentage discounts cannot exceed 100%"
    );
  }

  const existing = await CouponModel.exists({
    code: data.code,
    archivedAt: null,
  });
  if (existing) {
    throw new AppError(409, "CODE_EXISTS", "Coupon code already exists");
  }

  const coupon = await CouponModel.create({
    code: data.code,
    description: data.description ?? "",
    type: data.type,
    value: data.value,
    startsAt: data.startsAt,
    endsAt: data.noExpiry ? undefined : data.endsAt,
    usageLimit: data.usageLimit,
    perCustomerLimit: data.perCustomerLimit,
    minimumOrderCents: data.minimumOrderCents ?? 0,
    maximumDiscountCents: data.maximumDiscountCents,
    productIds: parseObjectIds(data.productIds),
    categoryIds: parseObjectIds(data.categoryIds),
    isActive: data.isActive ?? true,
  });

  return mapCoupon(coupon.toObject() as never);
}

export async function updateCoupon(id: string, input: unknown) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid coupon id");
  }
  const data = updateCouponSchema.parse(input);
  const coupon = await CouponModel.findOne({ _id: id, archivedAt: null });
  if (!coupon) {
    throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }

  if (data.description !== undefined) coupon.description = data.description;
  if (data.type !== undefined) coupon.type = data.type as never;
  if (data.value !== undefined) {
    if (data.type === DiscountType.PERCENTAGE || coupon.type === DiscountType.PERCENTAGE) {
      const nextType = data.type ?? coupon.type;
      if (nextType === DiscountType.PERCENTAGE && data.value > 100) {
        throw new AppError(
          400,
          "INVALID_VALUE",
          "Percentage discounts cannot exceed 100%"
        );
      }
    }
    coupon.value = data.value;
  }
  if (data.startsAt !== undefined) {
    coupon.startsAt = data.startsAt ?? undefined;
  }
  if (data.noExpiry === true) {
    coupon.endsAt = undefined;
  } else if (data.endsAt !== undefined) {
    coupon.endsAt = data.endsAt ?? undefined;
  }
  if (data.usageLimit !== undefined) {
    coupon.usageLimit = data.usageLimit ?? undefined;
  }
  if (data.perCustomerLimit !== undefined) {
    coupon.perCustomerLimit = data.perCustomerLimit ?? undefined;
  }
  if (data.minimumOrderCents !== undefined) {
    coupon.minimumOrderCents = data.minimumOrderCents;
  }
  if (data.maximumDiscountCents !== undefined) {
    coupon.maximumDiscountCents = data.maximumDiscountCents ?? undefined;
  }
  if (data.productIds !== undefined) {
    coupon.productIds = parseObjectIds(data.productIds) as never;
  }
  if (data.categoryIds !== undefined) {
    coupon.categoryIds = parseObjectIds(data.categoryIds) as never;
  }
  if (data.isActive !== undefined) coupon.isActive = data.isActive;

  await coupon.save();
  return mapCoupon(coupon.toObject() as never);
}

export async function duplicateCoupon(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid coupon id");
  }
  const source = await CouponModel.findById(id).lean();
  if (!source) {
    throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }

  let attempt = 1;
  let code = `${source.code}_COPY`;
  while (await CouponModel.exists({ code })) {
    attempt += 1;
    code = `${source.code}_COPY${attempt}`;
    if (attempt > 20) {
      throw new AppError(409, "CODE_EXISTS", "Unable to generate a unique copy code");
    }
  }

  const coupon = await CouponModel.create({
    code,
    description: source.description ?? "",
    type: source.type,
    value: source.value,
    startsAt: source.startsAt,
    endsAt: source.endsAt,
    usageLimit: source.usageLimit,
    perCustomerLimit: source.perCustomerLimit,
    usedCount: 0,
    minimumOrderCents: source.minimumOrderCents ?? 0,
    maximumDiscountCents: source.maximumDiscountCents,
    productIds: source.productIds ?? [],
    categoryIds: source.categoryIds ?? [],
    isActive: false,
  });

  return mapCoupon(coupon.toObject() as never);
}

export async function archiveCoupon(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid coupon id");
  }
  const coupon = await CouponModel.findOne({ _id: id, archivedAt: null });
  if (!coupon) {
    throw new AppError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }
  coupon.isActive = false;
  coupon.archivedAt = new Date();
  await coupon.save();
  return { archived: true, id };
}
