"use client";

import type { InputHTMLAttributes } from "react";
import { formatCanadianPostalCode } from "@ookf/shared";
import { cn } from "@/lib/utils";
import { checkoutInputClass } from "@/components/checkout/checkout-field";

type CanadianPostalInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "maxLength" | "placeholder"
> & {
  invalid?: boolean;
};

export function CanadianPostalInput({
  className,
  invalid,
  onChange,
  ...props
}: CanadianPostalInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="text"
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      maxLength={7}
      placeholder="A1A 1A1"
      aria-invalid={invalid}
      className={cn(checkoutInputClass, "uppercase tracking-wide", className)}
      onChange={(event) => {
        event.target.value = formatCanadianPostalCode(event.target.value);
        onChange?.(event);
      }}
    />
  );
}
