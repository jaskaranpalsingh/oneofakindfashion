"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function CartQuantityControl({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  id,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  id: string;
}) {
  const decreaseDisabled = disabled || value <= min;
  const increaseDisabled = disabled || value >= max;

  return (
    <div
      className="inline-flex h-9 items-stretch border border-[#E5E5E2] bg-white"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        id={`${id}-decrease`}
        aria-label="Decrease quantity"
        disabled={decreaseDisabled}
        onClick={() => {
          const next = value - 1;
          if (next >= min && next !== value) onChange(next);
        }}
        className={cn(
          "inline-flex w-9 items-center justify-center text-[#003F2D] transition",
          "hover:bg-[#FAF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
          "disabled:cursor-not-allowed disabled:opacity-35"
        )}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <span
        id={id}
        className="flex w-10 items-center justify-center border-x border-[#E5E5E2] text-sm text-[#003F2D]"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        id={`${id}-increase`}
        aria-label="Increase quantity"
        disabled={increaseDisabled}
        onClick={() => {
          const next = value + 1;
          if (next <= max && next !== value) onChange(next);
        }}
        className={cn(
          "inline-flex w-9 items-center justify-center text-[#003F2D] transition",
          "hover:bg-[#FAF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
          "disabled:cursor-not-allowed disabled:opacity-35"
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
