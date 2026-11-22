"use client";

import { cn } from "@/lib/utils";

export function CheckoutField({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-medium text-[#003F2D]"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const checkoutInputClass =
  "flex h-10 w-full border border-[#E5E1D9] bg-white px-3 text-[13px] text-[#202820] outline-none transition placeholder:text-[#687170]/80 focus:border-[#003F2D] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-50";

export const checkoutSelectClass = checkoutInputClass;
