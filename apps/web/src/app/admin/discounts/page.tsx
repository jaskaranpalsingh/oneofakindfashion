"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminFetch } from "@/lib/admin-api";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minimumOrderCents: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export default function AdminDiscountsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "10",
    minimumOrderCents: "0",
    usageLimit: "",
  });

  const couponsQuery = useQuery({
    queryKey: ["admin", "discounts"],
    queryFn: () => adminFetch<Coupon[]>("/api/v1/admin/discounts"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminFetch("/api/v1/admin/discounts", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value:
            form.type === "percentage"
              ? Number(form.value)
              : Math.round(Number(form.value) * 100),
          minimumOrderCents: Math.round(Number(form.minimumOrderCents) || 0),
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          isActive: true,
        }),
      }),
    onSuccess: async () => {
      setMessage("Coupon created");
      setForm({
        code: "",
        type: "percentage",
        value: "10",
        minimumOrderCents: "0",
        usageLimit: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "discounts"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (coupon: Coupon) =>
      adminFetch(`/api/v1/admin/discounts/${coupon.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !coupon.isActive }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "discounts"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Discounts</h1>
        <p className="mt-1 text-sm text-muted">
          Coupon codes stored in MongoDB and validated server-side at checkout.
        </p>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}

      <form
        className="grid gap-3 border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <input
          required
          placeholder="CODE"
          value={form.code}
          onChange={(event) =>
            setForm((current) => ({ ...current, code: event.target.value }))
          }
          className="border border-border px-3 py-2 text-sm uppercase"
        />
        <select
          value={form.type}
          onChange={(event) =>
            setForm((current) => ({ ...current, type: event.target.value }))
          }
          className="border border-border px-3 py-2 text-sm"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed CAD</option>
        </select>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          placeholder={form.type === "percentage" ? "10" : "25.00"}
          value={form.value}
          onChange={(event) =>
            setForm((current) => ({ ...current, value: event.target.value }))
          }
          className="border border-border px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Min order cents"
          value={form.minimumOrderCents}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              minimumOrderCents: event.target.value,
            }))
          }
          className="border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
        >
          Create
        </button>
      </form>

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(couponsQuery.data ?? []).map((coupon) => (
              <tr key={coupon.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-medium">{coupon.code}</td>
                <td className="px-4 py-3 capitalize">{coupon.type}</td>
                <td className="px-4 py-3">
                  {coupon.type === "percentage"
                    ? `${coupon.value}%`
                    : `$${(coupon.value / 100).toFixed(2)}`}
                </td>
                <td className="px-4 py-3">
                  {coupon.usedCount}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3">
                  {coupon.isActive ? "Active" : "Disabled"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-green"
                    onClick={() => toggleMutation.mutate(coupon)}
                  >
                    {coupon.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
            {!couponsQuery.isLoading &&
            (couponsQuery.data?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  No coupons yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
