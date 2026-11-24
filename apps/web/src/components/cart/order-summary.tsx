"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCad } from "@ookf/shared";
import { FreeShippingProgress } from "@/components/commerce/free-shipping-progress";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function OrderSummary({
  subtotalCents,
  discountCents,
  couponCode,
  canCheckout,
}: {
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  canCheckout: boolean;
}) {
  const settingsQuery = useQuery({
    queryKey: ["public-settings", "free-shipping"],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/settings`, {
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error("Failed to load settings");
      }
      return json.data as {
        shipping?: { freeShippingMinimumCents?: number };
      };
    },
    staleTime: 60_000,
  });
  const freeMin =
    settingsQuery.data?.shipping?.freeShippingMinimumCents ?? 20000;
  const merchandiseTotalCents = Math.max(0, subtotalCents - discountCents);

  return (
    <aside className="h-fit border border-[#E7E2D9] bg-white p-6 sm:p-7 lg:sticky lg:top-28">
      <h2 className="font-serif text-[1.85rem] text-[#003F2D]">Order summary</h2>
      <span className="mt-3 block h-px w-14 bg-[#B68A25]" aria-hidden />

      <FreeShippingProgress
        className="mt-5"
        eligibleSubtotalCents={merchandiseTotalCents}
        freeShippingMinimumCents={freeMin}
      />

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#687170]">Subtotal</span>
          <span className="font-semibold text-[#003F2D]">
            {formatCad(subtotalCents)}
          </span>
        </div>
        {discountCents > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#687170]">
              {couponCode ? `Discount (${couponCode})` : "Discount"}
            </span>
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
        <div className="flex items-center justify-between gap-4 border-t border-[#E7E2D9] pt-3">
          <span className="font-medium text-[#003F2D]">Estimated total</span>
          <span className="font-serif text-xl text-[#003F2D]">
            {formatCad(merchandiseTotalCents)}
          </span>
        </div>
      </div>

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
