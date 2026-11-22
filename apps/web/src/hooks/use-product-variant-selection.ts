"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductDetail } from "@/lib/catalogue";

export type VariantOptionKey = "size" | "colour" | "material" | "other";

export type ProductVariant = ProductDetail["variants"][number];

const OPTION_LABELS: Record<VariantOptionKey, string> = {
  size: "Size",
  colour: "Colour",
  material: "Finish",
  other: "Style",
};

const COLOUR_SWATCHES: Record<string, string> = {
  red: "#b91c1c",
  maroon: "#7f1d1d",
  burgundy: "#6b1d2a",
  green: "#003F2D",
  emerald: "#0b513b",
  teal: "#0f766e",
  blue: "#1d4ed8",
  navy: "#1e3a5f",
  gold: "#d4af37",
  champagne: "#e8d5a3",
  ivory: "#F5F0E6",
  cream: "#F5F0E6",
  white: "#ffffff",
  black: "#111111",
  silver: "#c0c0c0",
  "rose gold": "#b76e79",
  pink: "#db2777",
  purple: "#7e22ce",
  yellow: "#ca8a04",
  orange: "#ea580c",
  brown: "#78350f",
  beige: "#d6c6a8",
  peach: "#E8B4A0",
  grey: "#6b7280",
  gray: "#6b7280",
  ruby: "#9B1B30",
};

export function getOptionLabel(
  key: VariantOptionKey,
  productType?: string
): string {
  if (key === "size" && productType === "jewellery") return "Size";
  if (key === "material" && productType === "jewellery") return "Finish";
  if (key === "other" && productType === "jewellery") return "Variation";
  if (key === "material" && productType !== "jewellery") return "Material";
  return OPTION_LABELS[key];
}

export function getColourSwatch(colour: string): string | null {
  const key = colour.trim().toLowerCase();
  return COLOUR_SWATCHES[key] ?? null;
}

function uniqueOptionValues(
  variants: ProductVariant[],
  key: VariantOptionKey
): string[] {
  return Array.from(
    new Set(
      variants
        .map((variant) => variant.options[key])
        .filter((value): value is string => Boolean(value))
    )
  );
}

function buildDefaultSelection(
  product: ProductDetail | null,
  optionKeys: VariantOptionKey[]
): Partial<Record<VariantOptionKey, string>> {
  if (!product || optionKeys.length === 0) return {};

  const preferredVariant =
    product.variants.find((variant) => variant.isAvailable) ??
    product.variants[0];

  const next: Partial<Record<VariantOptionKey, string>> = {};
  for (const key of optionKeys) {
    const value =
      preferredVariant?.options[key] ??
      uniqueOptionValues(product.variants, key)[0];
    if (value) next[key] = value;
  }
  return next;
}

export function useProductVariantSelection(product: ProductDetail | null) {
  const optionKeys = useMemo(() => {
    if (!product) return [] as VariantOptionKey[];
    const keys: VariantOptionKey[] = ["colour", "size", "material", "other"];
    return keys.filter((key) =>
      product.variants.some((variant) => Boolean(variant.options[key]))
    );
  }, [product]);

  const optionValues = useMemo(() => {
    const map = {} as Record<VariantOptionKey, string[]>;
    if (!product) return map;
    for (const key of optionKeys) {
      map[key] = uniqueOptionValues(product.variants, key);
    }
    return map;
  }, [product, optionKeys]);

  const [selection, setSelection] = useState<
    Partial<Record<VariantOptionKey, string>>
  >({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelection({});
    setQuantity(1);
  }, [product?.id]);

  const effectiveSelection = useMemo(() => {
    const defaults = buildDefaultSelection(product, optionKeys);
    return { ...defaults, ...selection };
  }, [selection, product, optionKeys]);

  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    if (product.variants.length === 1) return product.variants[0];

    return product.variants.find((variant) =>
      optionKeys.every((key) => {
        const selected = effectiveSelection[key];
        if (!selected) return !variant.options[key];
        return variant.options[key] === selected;
      })
    );
  }, [product, optionKeys, effectiveSelection]);

  const maxQuantity = Math.max(1, selectedVariant?.stockQuantity ?? 1);

  useEffect(() => {
    setQuantity((current) => Math.min(Math.max(1, current), maxQuantity));
  }, [maxQuantity]);

  function isOptionAvailable(key: VariantOptionKey, value: string): boolean {
    if (!product) return false;

    return product.variants.some((variant) => {
      if (variant.options[key] !== value) return false;
      return optionKeys.every((otherKey) => {
        if (otherKey === key) return true;
        const selected = effectiveSelection[otherKey];
        if (!selected) return true;
        const variantValue = variant.options[otherKey];
        if (!variantValue) return true;
        return variantValue === selected;
      });
    });
  }

  function isOptionInStock(key: VariantOptionKey, value: string): boolean {
    if (!product) return false;

    return product.variants.some((variant) => {
      if (variant.options[key] !== value) return false;
      if (!variant.isAvailable || variant.stockQuantity <= 0) return false;
      return optionKeys.every((otherKey) => {
        if (otherKey === key) return true;
        const selected = effectiveSelection[otherKey];
        if (!selected) return true;
        const variantValue = variant.options[otherKey];
        if (!variantValue) return true;
        return variantValue === selected;
      });
    });
  }

  function selectOption(key: VariantOptionKey, value: string) {
    if (!isOptionAvailable(key, value)) return;
    setSelection((current) => {
      const defaults = buildDefaultSelection(product, optionKeys);
      return { ...defaults, ...current, [key]: value };
    });
  }

  function updateQuantity(next: number) {
    if (!Number.isFinite(next)) return;
    const integer = Math.trunc(next);
    setQuantity(Math.min(Math.max(1, integer), maxQuantity));
  }

  const priceCents = selectedVariant?.priceCents ?? product?.priceCents ?? 0;
  const onSale =
    typeof product?.compareAtPriceCents === "number" &&
    product.compareAtPriceCents > priceCents;

  const canAddToCart = Boolean(
    selectedVariant?.isAvailable && selectedVariant.stockQuantity > 0
  );

  const activeImageUrl =
    selectedVariant?.imageUrl ??
    product?.images?.[0]?.url ??
    product?.primaryImageUrl ??
    null;

  return {
    optionKeys,
    optionValues,
    selection: effectiveSelection,
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
  };
}
