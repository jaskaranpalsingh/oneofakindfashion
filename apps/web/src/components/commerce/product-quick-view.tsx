"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { formatCad, type ProductSummary } from "@ookf/shared";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { VariantOptionPicker } from "@/components/commerce/variant-option-picker";
import { Dialog } from "@/components/ui/dialog";
import { useProductVariantSelection } from "@/hooks/use-product-variant-selection";
import { getApiBaseUrl } from "@/lib/api";
import type { ProductDetail } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

type ProductQuickViewProps = {
  product: ProductSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: ProductQuickViewProps) {
  const { addToCart, buyNow } = useCart();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

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
  } = useProductVariantSelection(detail);

  useEffect(() => {
    if (!open || !product) {
      setDetail(null);
      setError(null);
      setMessage(null);
      setGalleryIndex(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessage(null);

    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/products/${product.slug}`,
          { credentials: "include" }
        );
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload?.error?.message ?? "Unable to load product");
        }
        if (!cancelled) {
          setDetail(payload.data as ProductDetail);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load product");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, product]);

  useEffect(() => {
    if (!detail) return;
    const urls = [
      activeImageUrl,
      ...detail.images.map((image) => image.url),
    ].filter((url): url is string => Boolean(url));
    const unique = Array.from(new Set(urls));
    const index = activeImageUrl ? unique.indexOf(activeImageUrl) : 0;
    setGalleryIndex(index >= 0 ? index : 0);
  }, [activeImageUrl, detail]);

  const gallery = detail
    ? Array.from(
        new Set(
          [activeImageUrl, ...detail.images.map((image) => image.url)].filter(
            (url): url is string => Boolean(url)
          )
        )
      )
    : [];

  const mainImage = gallery[galleryIndex] ?? gallery[0] ?? null;

  async function handleAddToCart() {
    if (!detail || !selectedVariant || !canAddToCart) return;
    setPending("cart");
    setMessage(null);
    try {
      await addToCart({
        productId: detail.id,
        variantId: selectedVariant.id,
        quantity,
      });
      setMessage("Added to cart");
      onOpenChange(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setPending(null);
    }
  }

  async function handleBuyNow() {
    if (!detail || !selectedVariant || !canAddToCart) return;
    setPending("buy");
    setMessage(null);
    try {
      await buyNow({
        productId: detail.id,
        variantId: selectedVariant.id,
        quantity,
      });
      onOpenChange(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start checkout");
      setPending(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={product?.name ?? "Product"}
      description="Select product options and add to cart"
      dismissOnOutsideClick
      compactHeader
      className="sm:max-w-4xl lg:max-w-5xl"
    >
      {loading ? (
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse bg-[#F8F5EB]" />
          <div className="space-y-4 p-6 sm:p-8">
            <div className="h-3 w-20 animate-pulse rounded bg-[#F3EEE3]" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-[#F3EEE3]" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-[#F3EEE3]" />
            <div className="h-20 animate-pulse rounded bg-[#F3EEE3]" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="p-8">
          <p className="border border-[#003F2D]/15 bg-[#F8F5EB] px-4 py-3 text-sm text-[#003F2D]">
            {error}
          </p>
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <div className="grid lg:grid-cols-2">
          {/* Media */}
          <div className="bg-[#F8F5EB] p-4 sm:p-5 lg:p-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-white">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={detail.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.2em] text-[#6F746E]">
                  Image coming soon
                </div>
              )}
            </div>

            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setGalleryIndex(index)}
                    className={cn(
                      "relative h-16 w-14 shrink-0 overflow-hidden border bg-white transition",
                      galleryIndex === index
                        ? "border-[#D4AF37]"
                        : "border-transparent hover:border-[#C6A24A]/60"
                    )}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Details */}
          <div className="flex flex-col px-5 py-6 sm:px-8 sm:py-8 lg:pr-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C6A24A]">
              Quick view
            </p>

            <h3 className="mt-3 font-serif text-[1.85rem] leading-[1.15] tracking-[-0.02em] text-[#003F2D] sm:text-[2.15rem]">
              {detail.name}
            </h3>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-lg font-semibold text-[#003F2D]">
                {formatCad(priceCents)}
              </p>
              {onSale && detail.compareAtPriceCents ? (
                <p className="text-sm text-[#6F746E] line-through">
                  {formatCad(detail.compareAtPriceCents)}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6F746E]">
              <span>
                {selectedVariant
                  ? selectedVariant.isAvailable
                    ? `${selectedVariant.stockQuantity} in stock`
                    : "Out of stock"
                  : "Select available options"}
              </span>
              <span aria-hidden className="hidden text-[#D4AF37] sm:inline">
                ·
              </span>
              <span className="uppercase tracking-[0.12em]">
                SKU {selectedVariant?.sku ?? detail.sku}
              </span>
            </div>

            {detail.shortDescription ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6F746E]">
                {detail.shortDescription}
              </p>
            ) : null}

            <div className="mt-6 space-y-5 border-t border-[#E8E2D2] pt-6">
              {optionKeys.map((key) => (
                <VariantOptionPicker
                  key={key}
                  optionKey={key}
                  values={optionValues[key] ?? []}
                  selected={selection[key]}
                  productType={detail.productType}
                  isAvailable={(value) => isOptionAvailable(key, value)}
                  isInStock={(value) => isOptionInStock(key, value)}
                  onSelect={(value) => selectOption(key, value)}
                />
              ))}

              <QuantityStepper
                id="quick-view-qty"
                value={quantity}
                max={maxQuantity}
                onChange={updateQuantity}
              />
            </div>

            <div className="mt-7 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={!canAddToCart || pending !== null || !selectedVariant}
                onClick={() => void handleAddToCart()}
                className={cn(
                  "h-12 w-full bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition",
                  "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-45"
                )}
              >
                {!selectedVariant
                  ? "Unavailable"
                  : !canAddToCart
                    ? "Out of stock"
                    : pending === "cart"
                      ? "Adding…"
                      : "Add to cart"}
              </button>

              <button
                type="button"
                disabled={!canAddToCart || pending !== null || !selectedVariant}
                onClick={() => void handleBuyNow()}
                className={cn(
                  "h-12 w-full border border-[#D4AF37] bg-white text-[11px] font-semibold uppercase tracking-[0.18em] text-[#003F2D] transition",
                  "hover:bg-[#FFF9F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-45"
                )}
              >
                {pending === "buy" ? "Starting…" : "Buy now"}
              </button>
            </div>

            {message ? (
              <p className="mt-3 text-sm text-[#003F2D]" role="status">
                {message}
              </p>
            ) : null}

            <Link
              href={`/products/${detail.slug}`}
              onClick={() => onOpenChange(false)}
              className="mt-6 inline-flex items-center gap-2 text-sm text-[#003F2D] transition hover:text-[#0B513B]"
            >
              View full product details
              <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37]" />
            </Link>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
