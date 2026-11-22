"use client";

import { X } from "lucide-react";

export function CartDrawerHeader({
  itemCount,
  onClose,
}: {
  itemCount: number;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E5E5E2] px-5 pb-4 pt-5 sm:px-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B68A25]">
          Your shopping bag
        </p>
        <h2 className="mt-1.5 font-serif text-[1.85rem] leading-none tracking-[-0.02em] text-[#003F2D]">
          Cart ({itemCount})
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#003F2D] transition hover:text-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        aria-label="Close cart drawer"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
