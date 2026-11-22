"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { formatCad, type ProductSummary } from "@ookf/shared";
import { ProductQuickView } from "@/components/commerce/product-quick-view";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductSummary;
  className?: string;
  onWishlistToggle?: (productId: string) => void;
};

export function ProductCard({
  product,
  className,
  onWishlistToggle,
}: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);

  const onSale =
    typeof product.compareAtPriceCents === "number" &&
    product.compareAtPriceCents > product.priceCents;

  // SALE takes priority over NEW when both apply.
  const badge = onSale ? "Sale" : product.isNewArrival ? "New" : null;
  const hasSecondary =
    Boolean(product.secondaryImageUrl) &&
    product.secondaryImageUrl !== product.primaryImageUrl;

  function handleWishlist() {
    toggle(product.id);
    onWishlistToggle?.(product.id);
  }

  return (
    <>
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-[15px] border border-[#C6A24A]/45 bg-white shadow-[0_8px_24px_rgba(0,45,33,0.06)] transition duration-500 ease-out",
          "hover:-translate-y-[3px] hover:border-[#D4AF37]/80 hover:shadow-[0_14px_32px_rgba(0,45,33,0.12)]",
          "motion-reduce:transform-none motion-reduce:transition-none",
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-[#FFF9F0]">
          {product.primaryImageUrl ? (
            <>
              <Image
                src={product.primaryImageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={cn(
                  "object-cover object-center transition duration-[550ms] ease-out",
                  "group-hover:scale-[1.045]",
                  hasSecondary && "group-hover:opacity-0",
                  "motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:opacity-100"
                )}
              />
              {hasSecondary && product.secondaryImageUrl ? (
                <Image
                  src={product.secondaryImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={cn(
                    "object-cover object-center opacity-0 transition duration-[350ms] ease-out",
                    "group-hover:scale-[1.045] group-hover:opacity-100",
                    "motion-reduce:hidden"
                  )}
                  aria-hidden
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.2em] text-[#6F746E]">
              Image coming soon
            </div>
          )}

          {badge ? (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-[#003F2D] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              {badge}
            </span>
          ) : null}

          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={saved}
            onClick={handleWishlist}
            className={cn(
              "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#003F2D] shadow-sm transition",
              "hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
              "md:opacity-0 md:group-hover:opacity-100",
              saved && "opacity-100 text-[#D4AF37]"
            )}
          >
            <Heart
              className={cn("h-4 w-4", saved && "fill-current")}
              strokeWidth={1.75}
            />
          </button>

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 p-3 transition duration-300",
              "translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
              "max-md:translate-y-0 max-md:opacity-100 max-md:bg-gradient-to-t max-md:from-black/35 max-md:via-black/10 max-md:to-transparent max-md:pt-10",
              "motion-reduce:translate-y-0 motion-reduce:opacity-100"
            )}
          >
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => setQuickViewOpen(true)}
              className={cn(
                "w-full rounded-md bg-[#003F2D] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition",
                "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "max-md:bg-white/95 max-md:text-[#003F2D] max-md:hover:bg-white"
              )}
            >
              {product.inStock ? "Quick view" : "Out of stock"}
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 border-t border-[#E8E2D2] bg-white p-4 sm:p-[1.1rem]">
          <Link
            href={`/products/${product.slug}`}
            className="font-serif text-[1.15rem] leading-snug text-[#202820] transition hover:text-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] sm:text-[1.25rem]"
          >
            {product.name}
          </Link>
          <div className="mt-auto flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-[#003F2D] sm:text-[15px]">
              {formatCad(product.priceCents)}
            </span>
            {onSale && product.compareAtPriceCents ? (
              <span className="text-sm text-[#6F746E] line-through">
                {formatCad(product.compareAtPriceCents)}
              </span>
            ) : null}
          </div>
          {!product.inStock ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#003F2D]">
              Out of stock
            </p>
          ) : null}
        </div>
      </article>

      <ProductQuickView
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  );
}
