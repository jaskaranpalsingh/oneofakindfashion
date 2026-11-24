"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatCad } from "@ookf/shared";
import { adminFetch, type AdminOrderRow } from "@/lib/admin-api";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);

  const query = useQuery({
    queryKey: ["admin", "orders", debouncedQ, paymentStatus, fulfillmentStatus],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (fulfillmentStatus) params.set("fulfillmentStatus", fulfillmentStatus);
      return adminFetch<AdminOrderRow[]>(
        `/api/v1/admin/orders?${params.toString()}`
      );
    },
    refetchInterval: 15_000,
  });

  const orders = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            Live order records from MongoDB · updates every 15s
          </p>
        </div>
        <button
          type="button"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green transition hover:border-gold disabled:opacity-60"
        >
          {query.isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search order #, name, email"
          className="min-w-[16rem] flex-1 border border-border bg-white px-3 py-2 text-sm"
        />
        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
          className="border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially refunded</option>
        </select>
        <select
          value={fulfillmentStatus}
          onChange={(event) => setFulfillmentStatus(event.target.value)}
          className="border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All fulfillment</option>
          <option value="pending_payment">Pending payment</option>
          <option value="awaiting_fulfillment">Awaiting fulfillment</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {query.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(query.error as Error).message}
        </p>
      ) : null}

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-border/70">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-[#EFEAE0]" />
                    </td>
                  </tr>
                ))
              : null}

            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-medium text-ink">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{order.customerName}</div>
                  <div className="text-xs text-muted">{order.customerEmail}</div>
                </td>
                <td className="px-4 py-3">{order.itemCount}</td>
                <td className="px-4 py-3">{formatCad(order.totalCents)}</td>
                <td className="px-4 py-3 capitalize">
                  {order.paymentStatus.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3 capitalize">
                  {order.fulfillmentStatus.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3 text-muted">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-green"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}

            {!query.isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-muted">
                  No orders match these filters. Complete a checkout on the
                  storefront and refresh — new paid orders appear here
                  automatically.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!query.isLoading && orders.length > 0 ? (
        <p className="text-xs text-muted">
          Showing {orders.length} order{orders.length === 1 ? "" : "s"}
          {debouncedQ || paymentStatus || fulfillmentStatus
            ? " (filtered)"
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}
