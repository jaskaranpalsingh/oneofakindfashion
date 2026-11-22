"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";

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
  imageUrl: string;
  isAvailable: boolean;
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productType: string;
  priceCents: number;
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

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const me = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          credentials: "include",
        });
        const meJson = await me.json();
        if (!me.ok || meJson?.data?.user?.role !== "admin") {
          setError("Admin sign-in required. Use /account/login.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/admin/products/${productId}`,
          { credentials: "include" }
        );
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Failed to load product");
        }

        const data = json.data as AdminProduct;
        setProduct(data);
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
            imageUrl: variant.imageUrl ?? "",
            isAvailable: variant.isAvailable,
          }))
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

  async function saveVariants() {
    if (!product) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/products/${product.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
        throw new Error(json?.error?.message ?? "Failed to save variants");
      }
      const data = json.data as AdminProduct;
      setProduct(data);
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
          imageUrl: variant.imageUrl ?? "",
          isAvailable: variant.isAvailable,
        }))
      );
      setMessage("Variants saved. Storefront quick view will reflect these options.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save variants");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading product…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Product variants
          </p>
          <h1 className="font-serif text-3xl text-ink">
            {product?.name ?? "Product"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure size, colour, finish, stock, SKU and pricing per sellable
            option. Changes appear on the storefront immediately.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-green"
        >
          ← All products
        </Link>
      </div>

      {error ? (
        <p className="border border-green/20 bg-green/5 px-4 py-3 text-sm text-green">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}

      {product ? (
        <>
          <div className="overflow-x-auto border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Size</th>
                  <th className="px-3 py-3">Colour</th>
                  <th className="px-3 py-3">Finish / Material</th>
                  <th className="px-3 py-3">Other</th>
                  <th className="px-3 py-3">Price (cents)</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Image URL</th>
                  <th className="px-3 py-3">Available</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={variant.id ?? `new-${index}`} className="border-b border-border/70">
                    <td className="px-3 py-2">
                      <input
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(index, { sku: event.target.value })
                        }
                        className="w-36 border border-border px-2 py-1.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.options.size}
                        onChange={(event) =>
                          updateOption(index, "size", event.target.value)
                        }
                        className="w-20 border border-border px-2 py-1.5"
                        placeholder="M"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.options.colour}
                        onChange={(event) =>
                          updateOption(index, "colour", event.target.value)
                        }
                        className="w-24 border border-border px-2 py-1.5"
                        placeholder="Red"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.options.material}
                        onChange={(event) =>
                          updateOption(index, "material", event.target.value)
                        }
                        className="w-28 border border-border px-2 py-1.5"
                        placeholder="Gold"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.options.other}
                        onChange={(event) =>
                          updateOption(index, "other", event.target.value)
                        }
                        className="w-28 border border-border px-2 py-1.5"
                        placeholder="Set A"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={variant.priceCents}
                        onChange={(event) =>
                          updateVariant(index, {
                            priceCents: Number(event.target.value) || 0,
                          })
                        }
                        className="w-28 border border-border px-2 py-1.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={variant.stockQuantity}
                        onChange={(event) =>
                          updateVariant(index, {
                            stockQuantity: Number(event.target.value) || 0,
                          })
                        }
                        className="w-20 border border-border px-2 py-1.5"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.imageUrl}
                        onChange={(event) =>
                          updateVariant(index, { imageUrl: event.target.value })
                        }
                        className="w-40 border border-border px-2 py-1.5"
                        placeholder="/demo-products/…"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={variant.isAvailable}
                        onChange={(event) =>
                          updateVariant(index, {
                            isAvailable: event.target.checked,
                          })
                        }
                        aria-label={`Variant ${variant.sku} available`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs uppercase tracking-[0.12em] text-green disabled:opacity-40"
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green hover:border-green"
              onClick={() =>
                setVariants((current) => [
                  ...current,
                  emptyVariant(product.sku, current.length),
                ])
              }
            >
              Add variant
            </button>
            <button
              type="button"
              disabled={saving || variants.length === 0}
              onClick={() => void saveVariants()}
              className="bg-green px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-green-emerald disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save variants"}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green underline-offset-4 hover:underline"
            >
              View on storefront
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
