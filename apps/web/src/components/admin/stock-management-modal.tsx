"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type VariantStock = {
  id: string;
  sku: string;
  options: { size?: string; colour?: string };
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  imageUrl?: string | null;
};

type AdjustmentRow = {
  id: string;
  sku: string;
  type: string;
  quantityDelta: number;
  quantityAfter: number;
  reason: string | null;
  createdAt: string;
};

function mediaUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
}

export function StockManagementModal({
  open,
  onClose,
  productId,
  productName,
  productImage,
  initialVariantId,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string | null;
  initialVariantId?: string;
}) {
  const queryClient = useQueryClient();
  const [variantId, setVariantId] = useState(initialVariantId ?? "");
  const [mode, setMode] = useState<"set" | "add" | "remove">("set");
  const [quantity, setQuantity] = useState("0");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ["admin", "product", productId, "stock"],
    enabled: open && Boolean(productId),
    queryFn: () =>
      adminFetch<{
        name: string;
        sku: string;
        primaryImageUrl?: string | null;
        lowStockThreshold?: number;
        variants: VariantStock[];
      }>(`/api/v1/admin/products/${productId}`),
  });

  const historyQuery = useQuery({
    queryKey: ["admin", "inventory", "history", productId],
    enabled: open && Boolean(productId),
    queryFn: () =>
      adminFetch<AdjustmentRow[]>(
        `/api/v1/admin/inventory/adjustments?productId=${productId}&limit=20`
      ),
  });

  const variants = productQuery.data?.variants ?? [];
  const selected =
    variants.find((variant) => variant.id === variantId) ?? variants[0];

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    if (initialVariantId) setVariantId(initialVariantId);
  }, [open, initialVariantId]);

  useEffect(() => {
    if (!selected) return;
    if (!variantId) setVariantId(selected.id);
    if (mode === "set") setQuantity(String(selected.stockQuantity));
  }, [selected?.id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustMutation = useMutation({
    mutationFn: () =>
      adminFetch("/api/v1/admin/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({
          productId,
          variantId: selected?.id,
          mode,
          quantity: Number(quantity),
          reason: reason.trim() || undefined,
        }),
      }),
    onSuccess: async () => {
      setMessage("Stock updated");
      setReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "inventory", "history", productId],
        }),
      ]);
    },
    onError: (error: Error) => setMessage(error.message),
  });

  if (!open) return null;

  const image =
    mediaUrl(selected?.imageUrl) ??
    mediaUrl(productImage) ??
    mediaUrl(productQuery.data?.primaryImageUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[#E5DFD4] bg-white shadow-lg animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5DFD4] px-5 py-4">
          <div className="flex gap-3">
            <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-[#FAF7F0]">
              {image ? (
                <Image src={image} alt="" fill unoptimized className="object-cover" />
              ) : null}
            </div>
            <div>
              <h2
                id="stock-modal-title"
                className="font-serif text-xl text-[#003F2D]"
              >
                Manage stock
              </h2>
              <p className="mt-1 text-sm text-[#6B726E]">
                {productQuery.data?.name ?? productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#6B726E] hover:bg-[#FAF7F0] hover:text-[#003F2D]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {productQuery.isLoading ? (
            <p className="text-sm text-[#6B726E]">Loading variants…</p>
          ) : null}

          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
            Variant
            <select
              value={selected?.id ?? ""}
              onChange={(event) => setVariantId(event.target.value)}
              className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.sku}
                  {variant.options?.size ? ` · ${variant.options.size}` : ""}
                  {variant.options?.colour ? ` · ${variant.options.colour}` : ""}
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <div className="grid grid-cols-3 gap-3 border border-[#E5DFD4] bg-[#FAF7F0] p-3 text-center text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B726E]">
                  Physical
                </p>
                <p className="mt-1 font-medium text-[#003F2D]">
                  {selected.stockQuantity}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B726E]">
                  Reserved
                </p>
                <p className="mt-1 font-medium text-[#003F2D]">
                  {selected.reservedQuantity}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B726E]">
                  Available
                </p>
                <p className="mt-1 font-medium text-[#003F2D]">
                  {selected.availableQuantity}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {(["set", "add", "remove"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  if (value === "set" && selected) {
                    setQuantity(String(selected.stockQuantity));
                  } else {
                    setQuantity("0");
                  }
                }}
                className={cn(
                  "border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                  mode === value
                    ? "border-[#003F2D] bg-[#003F2D] text-white"
                    : "border-[#E5DFD4] bg-white text-[#003F2D]"
                )}
              >
                {value === "set" ? "Set stock" : value === "add" ? "Add stock" : "Remove stock"}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
            Quantity
            <input
              type="number"
              min={0}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
            Reason{" "}
            <span className="font-normal normal-case tracking-normal text-[#9CA3AF]">
              (optional)
            </span>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="New inventory received, damaged, correction…"
              list="stock-reasons"
              className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#003F2D]"
            />
            <datalist id="stock-reasons">
              <option value="New inventory received" />
              <option value="Damaged product" />
              <option value="Manual correction" />
              <option value="In-store sale" />
              <option value="Customer return" />
            </datalist>
          </label>

          {message ? (
            <p
              className={cn(
                "border px-3 py-2 text-sm",
                adjustMutation.isError
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-[#C49A36]/40 bg-[#C49A36]/10 text-[#003F2D]"
              )}
            >
              {message}
            </p>
          ) : null}

          <button
            type="button"
            disabled={adjustMutation.isPending || !selected}
            onClick={() => adjustMutation.mutate()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0B513B] disabled:opacity-60"
          >
            {adjustMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Update stock"
            )}
          </button>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
              Recent stock history
            </h3>
            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm">
              {(historyQuery.data ?? []).length === 0 ? (
                <li className="text-[#6B726E]">No adjustments yet.</li>
              ) : (
                (historyQuery.data ?? []).map((row) => (
                  <li
                    key={row.id}
                    className="flex items-start justify-between gap-3 border-b border-[#E5DFD4] py-2"
                  >
                    <div>
                      <p className="text-[#003F2D]">
                        {row.type.replaceAll("_", " ")} ·{" "}
                        {row.quantityDelta > 0 ? "+" : ""}
                        {row.quantityDelta}
                      </p>
                      <p className="text-xs text-[#6B726E]">
                        {row.sku}
                        {row.reason ? ` · ${row.reason}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-[#6B726E]">
                      → {row.quantityAfter}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
