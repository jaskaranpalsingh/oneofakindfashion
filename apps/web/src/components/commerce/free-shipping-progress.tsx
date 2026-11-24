"use client";

import { formatCad } from "@ookf/shared";
import { cn } from "@/lib/utils";

type FreeShippingProgressProps = {
  /** Merchandise subtotal after discounts */
  eligibleSubtotalCents: number;
  freeShippingMinimumCents: number;
  className?: string;
  compact?: boolean;
};

export function FreeShippingProgress({
  eligibleSubtotalCents,
  freeShippingMinimumCents,
  className,
  compact = false,
}: FreeShippingProgressProps) {
  if (!freeShippingMinimumCents || freeShippingMinimumCents <= 0) return null;

  const remaining = Math.max(
    0,
    freeShippingMinimumCents - Math.max(0, eligibleSubtotalCents)
  );
  const progress = Math.min(
    100,
    Math.round((eligibleSubtotalCents / freeShippingMinimumCents) * 100)
  );
  const qualifies = remaining === 0;

  return (
    <div
      className={cn(
        "border border-[#E5DFD4] bg-[#FAF7F0] px-3 py-3",
        className
      )}
      role="status"
    >
      <p
        className={cn(
          "text-[#003F2D]",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {qualifies
          ? "Your order qualifies for free standard shipping."
          : `You're ${formatCad(remaining)} away from free shipping.`}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5DFD4]">
        <div
          className="h-full bg-[#003F2D] transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
      {!compact ? (
        <p className="mt-1.5 text-[11px] text-[#6B726E]">
          Free standard shipping at {formatCad(freeShippingMinimumCents)}+
          (after discounts, before tax). Express is not included.
        </p>
      ) : null}
    </div>
  );
}
