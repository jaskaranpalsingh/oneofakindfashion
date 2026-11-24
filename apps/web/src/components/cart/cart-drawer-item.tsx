"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCad } from "@ookf/shared";
import { CartQuantityControl } from "@/components/cart/cart-quantity-control";
import type { CartLine } from "@/lib/cart";

function formatOptions(options: CartLine["options"]) {
  const parts = Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `${label} ${value}`;
    });
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function CartDrawerItem({
  item,
  pending,
  onClose,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartLine;
  pending: boolean;
  onClose: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const optionsLabel = formatOptions(item.options);

  return (
    <li className="flex gap-4 border-b border-[#E8E2D6] py-6 first:pt-2 last:border-b-0">
      <Link
        href={`/products/${item.slug}`}
        onClick={onClose}
        className="relative h-[108px] w-[86px] shrink-0 overflow-hidden bg-[#F3EEE3]"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="86px"
            quality={75}
            className="object-cover object-center"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.14em] text-[#8A908B]">
            —
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              onClick={onClose}
              className="font-serif text-[1.2rem] leading-snug text-[#003F2D] transition hover:text-[#0B513B]"
            >
              {item.name}
            </Link>
            {optionsLabel ? (
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#6B726E]">
                {optionsLabel}
              </p>
            ) : null}
          </div>
          <p className="shrink-0 font-serif text-[1.05rem] text-[#003F2D]">
            {formatCad(item.unitPriceCents)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <CartQuantityControl
            id={`cart-qty-${item.id}`}
            value={item.quantity}
            max={Math.max(1, item.maxQuantity)}
            disabled={pending}
            onChange={onUpdateQuantity}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            className="text-[12px] text-[#6B726E] underline-offset-4 transition hover:text-[#003F2D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:opacity-40"
          >
            Remove
          </button>
        </div>

        {item.maxQuantity < item.quantity ? (
          <p className="mt-2 text-xs text-[#8B3A3A]">
            Only {item.maxQuantity} available — update quantity.
          </p>
        ) : null}
      </div>
    </li>
  );
}
