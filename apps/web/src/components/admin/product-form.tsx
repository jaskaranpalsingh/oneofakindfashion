"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { ProductStatus, ProductType } from "@ookf/shared";
import { adminFetch } from "@/lib/admin-api";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type ProductImage = {
  url: string;
  publicId?: string;
  alt?: string;
  sortOrder?: number;
};

type VariantDraft = {
  key: string;
  sku: string;
  size: string;
  colour: string;
  priceDollars: string;
  stockQuantity: string;
  imageUrl: string;
  isAvailable: boolean;
};

function dollarsToCents(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function productTypeForCategory(slug: string): (typeof ProductType)[keyof typeof ProductType] {
  if (slug.includes("jewell")) return ProductType.JEWELLERY;
  return ProductType.CLOTHING;
}

function mediaUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Site-relative paths (/demo-products, /uploads, …) are served by Next.js public/
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

export function AdminProductForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin-form"],
    queryFn: async () => {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/categories?includeHidden=true`,
        { credentials: "include" }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to load categories");
      }
      return json.data as CategoryOption[];
    },
  });

  const topCategories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => !category.parentId
      ),
    [categoriesQuery.data]
  );

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [saleDollars, setSaleDollars] = useState("");
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([
    {
      key: "v1",
      sku: "",
      size: "",
      colour: "",
      priceDollars: "",
      stockQuantity: "1",
      imageUrl: "",
      isAvailable: true,
    },
  ]);
  const [clothing, setClothing] = useState({
    fabric: "",
    workType: "",
    stitchingType: "",
    occasion: "",
    sleeveStyle: "",
    careInstructions: "",
  });
  const [jewellery, setJewellery] = useState({
    jewelleryType: "",
    material: "",
    finishColour: "",
    size: "",
    dimensions: "",
    careInstructions: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    productId?: string;
    slug?: string;
  } | null>(null);

  const selectedCategory = topCategories.find((c) => c.id === categoryId);
  const subcategories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => category.parentId === categoryId
      ),
    [categoriesQuery.data, categoryId]
  );
  const isJewellery = selectedCategory
    ? selectedCategory.slug.includes("jewell")
    : false;

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("images", file));
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/uploads/images`,
        {
          method: "POST",
          credentials: "include",
          body,
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Image upload failed");
      }
      const uploaded = json.data as Array<{
        url: string;
        publicId?: string;
      }>;
      setImages((current) => [
        ...current,
        ...uploaded.map((item, index) => ({
          url: item.url,
          publicId: item.publicId,
          alt: name || "Product image",
          sortOrder: current.length + index,
        })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function buildPayload(status: "draft" | "published") {
    const priceCents = dollarsToCents(priceDollars);
    if (priceCents === null) {
      throw new Error("Enter a valid regular price in CAD");
    }

    // Regular = list price. Optional sale becomes the selling price with
    // regular stored as compare-at.
    let sellingCents = priceCents;
    let compareAtCents: number | undefined;
    if (saleDollars.trim()) {
      const saleCents = dollarsToCents(saleDollars);
      if (saleCents === null) throw new Error("Enter a valid sale price");
      if (saleCents > priceCents) {
        throw new Error("Sale price cannot exceed regular price");
      }
      sellingCents = saleCents;
      compareAtCents = priceCents;
    }

    if (!categoryId) throw new Error("Select a product category");
    if (!name.trim()) throw new Error("Product name is required");
    if (!sku.trim()) throw new Error("Product code is required");

    if (status === "published") {
      if (!images.length) {
        throw new Error("Upload a primary image before publishing");
      }
      if (!shortDescription.trim()) {
        throw new Error("Short description is required before publishing");
      }
    }

    const categorySlug = selectedCategory?.slug ?? "";
    const productType = productTypeForCategory(categorySlug);

    const mappedVariants = variants.map((variant, index) => {
      const variantSku = variant.sku.trim() || `${sku.trim()}-V${index + 1}`;
      const override = variant.priceDollars.trim()
        ? dollarsToCents(variant.priceDollars)
        : undefined;
      if (variant.priceDollars.trim() && override === null) {
        throw new Error(`Invalid price on variant ${index + 1}`);
      }
      const stock = Number(variant.stockQuantity);
      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error(`Invalid stock on variant ${index + 1}`);
      }
      return {
        sku: variantSku,
        options: {
          size: variant.size || undefined,
          colour: variant.colour || undefined,
        },
        priceCents: override ?? undefined,
        stockQuantity: stock,
        imageUrl: variant.imageUrl || undefined,
        isAvailable: variant.isAvailable,
      };
    });

    if (!mappedVariants.length) {
      throw new Error("At least one variant is required");
    }

    return {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      productType,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      priceCents: sellingCents,
      compareAtPriceCents: compareAtCents,
      status:
        status === "published" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
      isFeatured: featured,
      isNewArrival: status === "published",
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      images: images.map((image, index) => ({
        url: image.url,
        publicId: image.publicId,
        alt: image.alt || name.trim(),
        sortOrder: index,
      })),
      clothing: isJewellery
        ? undefined
        : {
            fabric: clothing.fabric || undefined,
            workType: clothing.workType || undefined,
            stitchingType: clothing.stitchingType || undefined,
            occasion: clothing.occasion || undefined,
            sleeveStyle: clothing.sleeveStyle || undefined,
            careInstructions: clothing.careInstructions || undefined,
          },
      jewellery: isJewellery
        ? {
            jewelleryType: jewellery.jewelleryType || undefined,
            material: jewellery.material || undefined,
            finishColour: jewellery.finishColour || undefined,
            size: jewellery.size || undefined,
            dimensions: jewellery.dimensions || undefined,
            careInstructions: jewellery.careInstructions || undefined,
          }
        : undefined,
      variants: mappedVariants,
    };
  }

  async function submit(status: "draft" | "published") {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload(status);
      const created = await adminFetch<{
        id: string;
        slug: string;
        name: string;
      }>("/api/v1/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setSuccess({
        message:
          status === "published"
            ? "Product published successfully."
            : "Draft saved successfully.",
        productId: created.id,
        slug: created.slug,
      });
      if (status === "published") {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-green">Add Product</h1>
          <div className="gold-rule mt-3" />
          <p className="mt-3 text-sm text-muted">
            Create a catalogue item and publish it to the correct storefront
            category.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-green hover:text-gold-dark"
        >
          Back to products
        </Link>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="border border-green/30 bg-green/5 px-4 py-3 text-sm text-green">
          <p>{success.message}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
            <Link href="/admin/products">View Products</Link>
            {success.slug ? (
              <Link href={`/products/${success.slug}`} target="_blank">
                View Product
              </Link>
            ) : null}
            {success.productId ? (
              <Link href={`/admin/products/${success.productId}`}>
                Manage Variants
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-2xl text-green">Product details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:col-span-2">
                Product name *
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Product code *
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Product category *
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId("");
                  }}
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                >
                  <option value="">Select category</option>
                  {topCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              {subcategories.length > 0 ? (
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:col-span-2">
                  Subcategory
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                  >
                    <option value="">None</option>
                    {subcategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:col-span-2">
                Short description *
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:col-span-2">
                Full description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-green">Product images</h2>
              <label className="inline-flex cursor-pointer items-center gap-2 border border-border bg-ivory px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green hover:border-gold">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => void uploadImages(e.target.files)}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">
              JPEG, PNG, or WebP · max 5MB each · first image is primary
            </p>
            {images.length === 0 ? (
              <p className="mt-6 text-sm text-muted">No images uploaded yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <li
                    key={`${image.url}-${index}`}
                    className="relative border border-border bg-ivory p-2"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-white">
                      <Image
                        src={mediaUrl(image.url)}
                        alt={image.alt || "Product"}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green"
                        onClick={() =>
                          setImages((current) => {
                            const next = [...current];
                            const [picked] = next.splice(index, 1);
                            next.unshift(picked);
                            return next.map((item, i) => ({
                              ...item,
                              sortOrder: i,
                            }));
                          })
                        }
                      >
                        {index === 0 ? "Primary" : "Make primary"}
                      </button>
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() =>
                          setImages((current) =>
                            current.filter((_, i) => i !== index)
                          )
                        }
                        className="text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-green">Variants</h2>
              <button
                type="button"
                onClick={() =>
                  setVariants((current) => [
                    ...current,
                    {
                      key: `v${current.length + 1}-${Date.now()}`,
                      sku: "",
                      size: "",
                      colour: "",
                      priceDollars: "",
                      stockQuantity: "0",
                      imageUrl: "",
                      isAvailable: true,
                    },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-green"
              >
                <Plus className="h-3.5 w-3.5" /> Add variant
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.key}
                  className="grid gap-3 border border-border/80 p-3 sm:grid-cols-6"
                >
                  <input
                    placeholder="Variant SKU"
                    value={variant.sku}
                    onChange={(e) =>
                      setVariants((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, sku: e.target.value } : row
                        )
                      )
                    }
                    className="border border-border px-2 py-1.5 text-sm sm:col-span-2"
                  />
                  <input
                    placeholder="Size"
                    value={variant.size}
                    onChange={(e) =>
                      setVariants((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, size: e.target.value } : row
                        )
                      )
                    }
                    className="border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Colour"
                    value={variant.colour}
                    onChange={(e) =>
                      setVariants((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, colour: e.target.value } : row
                        )
                      )
                    }
                    className="border border-border px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Price CAD"
                    value={variant.priceDollars}
                    onChange={(e) =>
                      setVariants((current) =>
                        current.map((row, i) =>
                          i === index
                            ? { ...row, priceDollars: e.target.value }
                            : row
                        )
                      )
                    }
                    className="border border-border px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Stock"
                      value={variant.stockQuantity}
                      onChange={(e) =>
                        setVariants((current) =>
                          current.map((row, i) =>
                            i === index
                              ? { ...row, stockQuantity: e.target.value }
                              : row
                          )
                        )
                      }
                      className="w-full border border-border px-2 py-1.5 text-sm"
                    />
                    {variants.length > 1 ? (
                      <button
                        type="button"
                        aria-label="Remove variant"
                        onClick={() =>
                          setVariants((current) =>
                            current.filter((_, i) => i !== index)
                          )
                        }
                        className="text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {categoryId ? (
            <section className="border border-border bg-white p-5">
              <h2 className="font-serif text-2xl text-green">
                {isJewellery ? "Jewellery attributes" : "Clothing attributes"}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {isJewellery ? (
                  <>
                    {(
                      [
                        ["jewelleryType", "Jewellery type"],
                        ["material", "Material"],
                        ["finishColour", "Colour / finish"],
                        ["size", "Size"],
                        ["dimensions", "Length / dimensions"],
                        ["careInstructions", "Care instructions"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                      >
                        {label}
                        <input
                          value={jewellery[key]}
                          onChange={(e) =>
                            setJewellery((current) => ({
                              ...current,
                              [key]: e.target.value,
                            }))
                          }
                          className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                        />
                      </label>
                    ))}
                  </>
                ) : (
                  <>
                    {(
                      [
                        ["fabric", "Fabric"],
                        ["workType", "Embroidery / work type"],
                        ["stitchingType", "Stitching type"],
                        ["occasion", "Occasion"],
                        ["sleeveStyle", "Sleeve style"],
                        ["careInstructions", "Care instructions"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                      >
                        {label}
                        <input
                          value={clothing[key]}
                          onChange={(e) =>
                            setClothing((current) => ({
                              ...current,
                              [key]: e.target.value,
                            }))
                          }
                          className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                        />
                      </label>
                    ))}
                  </>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-2xl text-green">Pricing & stock</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Regular price (CAD) *
                <input
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  placeholder="899.00"
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Sale price (CAD)
                <input
                  value={saleDollars}
                  onChange={(e) => setSaleDollars(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
              <p className="text-xs text-muted">
                Variant stock is the source of truth. Set quantities per variant
                above.
              </p>
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-2xl text-green">Publishing</h2>
            <label className="mt-4 flex items-center gap-2 text-sm text-green">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured product
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Tags
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="bridal, festive"
                className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              SEO title
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              SEO description
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
              />
            </label>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={pending || uploading}
                onClick={() => void submit("draft")}
                className="inline-flex h-11 items-center justify-center border border-border bg-white text-xs font-semibold uppercase tracking-[0.14em] text-green hover:border-gold disabled:opacity-60"
              >
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save as draft
              </button>
              <button
                type="button"
                disabled={pending || uploading}
                onClick={() => void submit("published")}
                className={cn(
                  "inline-flex h-11 items-center justify-center bg-[#003F2D] text-xs font-semibold uppercase tracking-[0.14em] text-white",
                  "hover:bg-[#0B513B] disabled:opacity-60"
                )}
              >
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publish product
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
