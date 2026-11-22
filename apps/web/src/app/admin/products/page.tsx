"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCad, ProductStatus } from "@ookf/shared";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: string;
  priceCents: number;
  primaryImageUrl: string | null;
  categoryName: string;
  categorySlug: string | null;
  variantCount: number;
  stockQuantity: number;
  inStock: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

function mediaUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Site-relative paths (/demo-products, /uploads, …) are served by Next.js public/
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin-products"],
    queryFn: async () => {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/categories?includeHidden=true`,
        { credentials: "include" }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to load categories");
      }
      return (json.data as CategoryOption[]).filter((item) => !item.parentId);
    },
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products", q, status, categoryId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      params.set("pageSize", "100");
      return adminFetch<AdminProductRow[]>(
        `/api/v1/admin/products?${params.toString()}`
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: (product: AdminProductRow) =>
      adminFetch(`/api/v1/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status:
            product.status === ProductStatus.PUBLISHED
              ? ProductStatus.DRAFT
              : ProductStatus.PUBLISHED,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/v1/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const products = productsQuery.data ?? [];
  const errorMessage =
    (productsQuery.error as Error | null)?.message ??
    (publishMutation.error as Error | null)?.message ??
    (archiveMutation.error as Error | null)?.message;

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: ProductStatus.PUBLISHED, label: "Published" },
      { value: ProductStatus.DRAFT, label: "Draft" },
      { value: ProductStatus.ARCHIVED, label: "Archived" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-green">Products</h1>
          <div className="gold-rule mt-3" />
          <p className="mt-3 text-sm text-muted">
            Manage catalogue items stored in MongoDB.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center gap-2 bg-[#003F2D] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0B513B]"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      <div className="grid gap-3 border border-border bg-white p-4 sm:grid-cols-3">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or SKU"
            className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            <option value="all">All categories</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {errorMessage ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-muted">
                  Loading products…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-muted">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const image = mediaUrl(product.primaryImageUrl);
                return (
                  <tr key={product.id} className="border-b border-border/70">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-10 overflow-hidden bg-ivory">
                        {image ? (
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-ink hover:text-green"
                      >
                        {product.name}
                      </Link>
                      <div className="text-xs text-muted">
                        {product.variantCount} variant
                        {product.variantCount === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.sku}</td>
                    <td className="px-4 py-3">{product.categoryName}</td>
                    <td className="px-4 py-3">
                      {formatCad(product.priceCents)}
                    </td>
                    <td className="px-4 py-3">{product.stockQuantity}</td>
                    <td className="px-4 py-3 capitalize">{product.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-green hover:text-gold-dark"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="text-green hover:text-gold-dark"
                          onClick={() => publishMutation.mutate(product)}
                        >
                          {product.status === ProductStatus.PUBLISHED
                            ? "Unpublish"
                            : "Publish"}
                        </button>
                        <button
                          type="button"
                          className={cn("text-red-700 hover:underline")}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Archive “${product.name}”? It will leave public listings.`
                              )
                            ) {
                              archiveMutation.mutate(product.id);
                            }
                          }}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
