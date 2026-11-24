"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "bag", label: "Shopping Bag" },
  { id: "information", label: "Information" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmation" },
] as const;

export function CheckoutProgress({
  current = "information",
}: {
  current?: "bag" | "information" | "payment" | "confirmation";
}) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-[#6B726E]">
      {STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden className="text-[#C9C2B5]">
                /
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                active && "font-semibold text-[#003F2D]",
                complete && "text-[#003F2D]"
              )}
            >
              {complete ? (
                <Check className="h-3.5 w-3.5 text-[#C49A36]" strokeWidth={2} />
              ) : null}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
