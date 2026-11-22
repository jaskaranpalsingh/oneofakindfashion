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

export function ProductDetailView({
  product,
  categories,
}: ProductDetailViewProps) {
  const reduceMotion = useReducedMotion();
  const [variantImageUrl, setVariantImageUrl] = useState<string | null>(null);

  const onActiveImageChange = useCallback((url: string | null) => {
    setVariantImageUrl(url);
  }, []);

  const category = useMemo(
    () => categories.find((item) => item.id === product.categoryId) ?? null,
    [categories, product.categoryId]
  );

  const galleryImages = useMemo(() => {
    const sorted = [...(product.images ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    return sorted.map((image) => ({
      url: image.url,
      alt: image.alt || product.name,
    }));
  }, [product.images, product.name]);

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
