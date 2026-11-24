"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ProductDetailsTabs } from "@/components/commerce/product-details-tabs";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { ProductPurchasePanel } from "@/components/commerce/product-purchase-panel";
import type { CategoryDto, ProductDetail } from "@/lib/catalogue";

type ProductDetailViewProps = {
  product: ProductDetail;
  categories: CategoryDto[];
};

function buildGalleryImages(
  product: ProductDetail,
  selectedColour: string | null
) {
  const sorted = [...(product.images ?? [])].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const productImages = sorted.map((image) => ({
    url: image.url,
    alt: image.alt || product.name,
  }));

  const colourVariants = selectedColour
    ? product.variants.filter(
        (variant) =>
          variant.options.colour === selectedColour && Boolean(variant.imageUrl)
      )
    : [];

  const colourImages = colourVariants.map((variant) => ({
    url: variant.imageUrl as string,
    alt: `${product.name} — ${selectedColour}`,
  }));

  const otherVariantImages = product.variants
    .filter((variant) => {
      if (!variant.imageUrl) return false;
      if (selectedColour && variant.options.colour === selectedColour) {
        return false;
      }
      return true;
    })
    .map((variant) => ({
      url: variant.imageUrl as string,
      alt: variant.options.colour
        ? `${product.name} — ${variant.options.colour}`
        : product.name,
    }));

  // Colour-specific images first when a colour is selected; otherwise product gallery first.
  if (colourImages.length > 0) {
    return [...colourImages, ...productImages, ...otherVariantImages];
  }

  return [...productImages, ...otherVariantImages];
}

export function ProductDetailView({
  product,
  categories,
}: ProductDetailViewProps) {
  const reduceMotion = useReducedMotion();
  const [variantImageUrl, setVariantImageUrl] = useState<string | null>(null);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);

  const onActiveImageChange = useCallback(
    (url: string | null, meta?: { colour?: string | null }) => {
      setVariantImageUrl(url);
      if (meta && "colour" in meta) {
        setSelectedColour(meta.colour ?? null);
      }
    },
    []
  );

  const category = useMemo(
    () => categories.find((item) => item.id === product.categoryId) ?? null,
    [categories, product.categoryId]
  );

  const galleryImages = useMemo(
    () => buildGalleryImages(product, selectedColour),
    [product, selectedColour]
  );

  const crumbCategory = category;

  return (
    <section className="bg-[#FAF8F3] py-8 sm:py-12 lg:py-14">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <motion.nav
          aria-label="Breadcrumb"
          className="mb-8 text-sm text-[#656B68]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="transition hover:text-[#003F2D]">
                Home
              </Link>
            </li>
            {crumbCategory ? (
              <>
                <li aria-hidden className="text-[#C5C0B6]">
                  /
                </li>
                <li>
                  <Link
                    href={`/shop/${crumbCategory.slug}`}
                    className="transition hover:text-[#003F2D]"
                  >
                    {crumbCategory.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden className="text-[#C5C0B6]">
              /
            </li>
            <li className="text-[#252A27]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </motion.nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.47fr)_minmax(0,0.53fr)] lg:gap-14 xl:gap-16">
          <ProductGallery
            images={galleryImages}
            productName={product.name}
            activeVariantImageUrl={variantImageUrl}
          />

          <div className="min-w-0">
            <ProductPurchasePanel
              product={product}
              onActiveImageChange={onActiveImageChange}
            />
            <ProductDetailsTabs product={product} />
          </div>
        </div>
      </div>
    </section>
  );
}
