"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ProductStatus, SHIPPING_CLASS_LABELS, ShippingClass } from "@ookf/shared";
import { Loader2, Package } from "lucide-react";
import {
  ProductImageManager,
  serializeManagedImages,
  toManagedImages,
  type ManagedProductImage,
} from "@/components/admin/product-image-manager";
import { StockManagementModal } from "@/components/admin/stock-management-modal";
import { getApiBaseUrl } from "@/lib/api";
import { revalidateCatalogue } from "@/lib/revalidate-catalogue";

type AdminVariant = {
  id?: string;
  sku: string;
  options: {
    size: string;
    colour: string;
    material: string;
    other: string;
  };
  priceCents: number;
  stockQuantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  imageUrl: string;
  isAvailable: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productType: string;
  status: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  shortDescription?: string | null;
  description?: string | null;
  categoryId: string;
  subcategoryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isPhysical?: boolean;
  weightGrams?: number | null;
  weightUnit?: "g" | "kg";
  dimensionsCm?: { length?: number; width?: number; height?: number } | null;
  shippingClass?: string;
  freeShippingEligible?: boolean;
  additionalHandlingCents?: number;
  clothing?: Record<string, string | boolean | undefined> | null;
  jewellery?: Record<string, string | undefined> | null;
  images?: Array<{
    id?: string;
    url: string;
    publicId?: string;
    alt?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }>;
  variants: AdminVariant[];
};

function emptyVariant(baseSku: string, index: number): AdminVariant {
  return {
    sku: `${baseSku}-V${index + 1}`,
    options: { size: "", colour: "", material: "", other: "" },
    priceCents: 0,
    stockQuantity: 0,
    imageUrl: "",
    isAvailable: true,
  };
}

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const fieldClass =
  "mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm text-[#003F2D]";
const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]";

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<string>(ProductStatus.DRAFT);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [saleDollars, setSaleDollars] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("3");
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [clothing, setClothing] = useState({
    fabric: "",
    workType: "",
    sleeveStyle: "",
    stitchingType: "",
    occasion: "",
    careInstructions: "",
  });
  const [jewellery, setJewellery] = useState({
    jewelleryType: "",
    material: "",
    finishColour: "",
    size: "",
    careInstructions: "",
  });
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [images, setImages] = useState<ManagedProductImage[]>([]);
  const [isPhysical, setIsPhysical] = useState(true);
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"g" | "kg">("g");
  const [dimL, setDimL] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const [shippingClass, setShippingClass] = useState<string>(
    ShippingClass.STANDARD_CLOTHING
  );
  const [freeShippingEligible, setFreeShippingEligible] = useState(true);
  const [handlingDollars, setHandlingDollars] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stockOpen, setStockOpen] = useState(false);

  const topCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );
  const subcategories = useMemo(
    () => categories.filter((category) => category.parentId === categoryId),
    [categories, categoryId]
  );
  const selectedCategory = topCategories.find((c) => c.id === categoryId);
  const isJewellery = selectedCategory?.slug.includes("jewell") ?? false;

  useEffect(() => {
    void (async () => {
      try {
        const me = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          credentials: "include",
        });
        const meJson = await me.json();
        if (!me.ok || meJson?.data?.user?.role !== "admin") {
          setError("Admin sign-in required.");
          setLoading(false);
          return;
        }

        const [productRes, categoriesRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/api/v1/admin/products/${productId}`, {
            credentials: "include",
          }),
          fetch(`${getApiBaseUrl()}/api/v1/categories?includeHidden=true`, {
            credentials: "include",
          }),
        ]);
        const productJson = await productRes.json();
        const categoriesJson = await categoriesRes.json();
        if (!productRes.ok || !productJson.success) {
          throw new Error(productJson?.error?.message ?? "Failed to load product");
        }
        if (categoriesRes.ok && categoriesJson.success) {
          setCategories(categoriesJson.data as CategoryOption[]);
        }

        const data = productJson.data as AdminProduct;
        setProduct(data);
        setName(data.name);
        setSku(data.sku);
        setSlug(data.slug);
        setStatus(data.status);
        setCategoryId(data.categoryId);
        setSubcategoryId(data.subcategoryId ?? "");
        setShortDescription(data.shortDescription ?? "");
        setDescription(data.description ?? "");
        const compare = data.compareAtPriceCents ?? null;
        const selling = data.priceCents;
        if (compare && compare > selling) {
          setPriceDollars(centsToDollars(compare));
          setSaleDollars(centsToDollars(selling));
        } else {
          setPriceDollars(centsToDollars(selling));
          setSaleDollars("");
        }
        setSeoTitle(data.seoTitle ?? "");
        setSeoDescription(data.seoDescription ?? "");
        setLowStockThreshold(String(data.lowStockThreshold ?? 3));
        setFeatured(Boolean(data.isFeatured));
        setNewArrival(Boolean(data.isNewArrival));
        setClothing({
          fabric: String(data.clothing?.fabric ?? ""),
          workType: String(data.clothing?.workType ?? ""),
          sleeveStyle: String(data.clothing?.sleeveStyle ?? ""),
          stitchingType: String(data.clothing?.stitchingType ?? ""),
          occasion: String(data.clothing?.occasion ?? ""),
          careInstructions: String(data.clothing?.careInstructions ?? ""),
        });
        setJewellery({
          jewelleryType: String(data.jewellery?.jewelleryType ?? ""),
          material: String(data.jewellery?.material ?? ""),
          finishColour: String(data.jewellery?.finishColour ?? ""),
          size: String(data.jewellery?.size ?? ""),
          careInstructions: String(data.jewellery?.careInstructions ?? ""),
        });
        setVariants(
          data.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            options: {
              size: variant.options?.size ?? "",
              colour: variant.options?.colour ?? "",
              material: variant.options?.material ?? "",
              other: variant.options?.other ?? "",
            },
            priceCents: variant.priceCents,
            stockQuantity: variant.stockQuantity,
            reservedQuantity: variant.reservedQuantity,
            availableQuantity: variant.availableQuantity,
            imageUrl: variant.imageUrl ?? "",
            isAvailable: variant.isAvailable,
          }))
        );
        setImages(toManagedImages(data.images ?? []));
        setIsPhysical(data.isPhysical !== false);
        const grams = data.weightGrams ?? null;
        if (grams != null && data.weightUnit === "kg") {
          setWeightUnit("kg");
          setWeightValue(String(grams / 1000));
        } else {
          setWeightUnit("g");
          setWeightValue(grams != null ? String(grams) : "");
        }
        setDimL(
          data.dimensionsCm?.length != null
            ? String(data.dimensionsCm.length)
            : ""
        );
        setDimW(
          data.dimensionsCm?.width != null ? String(data.dimensionsCm.width) : ""
        );
        setDimH(
          data.dimensionsCm?.height != null
            ? String(data.dimensionsCm.height)
            : ""
        );
        setShippingClass(
          data.shippingClass ?? ShippingClass.STANDARD_CLOTHING
        );
        setFreeShippingEligible(data.freeShippingEligible !== false);
        setHandlingDollars(
          ((data.additionalHandlingCents ?? 0) / 100).toFixed(2)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  function updateVariant(index: number, patch: Partial<AdminVariant>) {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant
      )
    );
  }

  function updateOption(
    index: number,
    key: keyof AdminVariant["options"],
    value: string
  ) {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? { ...variant, options: { ...variant.options, [key]: value } }
          : variant
      )
    );
  }

  async function saveAll() {
    if (!product) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const regular = dollarsToCents(priceDollars);
      if (regular === null) throw new Error("Enter a valid regular price");
      let priceCents = regular;
      let compareAtPriceCents: number | undefined;
      if (saleDollars.trim()) {
        const sale = dollarsToCents(saleDollars);
        if (sale === null) throw new Error("Enter a valid sale price");
        if (sale > regular) throw new Error("Sale price cannot exceed regular price");
        priceCents = sale;
        compareAtPriceCents = regular;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/products/${product.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            slug: slug.trim() || undefined,
            status,
            categoryId,
            subcategoryId: subcategoryId || null,
            shortDescription: shortDescription.trim() || undefined,
            description: description.trim() || undefined,
            priceCents,
            compareAtPriceCents,
            seoTitle: seoTitle.trim() || undefined,
            seoDescription: seoDescription.trim() || undefined,
            lowStockThreshold: Number(lowStockThreshold) || 0,
            isFeatured: featured,
            isNewArrival: newArrival,
            images: serializeManagedImages(images).map((image) => ({
              ...image,
              alt: image.alt || name.trim(),
            })),
            isPhysical,
            weightUnit,
            weightGrams: weightValue.trim()
              ? weightUnit === "kg"
                ? Math.round(Number(weightValue) * 1000)
                : Math.round(Number(weightValue))
              : undefined,
            dimensionsCm: {
              length: dimL.trim() ? Number(dimL) : undefined,
              width: dimW.trim() ? Number(dimW) : undefined,
              height: dimH.trim() ? Number(dimH) : undefined,
            },
            shippingClass,
            freeShippingEligible,
            additionalHandlingCents: Math.round(
              Number(handlingDollars || 0) * 100
            ),
            clothing: isJewellery
              ? undefined
              : {
                  fabric: clothing.fabric || undefined,
                  workType: clothing.workType || undefined,
                  sleeveStyle: clothing.sleeveStyle || undefined,
                  stitchingType: clothing.stitchingType || undefined,
                  occasion: clothing.occasion || undefined,
                  careInstructions: clothing.careInstructions || undefined,
                },
            jewellery: isJewellery
              ? {
                  jewelleryType: jewellery.jewelleryType || undefined,
                  material: jewellery.material || undefined,
                  finishColour: jewellery.finishColour || undefined,
                  size: jewellery.size || undefined,
                  careInstructions: jewellery.careInstructions || undefined,
                }
              : undefined,
            variants: variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              options: {
                size: variant.options.size || undefined,
                colour: variant.options.colour || undefined,
                material: variant.options.material || undefined,
                other: variant.options.other || undefined,
              },
              priceCents: variant.priceCents,
              stockQuantity: variant.stockQuantity,
              imageUrl: variant.imageUrl || undefined,
              isAvailable: variant.isAvailable,
            })),
          }),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to save product");
      }
      const data = json.data as AdminProduct;
      setProduct(data);
      setImages(toManagedImages(data.images ?? []));
      setMessage("Changes saved. Storefront will update shortly.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await revalidateCatalogue(data.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#6B726E]">Loading product…</p>;
  }

  const primaryImage =
    images.find((image) => image.isPrimary)?.url ?? images[0]?.url;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C49A36]">
            Edit product
          </p>
          <h1 className="font-serif text-3xl text-[#003F2D]">
            {product?.name ?? "Product"}
          </h1>
          <p className="mt-1 text-sm text-[#6B726E]">
            Update catalogue details, variants and inventory. Changes sync to
            MongoDB and the storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStockOpen(true)}
            className="inline-flex h-10 items-center gap-2 border border-[#E5DFD4] bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
          >
            <Package className="h-3.5 w-3.5" />
            Manage stock
          </button>
          {product ? (
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-10 items-center border border-[#E5DFD4] bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
            >
              View product
            </Link>
          ) : null}
          <Link
            href="/admin/products"
            className="inline-flex h-10 items-center px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-[#C49A36]/40 bg-[#C49A36]/10 px-4 py-3 text-sm text-[#003F2D]">
          {message}
        </p>
      ) : null}

      {product ? (
        <>
          <section className="border border-[#E5DFD4] bg-white p-5">
            <ProductImageManager
              images={images}
              onChange={setImages}
              defaultAlt={name.trim() || "Product image"}
              disabled={saving}
            />
          </section>

          <section className="grid gap-4 border border-[#E5DFD4] bg-white p-5 md:grid-cols-2">
            <label className={labelClass}>
              Product name
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className={labelClass}>
              SKU
              <input className={fieldClass} value={sku} onChange={(e) => setSku(e.target.value)} />
            </label>
            <label className={labelClass}>
              Slug
              <input className={fieldClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
            <label className={labelClass}>
              Category
              <select
                className={fieldClass}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
              >
                {topCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            {subcategories.length > 0 ? (
              <label className={labelClass}>
                Subcategory
                <select
                  className={fieldClass}
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
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
            <label className={labelClass}>
              Regular price (CAD)
              <input className={fieldClass} value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} />
            </label>
            <label className={labelClass}>
              Sale price (CAD)
              <input className={fieldClass} value={saleDollars} onChange={(e) => setSaleDollars(e.target.value)} placeholder="Optional" />
            </label>
            <label className={labelClass}>
              Status
              <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value={ProductStatus.DRAFT}>Draft</option>
                <option value={ProductStatus.PUBLISHED}>Published</option>
                <option value={ProductStatus.UNPUBLISHED}>Unpublished</option>
                <option value={ProductStatus.ARCHIVED}>Archived</option>
              </select>
            </label>
            <label className={labelClass}>
              Low stock threshold
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Short description
              <textarea
                rows={2}
                className={fieldClass}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Description
              <textarea
                rows={5}
                className={fieldClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-[#003F2D]">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-[#003F2D]">
              <input type="checkbox" checked={newArrival} onChange={(e) => setNewArrival(e.target.checked)} />
              New Arrivals
            </label>
          </section>

          <section className="grid gap-4 border border-[#E5DFD4] bg-white p-5 md:grid-cols-2">
            <h2 className="font-serif text-xl text-[#003F2D] md:col-span-2">
              Shipping details
            </h2>
            <label className="flex items-center gap-2 text-sm text-[#003F2D] md:col-span-2">
              <input
                type="checkbox"
                checked={isPhysical}
                onChange={(e) => setIsPhysical(e.target.checked)}
              />
              Physical product (requires shipping or pickup)
            </label>
            <label className={labelClass}>
              Weight
              <div className="mt-1 flex gap-2">
                <input
                  className={fieldClass + " mt-0"}
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  placeholder="Optional"
                />
                <select
                  className={fieldClass + " mt-0 w-24"}
                  value={weightUnit}
                  onChange={(e) =>
                    setWeightUnit(e.target.value as "g" | "kg")
                  }
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </label>
            <label className={labelClass}>
              Shipping class
              <select
                className={fieldClass}
                value={shippingClass}
                onChange={(e) => setShippingClass(e.target.value)}
              >
                {Object.entries(SHIPPING_CLASS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Length (cm)
              <input className={fieldClass} value={dimL} onChange={(e) => setDimL(e.target.value)} />
            </label>
            <label className={labelClass}>
              Width (cm)
              <input className={fieldClass} value={dimW} onChange={(e) => setDimW(e.target.value)} />
            </label>
            <label className={labelClass}>
              Height (cm)
              <input className={fieldClass} value={dimH} onChange={(e) => setDimH(e.target.value)} />
            </label>
            <label className={labelClass}>
              Additional handling (CAD)
              <input
                className={fieldClass}
                value={handlingDollars}
                onChange={(e) => setHandlingDollars(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-[#003F2D]">
              <input
                type="checkbox"
                checked={freeShippingEligible}
                onChange={(e) => setFreeShippingEligible(e.target.checked)}
              />
              Eligible for free shipping threshold
            </label>
          </section>

          <section className="grid gap-4 border border-[#E5DFD4] bg-white p-5 md:grid-cols-2">
            <h2 className="font-serif text-xl text-[#003F2D] md:col-span-2">
              {isJewellery ? "Jewellery details" : "Clothing details"}
            </h2>
            {isJewellery ? (
              <>
                {(
                  [
                    ["jewelleryType", "Jewellery type"],
                    ["material", "Material"],
                    ["finishColour", "Finish colour"],
                    ["size", "Size"],
                    ["careInstructions", "Care instructions"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={labelClass}>
                    {label}
                    <input
                      className={fieldClass}
                      value={jewellery[key]}
                      onChange={(e) =>
                        setJewellery((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </>
            ) : (
              <>
                {(
                  [
                    ["fabric", "Fabric"],
                    ["workType", "Work type"],
                    ["sleeveStyle", "Sleeve style"],
                    ["stitchingType", "Stitching type"],
                    ["occasion", "Occasion"],
                    ["careInstructions", "Care instructions"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={labelClass}>
                    {label}
                    <input
                      className={fieldClass}
                      value={clothing[key]}
                      onChange={(e) =>
                        setClothing((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </>
            )}
            <label className={labelClass}>
              SEO title
              <input className={fieldClass} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </label>
            <label className={labelClass}>
              Meta description
              <input className={fieldClass} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </label>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-[#003F2D]">Variants & stock</h2>
            <div className="overflow-x-auto border border-[#E5DFD4] bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E5DFD4] bg-[#FAF7F0] text-xs uppercase tracking-[0.12em] text-[#6B726E]">
                  <tr>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Size</th>
                    <th className="px-3 py-3">Colour</th>
                    <th className="px-3 py-3">Price (¢)</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Reserved</th>
                    <th className="px-3 py-3">Available</th>
                    <th className="px-3 py-3">On</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={variant.id ?? `new-${index}`} className="border-b border-[#E5DFD4]/70">
                      <td className="px-3 py-2">
                        <input
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, { sku: e.target.value })}
                          className="w-32 border border-[#E5DFD4] px-2 py-1.5"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={variant.options.size}
                          onChange={(e) => updateOption(index, "size", e.target.value)}
                          className="w-16 border border-[#E5DFD4] px-2 py-1.5"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={variant.options.colour}
                          onChange={(e) => updateOption(index, "colour", e.target.value)}
                          className="w-20 border border-[#E5DFD4] px-2 py-1.5"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={variant.priceCents}
                          onChange={(e) =>
                            updateVariant(index, {
                              priceCents: Number(e.target.value) || 0,
                            })
                          }
                          className="w-24 border border-[#E5DFD4] px-2 py-1.5"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={variant.stockQuantity}
                          onChange={(e) =>
                            updateVariant(index, {
                              stockQuantity: Number(e.target.value) || 0,
                            })
                          }
                          className="w-16 border border-[#E5DFD4] px-2 py-1.5"
                        />
                      </td>
                      <td className="px-3 py-2 text-[#6B726E]">
                        {variant.reservedQuantity ?? 0}
                      </td>
                      <td className="px-3 py-2 text-[#003F2D]">
                        {variant.availableQuantity ??
                          Math.max(
                            0,
                            variant.stockQuantity - (variant.reservedQuantity ?? 0)
                          )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={variant.isAvailable}
                          onChange={(e) =>
                            updateVariant(index, { isAvailable: e.target.checked })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-xs uppercase tracking-[0.12em] text-[#003F2D] disabled:opacity-40"
                          disabled={variants.length <= 1}
                          onClick={() =>
                            setVariants((current) =>
                              current.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="border border-[#E5DFD4] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
              onClick={() =>
                setVariants((current) => [
                  ...current,
                  emptyVariant(sku || product.sku, current.length),
                ])
              }
            >
              Add variant
            </button>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveAll()}
              className="inline-flex h-11 items-center gap-2 bg-[#003F2D] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0B513B] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
            <Link
              href="/admin/products"
              className="inline-flex h-11 items-center border border-[#E5DFD4] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003F2D]"
            >
              Cancel
            </Link>
          </div>
        </>
      ) : null}

      {stockOpen && product ? (
        <StockManagementModal
          open
          productId={product.id}
          productName={product.name}
          productImage={primaryImage}
          onClose={() => setStockOpen(false)}
        />
      ) : null}
    </div>
  );
}
