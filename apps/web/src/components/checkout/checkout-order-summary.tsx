"use client";

import { formatCad } from "@ookf/shared";
import { formatVariantOptions, type CartLine } from "@/lib/cart";

export function CheckoutOrderSummary({
  mode,
  items,
  subtotalCents,
  discountCents,
}: {
  mode: "cart" | "buy_now";
  items: CartLine[];
  subtotalCents: number;
  discountCents: number;
}) {
  return (
    <aside className="h-fit border border-[#E5E1D9] bg-white p-4 sm:p-5 lg:sticky lg:top-24">
      <h2 className="font-serif text-xl leading-none text-[#003F2D] sm:text-[1.35rem]">
        Order summary
      </h2>
      <span className="mt-2 block h-px w-10 bg-[#B68A25]" aria-hidden />

      {mode === "buy_now" ? (
        <p className="mt-3.5 text-[13px] leading-relaxed text-[#687170]">
          Buy Now checkout includes only your selected item. Your shopping bag
          stays unchanged until payment completes.
        </p>
      ) : (
        <ul className="mt-3.5 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="text-[13px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#202820]">
                    {item.name} × {item.quantity}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#687170]">
                    {formatVariantOptions(item.options) || item.sku}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-[#202820]">
                  {formatCad(item.lineTotalCents)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3.5 space-y-2 border-t border-[#E5E1D9] pt-3 text-[13px]">
        <div className="flex justify-between gap-4">
          <span className="text-[#687170]">Subtotal</span>
          <span className="font-semibold text-[#003F2D]">
            {mode === "cart" ? formatCad(subtotalCents) : "Confirmed at payment"}
          </span>
        </div>
        {mode === "cart" && discountCents > 0 ? (
          <div className="flex justify-between gap-4">
            <span className="text-[#687170]">Discount</span>
            <span className="font-medium text-[#003F2D]">
              −{formatCad(discountCents)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <span className="text-[#687170]">Shipping & tax</span>
          <span className="text-[#687170]">Calculated securely</span>
        </div>
      </div>

      <p className="mt-3.5 text-[11px] leading-relaxed text-[#687170]">
        Final CAD totals are recalculated on the server before Stripe payment.
        Card details are handled securely by Stripe and are not stored on our
        servers.
      </p>
    </aside>
  );
}
