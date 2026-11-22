"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  id = "quantity",
  className,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
}) {
  const decreaseDisabled = value <= min;
  const increaseDisabled = value >= max;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <label
        htmlFor={id}
        className="shrink-0 text-sm font-semibold text-[#252A27]"
      >
        Quantity
      </label>
      <div className="inline-flex h-9 items-stretch rounded-sm border border-[#E5E1D9] bg-white">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={decreaseDisabled}
          onClick={() => {
            const next = value - 1;
            if (next !== value) onChange(next);
          }}
          className="inline-flex w-9 items-center justify-center text-[#003F2D] transition hover:bg-[#FAF8F3] disabled:opacity-35"
        >
          <Minus className="h-3 w-3" strokeWidth={1.75} />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            const clamped = Math.min(max, Math.max(min, Math.trunc(next)));
            if (clamped !== value) onChange(clamped);
          }}
          onBlur={() => {
            let next = value;
            if (!Number.isFinite(value) || value < min) next = min;
            else if (value > max) next = max;
            if (next !== value) onChange(next);
          }}
          className="w-10 border-x border-[#E5E1D9] bg-transparent text-center text-sm text-[#003F2D] outline-none"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={increaseDisabled}
          onClick={() => {
            const next = value + 1;
            if (next !== value) onChange(next);
          }}
          className="inline-flex w-9 items-center justify-center text-[#003F2D] transition hover:bg-[#FAF8F3] disabled:opacity-35"
        >
          <Plus className="h-3 w-3" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
