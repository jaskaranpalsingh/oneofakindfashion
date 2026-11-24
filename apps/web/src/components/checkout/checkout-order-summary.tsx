"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatCad } from "@ookf/shared";
import { CartQuantityControl } from "@/components/cart/cart-quantity-control";
import { CouponForm } from "@/components/cart/coupon-form";
import { FreeShippingProgress } from "@/components/commerce/free-shipping-progress";
import {
  formatVariantOptions,
  type CartLine,
  type CheckoutQuoteLine,
} from "@/lib/cart";
import { cn } from "@/lib/utils";

export type CheckoutQuote = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  taxBreakdown?: Array<{ name: string; amountCents: number }>;
  couponCode?: string | null;
  amountUntilFreeCents?: number;
  qualifiesForFreeShipping?: boolean;
  freeShippingMinimumCents?: number;
  zoneName?: string | null;
  availableMethods?: Array<{
    code: string;
    name: string;
    rateCents: number | null;
    available: boolean;
  }>;
};

export function CheckoutOrderSummary({
  mode,
  items,
  quote,
  quoteLoading,
  onQuantityChange,
  onApplyCoupon,
  onRemoveCoupon,
  className,
}: {
  mode: "cart" | "buy_now";
  items: Array<CartLine | CheckoutQuoteLine>;
  quote: CheckoutQuote | null;
  quoteLoading?: boolean;
  onQuantityChange?: (item: CartLine | CheckoutQuoteLine, quantity: number) => Promise<void> | void;
  onApplyCoupon?: (code: string) => Promise<void>;
  onRemoveCoupon?: () => Promise<void>;
  className?: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const subtotal = quote?.subtotalCents ?? items.reduce((s, i) => s + i.lineTotalCents, 0);
  const discount = quote?.discountCents ?? 0;
  const shipping = quote?.shippingCents;
  const tax = quote?.taxCents;
  const total = quote?.totalCents;

  async function handleQuantity(
    item: CartLine | CheckoutQuoteLine,
    quantity: number
  ) {
    if (!onQuantityChange || quantity === item.quantity) return;
    setPendingId(item.id);
    try {
      await onQuantityChange(item, quantity);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <aside
      className={cn(
        "h-fit border border-[#E5DFD4] bg-white p-5 sm:p-6 lg:sticky lg:top-24",
        className
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-[1.45rem] leading-none text-[#003F2D]">
            Order summary
          </h2>
          <span className="mt-2.5 block h-px w-10 bg-[#C49A36]" aria-hidden />
        </div>
        {mode === "cart" ? (
          <Link
            href="/cart"
            className="text-[11px] uppercase tracking-[0.12em] text-[#003F2D] underline-offset-4 hover:underline"
          >
            Edit bag
          </Link>
        ) : null}
      </div>

      {mode === "buy_now" ? (
        <p className="mt-4 text-[13px] leading-relaxed text-[#6B726E]">
          Buy Now includes only your selected item. Your shopping bag stays
          unchanged until payment completes.
        </p>
      ) : null}

      {quote?.freeShippingMinimumCents ? (
        <FreeShippingProgress
          className="mt-4"
          compact
          eligibleSubtotalCents={Math.max(
            0,
            (quote.subtotalCents ?? 0) - (quote.discountCents ?? 0)
          )}
          freeShippingMinimumCents={quote.freeShippingMinimumCents}
        />
      ) : null}

      {quote?.zoneName ? (
        <p className="mt-3 text-[12px] text-[#6B726E]">
          Shipping zone: {quote.zoneName}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-5 max-h-[320px] space-y-4 overflow-y-auto pr-1">
          {items.map((item) => {
            const maxQuantity =
              "maxQuantity" in item && typeof item.maxQuantity === "number"
                ? Math.max(1, item.maxQuantity)
                : 99;

            return (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-[72px] w-[56px] shrink-0 overflow-hidden bg-[#F3EEE3]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      quality={70}
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[1.05rem] leading-snug text-[#003F2D]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B726E]">
                    {formatVariantOptions(item.options) || item.sku}
                  </p>
                  <div className="mt-2">
                    {onQuantityChange ? (
                      <CartQuantityControl
                        id={`checkout-qty-${item.id}`}
                        value={item.quantity}
                        min={1}
                        max={maxQuantity}
                        disabled={pendingId === item.id || quoteLoading}
                        onChange={(next) => void handleQuantity(item, next)}
                      />
                    ) : (
                      <p className="text-[12px] text-[#6B726E]">
                        Qty {item.quantity}
                      </p>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-[13px] font-medium text-[#003F2D]">
                  {formatCad(item.lineTotalCents)}
                </p>
              </li>
            );
          })}
        </ul>
      ) : mode === "buy_now" ? (
        <p className="mt-5 text-[13px] text-[#6B726E]">
          Loading your selected item…
        </p>
      ) : null}

      {mode === "cart" && onApplyCoupon && onRemoveCoupon ? (
        <CouponForm
          appliedCode={quote?.couponCode ?? null}
          onApply={onApplyCoupon}
          onRemove={onRemoveCoupon}
        />
      ) : null}

      <div className="mt-5 space-y-2.5 border-t border-[#E5DFD4] pt-4 text-[13px]">
        <Row label="Subtotal" value={formatCad(subtotal)} />
        {discount > 0 ? (
          <Row
            label={
              quote?.couponCode
                ? `Discount (${quote.couponCode})`
                : "Discount"
            }
            value={`−${formatCad(discount)}`}
          />
        ) : null}
        <Row
          label="Shipping"
          value={
            quoteLoading
              ? "…"
              : shipping === undefined
                ? "Calculated next"
                : shipping === 0
                  ? "Free"
                  : formatCad(shipping)
          }
          muted={shipping === undefined || quoteLoading}
        />
        {(quote?.taxBreakdown?.length
          ? quote.taxBreakdown
          : tax !== undefined
            ? [{ name: "Tax", amountCents: tax }]
            : []
        ).map((row) => (
          <Row
            key={row.name}
            label={row.name}
            value={formatCad(row.amountCents)}
          />
        ))}
        {tax === undefined && !quoteLoading ? (
          <Row label="Tax" value="Calculated next" muted />
        ) : null}
        <div className="flex justify-between gap-4 border-t border-[#E5DFD4] pt-3">
          <span className="font-medium text-[#003F2D]">Total (CAD)</span>
          <span className="font-serif text-xl text-[#003F2D]">
            {quoteLoading
              ? "…"
              : total !== undefined
                ? formatCad(total)
                : formatCad(Math.max(0, subtotal - discount))}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[#6B726E]">
        Secure checkout powered by Stripe. Card details are never stored on our
        servers.
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#6B726E]">{label}</span>
      <span className={cn("font-medium text-[#003F2D]", muted && "font-normal text-[#6B726E]")}>
        {value}
      </span>
    </div>
  );
}
