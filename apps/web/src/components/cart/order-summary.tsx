"use client";

import Link from "next/link";
import { formatCad } from "@ookf/shared";
import { CouponForm } from "@/components/cart/coupon-form";
import { cn } from "@/lib/utils";

export function OrderSummary({
  subtotalCents,
  discountCents,
  couponCode,
  canCheckout,
  onApplyCoupon,
  onRemoveCoupon,
}: {
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  canCheckout: boolean;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
}) {
  return (
    <aside className="h-fit border border-[#E7E2D9] bg-white p-6 sm:p-7 lg:sticky lg:top-28">
      <h2 className="font-serif text-[1.85rem] text-[#003F2D]">Order summary</h2>
      <span className="mt-3 block h-px w-14 bg-[#B68A25]" aria-hidden />

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#687170]">Subtotal</span>
          <span className="font-semibold text-[#003F2D]">
            {formatCad(subtotalCents)}
          </span>
        </div>
        {discountCents > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#687170]">Discount</span>
            <span className="font-medium text-[#003F2D]">
              −{formatCad(discountCents)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#687170]">Shipping</span>
          <span className="text-[#687170]">Calculated at checkout</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#687170]">Taxes</span>
          <span className="text-[#687170]">Calculated at checkout</span>
        </div>
      </div>

      <CouponForm
        appliedCode={couponCode}
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
      />

      <Link
        href="/checkout"
        aria-disabled={!canCheckout}
        className={cn(
          "mt-6 flex h-[52px] w-full items-center justify-center bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-200",
          "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
          !canCheckout && "pointer-events-none opacity-45"
        )}
      >
        Proceed to checkout
      </Link>
    </aside>
  );
}
