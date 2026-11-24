"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCad } from "@ookf/shared";
import { FreeShippingProgress } from "@/components/commerce/free-shipping-progress";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function CartDrawerFooter({
  subtotalCents,
  discountCents = 0,
  couponCode = null,
  canCheckout,
  onContinueShopping,
  onNavigate,
}: {
  subtotalCents: number;
  discountCents?: number;
  couponCode?: string | null;
  canCheckout: boolean;
  onContinueShopping: () => void;
  onNavigate: () => void;
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
  const eligible = Math.max(0, subtotalCents - discountCents);

  return (
    <div className="shrink-0 border-t border-[#E8E2D6] bg-[#FAF8F3] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] text-[#5F6763]">Subtotal</span>
        <span className="font-serif text-[1.35rem] leading-none text-[#003F2D]">
          {formatCad(subtotalCents)}
        </span>
      </div>
      {discountCents > 0 ? (
        <div className="mt-2 flex items-baseline justify-between gap-4 text-[13px]">
          <span className="text-[#5F6763]">
            {couponCode ? `Discount (${couponCode})` : "Discount"}
          </span>
          <span className="font-medium text-[#003F2D]">
            −{formatCad(discountCents)}
          </span>
        </div>
      ) : null}
      <FreeShippingProgress
        className="mt-3"
        compact
        eligibleSubtotalCents={eligible}
        freeShippingMinimumCents={freeMin}
      />
      <p className="mt-2 text-[12px] leading-relaxed text-[#7A817C]">
        Shipping and taxes calculated at checkout.
      </p>

      <Link
        href="/checkout"
        onClick={(event) => {
          if (!canCheckout) {
            event.preventDefault();
            return;
          }
          onNavigate();
        }}
        aria-disabled={!canCheckout}
        className={cn(
          "mt-5 flex h-12 w-full items-center justify-center bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-200",
          "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
          !canCheckout && "pointer-events-none opacity-45"
        )}
      >
        Checkout
      </Link>

      <div className="mt-4 flex items-center justify-center gap-3 text-[12px] text-[#5F6763]">
        <button
          type="button"
          onClick={onContinueShopping}
          className="underline-offset-4 transition hover:text-[#003F2D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          Continue shopping
        </button>
        <span aria-hidden className="text-[#C9C2B5]">
          ·
        </span>
        <Link
          href="/cart"
          onClick={onNavigate}
          className="underline-offset-4 transition hover:text-[#003F2D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          View bag
        </Link>
      </div>
    </div>
  );
}
