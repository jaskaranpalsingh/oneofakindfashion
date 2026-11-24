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
    <div className="flex shrink-0 items-center justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
      <div className="min-w-0">
        <h2 className="font-serif text-[1.65rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-[1.85rem]">
          Shopping bag
        </h2>
        <p className="mt-2 text-[12px] text-[#6B726E]">
          {itemCount === 0
            ? "No items yet"
            : itemCount === 1
              ? "1 item"
              : `${itemCount} items`}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#003F2D]/70 transition hover:text-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        aria-label="Close cart drawer"
      >
        <X className="h-5 w-5" strokeWidth={1.4} />
      </button>
    </div>
  );
}
