"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatCad } from "@ookf/shared";
import { CartQuantityControl } from "@/components/cart/cart-quantity-control";
import { formatVariantOptions, type CartLine } from "@/lib/cart";

export function ShoppingBagItem({
  item,
  pending,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartLine;
  pending: boolean;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const options =
    formatVariantOptions(item.options).toUpperCase() || item.sku.toUpperCase();

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 border-b border-[#E7E2D9] px-5 py-6 last:border-b-0 sm:flex-row sm:gap-5 sm:px-6"
    >
      <Link
        href={`/products/${item.slug}`}
        className="relative mx-auto h-[180px] w-[135px] shrink-0 overflow-hidden bg-[#FAF8F3] sm:mx-0 sm:h-[200px] sm:w-[150px]"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="150px"
            className="object-cover object-center"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.16em] text-[#687170]">
            No image
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              className="font-serif text-[1.35rem] leading-snug text-[#003F2D] transition hover:text-[#0B513B] sm:text-[1.5rem]"
            >
              {item.name}
            </Link>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#687170]">
              {options}
            </p>
            <p className="mt-3 text-sm font-semibold text-[#003F2D]">
              {formatCad(item.unitPriceCents)}
            </p>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            aria-label="Remove item from cart"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#687170] transition hover:text-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Remove
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <CartQuantityControl
            id={`bag-qty-${item.id}`}
            value={item.quantity}
            max={Math.max(1, item.maxQuantity)}
            disabled={pending}
            onChange={onUpdateQuantity}
          />
          <p className="font-serif text-xl font-medium text-[#003F2D] sm:text-[1.35rem]">
            {formatCad(item.lineTotalCents)}
          </p>
        </div>

        {item.maxQuantity < item.quantity ? (
          <p className="mt-2 text-xs text-red-700">
            Only {item.maxQuantity} available — update quantity.
          </p>
        ) : null}
      </div>
    </motion.li>
  );
}
