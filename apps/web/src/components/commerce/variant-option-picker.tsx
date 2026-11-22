"use client";

import {
  getColourSwatch,
  getOptionLabel,
  type VariantOptionKey,
} from "@/hooks/use-product-variant-selection";
import { cn } from "@/lib/utils";

type VariantOptionPickerProps = {
  optionKey: VariantOptionKey;
  values: string[];
  selected?: string;
  productType?: string;
  isAvailable: (value: string) => boolean;
  isInStock: (value: string) => boolean;
  onSelect: (value: string) => void;
};

export function VariantOptionPicker({
  optionKey,
  values,
  selected,
  productType,
  isAvailable,
  isInStock,
  onSelect,
}: VariantOptionPickerProps) {
  if (values.length === 0) return null;

  const label = getOptionLabel(optionKey, productType);
  const useSwatches = optionKey === "colour";

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[#252A27]">{label}</legend>
      <div
        className={cn(
          "mt-3 flex flex-wrap",
          useSwatches ? "items-center gap-3" : "gap-2.5"
        )}
      >
        {values.map((value) => {
          const available = isAvailable(value);
          const inStock = isInStock(value);
          const active = selected === value;
          const swatch = useSwatches ? getColourSwatch(value) : null;
          const disabled = !available;

          if (useSwatches) {
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                aria-label={`${label} ${value}${!inStock ? " (out of stock)" : ""}`}
                title={value}
                onClick={() => onSelect(value)}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D] focus-visible:ring-offset-2",
                  active ? "ring-1 ring-[#003F2D] ring-offset-2 ring-offset-[#FAF8F3]" : null,
                  disabled ? "cursor-not-allowed opacity-35" : "hover:scale-[1.04]"
                )}
              >
                <span
                  className={cn(
                    "h-7 w-7 rounded-full border border-[#E5E1D9]",
                    !inStock && available ? "opacity-50" : null
                  )}
                  style={{
                    backgroundColor: swatch ?? "#D1D5DB",
                  }}
                  aria-hidden
                />
                {!swatch ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] font-semibold uppercase text-[#003F2D]">
                    {value.slice(0, 2)}
                  </span>
                ) : null}
              </button>
            );
          }

          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-label={`${label} ${value}${!inStock ? " (out of stock)" : ""}`}
              onClick={() => onSelect(value)}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 text-sm font-medium transition duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D] focus-visible:ring-offset-2",
                active
                  ? "border-[#003F2D] bg-[#003F2D] text-white"
                  : "border-[#E5E1D9] bg-white text-[#252A27] hover:border-[#003F2D]/45",
                disabled ? "cursor-not-allowed opacity-35" : null,
                !inStock && available && !active
                  ? "border-dashed text-[#656B68] line-through"
                  : null
              )}
            >
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
