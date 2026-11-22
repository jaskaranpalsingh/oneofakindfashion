"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

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
    variantId: string;
    variantSku: string;
    options: { size?: string; colour?: string };
    availableQuantity: number;
    stockQuantity: number;
    status: string;
  }>;
};

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [deltaBySku, setDeltaBySku] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory", q],
    queryFn: () =>
      adminFetch<InventoryResponse>(
        `/api/v1/admin/inventory${q ? `?q=${encodeURIComponent(q)}` : ""}`
      ),
    refetchInterval: 30_000,
  });

  const adjustMutation = useMutation({
    mutationFn: (input: {
      productId: string;
      variantId: string;
      quantityDelta: number;
    }) =>
      adminFetch("/api/v1/admin/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setMessage("Inventory updated");
      await queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard"],
      });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const items = inventoryQuery.data?.items ?? [];
  const summary = inventoryQuery.data?.summary;

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.availableQuantity === b.availableQuantity
          ? a.variantSku.localeCompare(b.variantSku)
          : a.availableQuantity - b.availableQuantity
      ),
    [items]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Inventory</h1>
        <p className="mt-1 text-sm text-muted">
          Live stock from product variants in MongoDB.
        </p>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}
      {inventoryQuery.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(inventoryQuery.error as Error).message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total SKUs" value={summary?.totalSkus ?? "—"} />
        <Stat label="Available units" value={summary?.availableUnits ?? "—"} />
        <Stat label="Low stock" value={summary?.lowStockSkus ?? "—"} />
        <Stat label="Out of stock" value={summary?.outOfStockSkus ?? "—"} />
      </div>

      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search SKU or product name"
        className="w-full max-w-md border border-border bg-white px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Options</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.variantId} className="border-b border-border/70">
                <td className="px-4 py-3">{item.productName}</td>
                <td className="px-4 py-3 font-medium">{item.variantSku}</td>
                <td className="px-4 py-3 text-muted">
                  {[item.options.size, item.options.colour]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-4 py-3">{item.availableQuantity}</td>
                <td className="px-4 py-3 capitalize">
                  {item.status.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 border border-border px-2 py-1"
                      placeholder="+/-"
                      value={deltaBySku[item.variantId] ?? ""}
                      onChange={(event) =>
                        setDeltaBySku((current) => ({
                          ...current,
                          [item.variantId]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-green"
                      onClick={() => {
                        const quantityDelta = Number(
                          deltaBySku[item.variantId]
                        );
                        if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
                          setMessage("Enter a non-zero integer adjustment");
                          return;
                        }
                        adjustMutation.mutate({
                          productId: item.productId,
                          variantId: item.variantId,
                          quantityDelta,
                        });
                        setDeltaBySku((current) => ({
                          ...current,
                          [item.variantId]: "",
                        }));
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!inventoryQuery.isLoading && sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  No inventory rows found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-white p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-green">{value}</p>
    </div>
  );
}
