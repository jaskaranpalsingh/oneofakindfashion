"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCad, ProductStatus } from "@ookf/shared";
import {
  Archive,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  EyeOff,
} from "lucide-react";
import { StockManagementModal } from "@/components/admin/stock-management-modal";
import { adminFetch } from "@/lib/admin-api";
import { getApiBaseUrl } from "@/lib/api";
import { revalidateCatalogue } from "@/lib/revalidate-catalogue";
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
  physicalStock?: number;
  reservedStock?: number;
  inventoryStatus?: string;
  inStock: boolean;
};

type ProductsResponse = {
  items: AdminProductRow[];
  summary?: {
    total: number;
    published: number;
    draft: number;
    unpublished: number;
    archived: number;
    lowStock: number;
    outOfStock: number;
  };
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

function mediaUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
}

function InventoryBadge({ status }: { status?: string }) {
  const label =
    status === "out_of_stock"
      ? "Out of stock"
      : status === "low_stock"
        ? "Low stock"
        : "In stock";
  return (
    <span
      className={cn(
        "inline-flex rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        status === "out_of_stock" && "bg-red-50 text-red-700",
        status === "low_stock" && "bg-amber-50 text-amber-800",
        (!status || status === "in_stock") && "bg-emerald-50 text-emerald-800"
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="capitalize text-[#003F2D]">{status.replaceAll("_", " ")}</span>
  );
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [stockTarget, setStockTarget] = useState<AdminProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
      return adminFetch<ProductsResponse>(
        `/api/v1/admin/products?${params.toString()}`
      );
    },
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] }),
    ]);
    await revalidateCatalogue();
  };

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) =>
      adminFetch(`/api/v1/admin/products/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: input.status }),
      }),
    onSuccess: async () => {
      setToast("Product status updated");
      setMenuOpenId(null);
      await invalidateAll();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/v1/admin/products/${id}/archive`, { method: "POST" }),
    onSuccess: async () => {
      setToast("Product archived");
      setMenuOpenId(null);
      await invalidateAll();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch<{ id: string }>(`/api/v1/admin/products/${id}/duplicate`, {
        method: "POST",
      }),
    onSuccess: async (data) => {
      setToast("Product duplicated as draft");
      setMenuOpenId(null);
      await invalidateAll();
      if (data?.id) {
        window.location.assign(`/admin/products/${data.id}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/v1/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setToast("Product removed from storefront");
      setDeleteTarget(null);
      await invalidateAll();
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (input: {
      action: "publish" | "unpublish" | "archive" | "delete" | "set_category";
      categoryId?: string;
    }) =>
      adminFetch<{ succeeded?: number; failed?: number }>(
        "/api/v1/admin/products/bulk",
        {
          method: "POST",
          body: JSON.stringify({
            ids: selected,
            action: input.action,
            categoryId: input.categoryId,
          }),
        }
      ),
    onSuccess: async (result) => {
      setToast(
        `Bulk update complete · ${result.succeeded ?? 0} succeeded${
          result.failed ? ` · ${result.failed} failed` : ""
        }`
      );
      setSelected([]);
      await invalidateAll();
    },
  });

  const products = useMemo(() => {
    const items = productsQuery.data?.items ?? [];
    if (stockFilter === "all") return items;
    return items.filter((item) => item.inventoryStatus === stockFilter);
  }, [productsQuery.data?.items, stockFilter]);

  const summary = productsQuery.data?.summary;
  const errorMessage =
    (productsQuery.error as Error | null)?.message ??
    (statusMutation.error as Error | null)?.message ??
    (archiveMutation.error as Error | null)?.message ??
    (duplicateMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    (bulkMutation.error as Error | null)?.message;

  const allSelected =
    products.length > 0 && products.every((product) => selected.includes(product.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((current) =>
        current.filter((id) => !products.some((product) => product.id === id))
      );
      return;
    }
    setSelected((current) => [
      ...new Set([...current, ...products.map((product) => product.id)]),
    ]);
  }

  function toggleOne(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#003F2D]">Products</h1>
          <div className="mt-3 h-px w-10 bg-[#C49A36]" />
          <p className="mt-3 text-sm text-[#6B726E]">
            Manage your products and inventory.
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total products" value={summary?.total ?? "—"} />
        <SummaryCard label="Published" value={summary?.published ?? "—"} />
        <SummaryCard label="Low stock" value={summary?.lowStock ?? "—"} />
        <SummaryCard label="Out of stock" value={summary?.outOfStock ?? "—"} />
      </div>

      <div className="grid gap-3 border border-[#E5DFD4] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
          Search
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Name or SKU"
            className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
          >
            <option value="all">All categories</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
          >
            <option value="all">All</option>
            <option value={ProductStatus.PUBLISHED}>Published</option>
            <option value={ProductStatus.DRAFT}>Draft</option>
            <option value={ProductStatus.UNPUBLISHED}>Unpublished</option>
            <option value={ProductStatus.ARCHIVED}>Archived</option>
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
          Stock
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
          >
            <option value="all">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </label>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border border-[#E5DFD4] bg-white px-4 py-3 text-sm">
          <span className="text-[#6B726E]">{selected.length} selected</span>
          <button
            type="button"
            className="border border-[#E5DFD4] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
            onClick={() => bulkMutation.mutate({ action: "publish" })}
          >
            Publish
          </button>
          <button
            type="button"
            className="border border-[#E5DFD4] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
            onClick={() => bulkMutation.mutate({ action: "unpublish" })}
          >
            Unpublish
          </button>
          <button
            type="button"
            className="border border-[#E5DFD4] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
            onClick={() => bulkMutation.mutate({ action: "archive" })}
          >
            Archive
          </button>
          <button
            type="button"
            className="border border-red-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700"
            onClick={() => {
              if (
                window.confirm(
                  `Delete ${selected.length} selected product(s) from the storefront?`
                )
              ) {
                bulkMutation.mutate({ action: "delete" });
              }
            }}
          >
            Delete
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto border border-[#E5DFD4] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5DFD4] bg-[#FAF7F0] text-xs uppercase tracking-[0.12em] text-[#6B726E]">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all products"
                />
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`sk-${index}`} className="border-b border-[#E5DFD4]/70">
                  <td colSpan={9} className="px-4 py-4">
                    <div className="h-4 animate-pulse rounded bg-[#EFEAE0]" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-[#6B726E]">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const image = mediaUrl(product.primaryImageUrl);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-[#E5DFD4]/70 transition-colors hover:bg-[#FAF7F0]/70"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={() => toggleOne(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-[#FAF7F0]">
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
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-[#003F2D] hover:underline"
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-[#6B726E]">
                            {product.variantCount} variant
                            {product.variantCount === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6B726E]">{product.sku}</td>
                    <td className="px-4 py-3">{product.categoryName}</td>
                    <td className="px-4 py-3">{formatCad(product.priceCents)}</td>
                    <td className="px-4 py-3 font-medium text-[#003F2D]">
                      {product.stockQuantity}
                    </td>
                    <td className="px-4 py-3">
                      <InventoryBadge status={product.inventoryStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex items-center gap-1" ref={menuOpenId === product.id ? menuRef : undefined}>
                        <IconAction
                          href={`/admin/products/${product.id}`}
                          label="Edit product"
                          icon={Pencil}
                        />
                        <IconButton
                          label="Manage stock"
                          icon={Package}
                          onClick={() => setStockTarget(product)}
                        />
                        <IconAction
                          href={`/products/${product.slug}`}
                          label="View product"
                          icon={ExternalLink}
                          external
                        />
                        <button
                          type="button"
                          aria-label="More actions"
                          title="More actions"
                          onClick={() =>
                            setMenuOpenId((current) =>
                              current === product.id ? null : product.id
                            )
                          }
                          className="rounded p-1.5 text-[#003F2D] hover:bg-[#FAF7F0]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpenId === product.id ? (
                          <div className="absolute right-0 top-9 z-20 w-44 border border-[#E5DFD4] bg-white py-1 shadow-md">
                            <MenuItem
                              icon={UploadCloud}
                              label={
                                product.status === ProductStatus.PUBLISHED
                                  ? "Unpublish"
                                  : "Publish"
                              }
                              onClick={() =>
                                statusMutation.mutate({
                                  id: product.id,
                                  status:
                                    product.status === ProductStatus.PUBLISHED
                                      ? ProductStatus.UNPUBLISHED
                                      : ProductStatus.PUBLISHED,
                                })
                              }
                            />
                            <MenuItem
                              icon={Copy}
                              label="Duplicate"
                              onClick={() => duplicateMutation.mutate(product.id)}
                            />
                            <MenuItem
                              icon={Archive}
                              label="Archive"
                              onClick={() => archiveMutation.mutate(product.id)}
                            />
                            <MenuItem
                              icon={EyeOff}
                              label="Unpublish"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: product.id,
                                  status: ProductStatus.UNPUBLISHED,
                                })
                              }
                            />
                            <MenuItem
                              icon={Trash2}
                              label="Delete"
                              danger
                              onClick={() => {
                                setMenuOpenId(null);
                                setDeleteTarget(product);
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {stockTarget ? (
        <StockManagementModal
          open
          productId={stockTarget.id}
          productName={stockTarget.name}
          productImage={stockTarget.primaryImageUrl}
          onClose={() => setStockTarget(null)}
        />
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md border border-[#E5DFD4] bg-white p-6"
          >
            <h2 className="font-serif text-2xl text-[#003F2D]">
              Delete this product?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6B726E]">
              This product will be removed from your storefront. Existing order
              records will not be affected.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="border border-[#E5DFD4] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="bg-red-700 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 border border-[#C49A36]/50 bg-white px-4 py-3 text-sm text-[#003F2D] shadow-md">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-[#E5DFD4] bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-[#003F2D]">{value}</p>
    </div>
  );
}

function IconAction({
  href,
  label,
  icon: Icon,
  external,
}: {
  href: string;
  label: string;
  icon: typeof Pencil;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      title={label}
      aria-label={label}
      className="rounded p-1.5 text-[#003F2D] hover:bg-[#FAF7F0]"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </Link>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded p-1.5 text-[#003F2D] hover:bg-[#FAF7F0]"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#FAF7F0]",
        danger ? "text-red-700" : "text-[#003F2D]"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
