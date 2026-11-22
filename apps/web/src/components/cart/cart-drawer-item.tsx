"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCad } from "@ookf/shared";
import { CartQuantityControl } from "@/components/cart/cart-quantity-control";
import type { CartLine } from "@/lib/cart";

function formatOptions(options: CartLine["options"]) {
  const parts = Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `${label}: ${value}`;
    });
  return parts.length > 0 ? parts.join(" | ") : null;
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
    <li className="flex gap-4 border-b border-[#E5E5E2] py-5 first:pt-1">
      <Link
        href={`/products/${item.slug}`}
        onClick={onClose}
        className="relative h-[100px] w-[90px] shrink-0 overflow-hidden bg-[#FAF8F3]"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="90px"
            className="object-cover object-center"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.16em] text-[#666666]">
            No image
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              onClick={onClose}
              className="font-serif text-[1.15rem] leading-snug text-[#003F2D] transition hover:text-[#0B513B]"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-[12px] leading-relaxed text-[#666666]">
              {optionsLabel || item.sku}
            </p>
            <p className="mt-2 font-serif text-[1.05rem] text-[#003F2D]">
              {formatCad(item.unitPriceCents)}
            </p>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            aria-label="Remove item from cart"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#666666] transition hover:text-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-3">
          <CartQuantityControl
            id={`cart-qty-${item.id}`}
            value={item.quantity}
            max={Math.max(1, item.maxQuantity)}
            disabled={pending}
            onChange={onUpdateQuantity}
          />
        </div>

        {item.maxQuantity < item.quantity ? (
          <p className="mt-2 text-xs text-red-700">
            Only {item.maxQuantity} available — update quantity.
          </p>
        ) : null}
      </div>
    </li>
  );
}
