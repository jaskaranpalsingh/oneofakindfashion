"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { StockManagementModal } from "@/components/admin/stock-management-modal";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type InventoryResponse = {
  summary: {
    totalSkus: number;
    availableUnits: number;
    lowStockSkus: number;
    outOfStockSkus: number;
  };
  items: Array<{
    productId: string;
    productName: string;
    productSku?: string;
    variantId: string;
    variantSku: string;
    options: { size?: string; colour?: string };
    availableQuantity: number;
    stockQuantity: number;
    reservedQuantity: number;
    status: string;
  }>;
};

export default function AdminInventoryPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockTarget, setStockTarget] = useState<{
    productId: string;
    productName: string;
    variantId: string;
  } | null>(null);

  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory", q],
    queryFn: () =>
      adminFetch<InventoryResponse>(
        `/api/v1/admin/inventory${q ? `?q=${encodeURIComponent(q)}` : ""}`
      ),
    refetchInterval: 20_000,
  });

  const items = inventoryQuery.data?.items ?? [];
  const summary = inventoryQuery.data?.summary;
  const reservedTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.reservedQuantity ?? 0), 0),
    [items]
  );

  const sorted = useMemo(() => {
    const filtered =
      statusFilter === "all"
        ? items
        : items.filter((item) => item.status === statusFilter);
    return [...filtered].sort((a, b) =>
      a.availableQuantity === b.availableQuantity
        ? a.variantSku.localeCompare(b.variantSku)
        : a.availableQuantity - b.availableQuantity
    );
  }, [items, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-[#003F2D]">Inventory</h1>
        <p className="mt-1 text-sm text-[#6B726E]">
          Live stock from product variants in MongoDB · updates every 20s
        </p>
      </div>

      {inventoryQuery.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(inventoryQuery.error as Error).message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total SKUs" value={summary?.totalSkus ?? "—"} />
        <Stat label="Available units" value={summary?.availableUnits ?? "—"} />
        <Stat label="Reserved" value={reservedTotal} />
        <Stat label="Low stock" value={summary?.lowStockSkus ?? "—"} />
        <Stat label="Out of stock" value={summary?.outOfStockSkus ?? "—"} />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search SKU or product name"
          className="min-w-[16rem] flex-1 border border-[#E5DFD4] bg-white px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-[#E5DFD4] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-[#E5DFD4] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5DFD4] bg-[#FAF7F0] text-xs uppercase tracking-[0.12em] text-[#6B726E]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">Physical</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {inventoryQuery.isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-[#6B726E]">
                  Loading inventory…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-[#6B726E]">
                  No inventory rows match these filters.
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr key={item.variantId} className="border-b border-[#E5DFD4]/70">
                  <td className="px-4 py-3 font-medium text-[#003F2D]">
                    {item.productName}
                  </td>
                  <td className="px-4 py-3 text-[#6B726E]">{item.variantSku}</td>
                  <td className="px-4 py-3 text-[#6B726E]">
                    {[item.options.size, item.options.colour]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">{item.stockQuantity}</td>
                  <td className="px-4 py-3">{item.reservedQuantity ?? 0}</td>
                  <td className="px-4 py-3 font-medium">{item.availableQuantity}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        item.status === "out_of_stock" && "bg-red-50 text-red-700",
                        item.status === "low_stock" && "bg-amber-50 text-amber-800",
                        item.status === "in_stock" && "bg-emerald-50 text-emerald-800"
                      )}
                    >
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setStockTarget({
                          productId: item.productId,
                          productName: item.productName,
                          variantId: item.variantId,
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D] hover:underline"
                    >
                      <Package className="h-3.5 w-3.5" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {stockTarget ? (
        <StockManagementModal
          open
          productId={stockTarget.productId}
          productName={stockTarget.productName}
          initialVariantId={stockTarget.variantId}
          onClose={() => setStockTarget(null)}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#E5DFD4] bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-[#003F2D]">{value}</p>
    </div>
  );
}
