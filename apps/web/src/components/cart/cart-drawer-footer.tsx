"use client";

import Link from "next/link";
import { formatCad } from "@ookf/shared";
import { cn } from "@/lib/utils";

export function CartDrawerFooter({
  subtotalCents,
  canCheckout,
  onContinueShopping,
  onNavigate,
}: {
  subtotalCents: number;
  canCheckout: boolean;
  onContinueShopping: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-[#E5E5E2] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-serif text-lg text-[#003F2D]">Subtotal</span>
        <span className="font-serif text-lg font-medium text-[#003F2D]">
          {formatCad(subtotalCents)}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] text-[#666666]">
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
          "mt-5 flex h-[50px] w-full items-center justify-center bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-200",
          "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
          !canCheckout && "pointer-events-none opacity-45"
        )}
      >
        Proceed to checkout
      </Link>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onContinueShopping}
          className="flex h-11 items-center justify-center border border-[#E5E5E2] bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003F2D] transition hover:border-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          Continue shopping
        </button>
        <Link
          href="/cart"
          onClick={onNavigate}
          className="flex h-11 items-center justify-center border border-[#B68A25] bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003F2D] transition hover:bg-[#FAF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
