"use client";

import { ShoppingBag } from "lucide-react";

export function EmptyCart({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <ShoppingBag
        className="h-10 w-10 text-[#B68A25]/80"
        strokeWidth={1.25}
        aria-hidden
      />
      <h3 className="mt-5 font-serif text-2xl text-[#003F2D]">
        Your Shopping Bag
      </h3>
      <p className="mt-2 text-sm text-[#666666]">
        Your bag is currently empty.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 h-11 border border-[#E5E5E2] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#003F2D] transition hover:border-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
      >
        Continue shopping
      </button>
    </div>
  );
}
