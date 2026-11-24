"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCad, type ProductSummary } from "@ookf/shared";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistItem({
  product,
  className,
}: {
  product: ProductSummary;
  className?: string;
}) {
  const { toggle } = useWishlist();
  const onSale =
    typeof product.compareAtPriceCents === "number" &&
    product.compareAtPriceCents > product.priceCents;

  return (
    <li
      className={cn(
        "flex flex-col gap-5 border-b border-[#E7E2D9] px-4 py-6 last:border-b-0 sm:flex-row sm:gap-6 sm:px-6 sm:py-7",
        className
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative mx-auto h-[200px] w-[150px] shrink-0 overflow-hidden bg-[#F3EEE3] sm:mx-0"
      >
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="150px"
            quality={80}
            className="object-cover object-center transition duration-500 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.14em] text-[#8A908B]">
            —
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="font-serif text-[1.4rem] leading-snug text-[#003F2D] transition hover:text-[#0B513B] sm:text-[1.55rem]"
            >
              {product.name}
            </Link>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-serif text-[1.2rem] text-[#003F2D]">
                {formatCad(product.priceCents)}
              </p>
              {onSale && product.compareAtPriceCents ? (
                <p className="text-[13px] text-[#8A908B] line-through">
                  {formatCad(product.compareAtPriceCents)}
                </p>
              ) : null}
            </div>
            <p
              className={cn(
                "mt-2 text-[12px]",
                product.inStock ? "text-[#6B726E]" : "text-[#8B3A3A]"
              )}
            >
              {product.inStock ? "In stock" : "Out of stock"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggle(product.id)}
            className="shrink-0 text-[12px] text-[#6B726E] underline-offset-4 transition hover:text-[#003F2D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            Remove
          </button>
        </div>

        <div className="mt-auto pt-5">
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-11 items-center justify-center bg-[#003F2D] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
          >
            View product
          </Link>
        </div>
      </div>
    </li>
  );
}
