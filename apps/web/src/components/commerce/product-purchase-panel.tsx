"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatCad } from "@ookf/shared";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { VariantOptionPicker } from "@/components/commerce/variant-option-picker";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  useProductVariantSelection,
  type VariantOptionKey,
} from "@/hooks/use-product-variant-selection";
import type { ProductDetail } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

type ProductPurchasePanelProps = {
  product: ProductDetail;
  onActiveImageChange?: (url: string | null) => void;
};

export function ProductPurchasePanel({
  product,
  onActiveImageChange,
}: ProductPurchasePanelProps) {
  const { addToCart, buyNow } = useCart();
  const { isSaved, toggle } = useWishlist();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    optionKeys,
    optionValues,
    selection,
    selectOption,
    isOptionAvailable,
    isOptionInStock,
    selectedVariant,
    quantity,
    updateQuantity,
    maxQuantity,
    priceCents,
    onSale,
    canAddToCart,
    activeImageUrl,
  } = useProductVariantSelection(product);

  const saved = isSaved(product.id);
  const compareAt = product.compareAtPriceCents ?? null;
  const discountPercent =
    onSale && compareAt && compareAt > priceCents
      ? Math.round(((compareAt - priceCents) / compareAt) * 100)
      : null;

  useEffect(() => {
    onActiveImageChange?.(activeImageUrl);
  }, [activeImageUrl, onActiveImageChange]);

  async function handleAddToCart() {
    if (!selectedVariant?.isAvailable) return;
    setPending("cart");
    setMessage(null);
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
      });
      setMessage("Added to bag");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add to cart");
    } finally {
      setPending(null);
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant?.isAvailable) return;
    setPending("buy");
    setMessage(null);
    try {
      await buyNow({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not start checkout"
      );
      setPending(null);
    }
  }

  const stockLabel = !selectedVariant
    ? "Select available options"
    : selectedVariant.isAvailable
      ? `${selectedVariant.stockQuantity} in stock`
      : "Out of stock";

  return (
    <motion.div
      className="space-y-7"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#656B68]">
          SKU: {selectedVariant?.sku ?? product.sku}
        </p>
        <h1 className="mt-2 font-serif text-[2.5rem] leading-[1.1] text-[#003F2D] sm:text-[2.75rem] lg:text-[3rem]">
          {product.name}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-2xl font-semibold tracking-tight text-[#003F2D]">
            {formatCad(priceCents)}
          </p>
          {onSale && compareAt ? (
            <p className="text-base text-[#656B68] line-through">
              {formatCad(compareAt)}
            </p>
          ) : null}
          {discountPercent && discountPercent > 0 ? (
            <span className="rounded-sm bg-[#B68A25]/18 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A6A1C]">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            "mt-3 text-sm",
            canAddToCart ? "text-[#656B68]" : "font-medium text-[#8B3A3A]"
          )}
        >
          {stockLabel}
        </p>
      </div>

      {optionKeys.map((key: VariantOptionKey) => (
        <VariantOptionPicker
          key={key}
          optionKey={key}
          values={optionValues[key] ?? []}
          selected={selection[key]}
          productType={product.productType}
          isAvailable={(value) => isOptionAvailable(key, value)}
          isInStock={(value) => isOptionInStock(key, value)}
          onSelect={(value) => selectOption(key, value)}
        />
      ))}

      <QuantityStepper
        id="pdp-qty"
        value={quantity}
        max={maxQuantity}
        onChange={updateQuantity}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          className="h-[56px] w-full rounded-sm text-[13px] tracking-[0.14em] transition duration-300"
          disabled={!canAddToCart || pending !== null}
          onClick={() => void handleAddToCart()}
        >
          {!canAddToCart
            ? "Out of Stock"
            : pending === "cart"
              ? "Adding…"
              : "Add to Cart"}
        </Button>
        <Button
          size="lg"
          variant="gold"
          className="h-[56px] w-full rounded-sm border-[#B68A25] text-[13px] tracking-[0.14em] text-[#003F2D] transition duration-300 hover:bg-[#B68A25]/12"
          disabled={!canAddToCart || pending !== null}
          onClick={() => void handleBuyNow()}
        >
          {pending === "buy" ? "Starting…" : "Buy Now"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 text-sm text-[#003F2D] transition duration-300",
          "hover:text-[#B68A25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D] focus-visible:ring-offset-2",
          saved && "text-[#B68A25]"
        )}
      >
        <Heart
          className={cn("h-4 w-4", saved && "fill-current")}
          strokeWidth={1.75}
        />
        {saved ? "Saved to Wishlist" : "Add to Wishlist"}
      </button>

      {message ? (
        <p className="text-sm text-[#003F2D]" role="status">
          {message}
        </p>
      ) : null}
    </motion.div>
  );
}
