import {
  DiscountType,
  applyPercentageDiscount,
  clampDiscount,
} from "@ookf/shared";
import { Types } from "mongoose";
import { CouponModel } from "../models/coupon.model";
import { OrderModel } from "../models/order.model";
import { PaymentStatus } from "@ookf/shared";
import { AppError } from "../utils/app-error";

export type CouponEffectiveStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "disabled"
  | "usage_limit_reached"
  | "archived";

export type CartLineForCoupon = {
  productId: string;
  categoryId?: string | null;
  lineTotalCents: number;
};

type CouponLean = {
  _id: Types.ObjectId;
  code: string;
  description?: string | null;
  type: string;
  value: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  usedCount?: number | null;
  minimumOrderCents?: number | null;
  maximumDiscountCents?: number | null;
  productIds?: Types.ObjectId[];
  categoryIds?: Types.ObjectId[];
  isActive?: boolean | null;
  archivedAt?: Date | null;
};

export function computeCouponStatus(
  coupon: CouponLean,
  now = new Date()
): CouponEffectiveStatus {
  if (coupon.archivedAt) return "archived";
  if (!coupon.isActive) return "disabled";
  if (
    typeof coupon.usageLimit === "number" &&
    (coupon.usedCount ?? 0) >= coupon.usageLimit
  ) {
    return "usage_limit_reached";
  }
  if (coupon.startsAt && coupon.startsAt > now) return "scheduled";
  if (coupon.endsAt && coupon.endsAt < now) return "expired";
  return "active";
}

function eligibleSubtotalCents(
  coupon: CouponLean,
  lines: CartLineForCoupon[]
): number {
  const productIds = new Set((coupon.productIds ?? []).map(String));
  const categoryIds = new Set((coupon.categoryIds ?? []).map(String));
  const hasProductFilter = productIds.size > 0;
  const hasCategoryFilter = categoryIds.size > 0;

  if (!hasProductFilter && !hasCategoryFilter) {
    return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  }

  return lines.reduce((sum, line) => {
    const productOk = hasProductFilter && productIds.has(line.productId);
    const categoryOk =
      hasCategoryFilter &&
      Boolean(line.categoryId && categoryIds.has(line.categoryId));
    if (productOk || categoryOk) return sum + line.lineTotalCents;
    return sum;
  }, 0);
}

function computeDiscountCents(coupon: CouponLean, eligibleCents: number) {
  let discountCents = 0;
  if (coupon.type === DiscountType.PERCENTAGE) {
    discountCents = applyPercentageDiscount(eligibleCents, coupon.value);
  } else {
    discountCents = Math.round(coupon.value);
  }
  if (
    typeof coupon.maximumDiscountCents === "number" &&
    coupon.maximumDiscountCents > 0
  ) {
    discountCents = Math.min(discountCents, coupon.maximumDiscountCents);
  }
  return clampDiscount(discountCents, eligibleCents);
}

async function countCustomerRedemptions(
  code: string,
  userId?: string,
  email?: string
) {
  const filter: Record<string, unknown> = {
    couponCode: code.toUpperCase(),
    paymentStatus: {
      $in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED],
    },
  };
  if (userId && Types.ObjectId.isValid(userId)) {
    filter.userId = new Types.ObjectId(userId);
  } else if (email) {
    filter.customerEmail = email.toLowerCase().trim();
  } else {
    return 0;
  }
  return OrderModel.countDocuments(filter);
}

/**
 * Validate a coupon for the given cart lines and optional customer identity.
 * Throws AppError with customer-friendly messages.
 */
export async function validateCouponForCart(options: {
  code: string;
  lines: CartLineForCoupon[];
  userId?: string;
  email?: string;
  /** When true, inactive/scheduled/expired etc. soft-clear instead of throw (hydrate). */
  soft?: boolean;
}) {
  const normalized = options.code.trim().toUpperCase();
  if (!normalized) {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(400, "COUPON_REQUIRED", "Enter a coupon code");
  }

  const coupon = (await CouponModel.findOne({
    code: normalized,
    archivedAt: null,
  }).lean()) as CouponLean | null;

  if (!coupon) {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(400, "COUPON_INVALID", "Invalid coupon code.");
  }

  const status = computeCouponStatus(coupon);
  if (status === "disabled" || status === "archived") {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(400, "COUPON_INACTIVE", "This coupon is not active.");
  }
  if (status === "scheduled") {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(
      400,
      "COUPON_NOT_STARTED",
      "This coupon is not active yet."
    );
  }
  if (status === "expired") {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(400, "COUPON_EXPIRED", "This coupon has expired.");
  }
  if (status === "usage_limit_reached") {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(
      400,
      "COUPON_EXHAUSTED",
      "Coupon usage limit reached."
    );
  }

  const cartSubtotal = options.lines.reduce(
    (sum, line) => sum + line.lineTotalCents,
    0
  );
  if ((coupon.minimumOrderCents ?? 0) > cartSubtotal) {
    if (options.soft) {
      return { couponCode: coupon.code, discountCents: 0 };
    }
    const minimumCad = ((coupon.minimumOrderCents ?? 0) / 100).toFixed(2);
    throw new AppError(
      400,
      "COUPON_MINIMUM",
      `Minimum order of $${minimumCad} CAD required for this coupon.`
    );
  }

  const eligibleCents = eligibleSubtotalCents(coupon, options.lines);
  if (eligibleCents <= 0) {
    if (options.soft) return { couponCode: null, discountCents: 0 };
    throw new AppError(
      400,
      "COUPON_NOT_APPLICABLE",
      "This coupon is not applicable to your selected products."
    );
  }

  if (
    typeof coupon.perCustomerLimit === "number" &&
    coupon.perCustomerLimit > 0 &&
    (options.userId || options.email)
  ) {
    const used = await countCustomerRedemptions(
      coupon.code,
      options.userId,
      options.email
    );
    if (used >= coupon.perCustomerLimit) {
      if (options.soft) return { couponCode: null, discountCents: 0 };
      throw new AppError(
        400,
        "COUPON_CUSTOMER_LIMIT",
        "You have already used this coupon."
      );
    }
  }

  const discountCents = computeDiscountCents(coupon, eligibleCents);
  return {
    couponCode: coupon.code,
    discountCents,
    couponId: String(coupon._id),
    status: "active" as const,
  };
}

/** Atomic usage increment that refuses to exceed the global usage limit. */
export async function incrementCouponUsageAtomic(code?: string | null) {
  if (!code) return { incremented: false };
  const normalized = code.toUpperCase();
  const result = await CouponModel.updateOne(
    {
      code: normalized,
      archivedAt: null,
      $or: [
        { usageLimit: { $exists: false } },
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ],
    },
    { $inc: { usedCount: 1 } }
  );
  return { incremented: (result.modifiedCount ?? 0) > 0 };
}
