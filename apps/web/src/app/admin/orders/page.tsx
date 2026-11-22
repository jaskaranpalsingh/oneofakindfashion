"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatCad } from "@ookf/shared";
import { adminFetch, type AdminOrderRow } from "@/lib/admin-api";

export default function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");

  const query = useQuery({
    queryKey: ["admin", "orders", q, paymentStatus, fulfillmentStatus],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (q.trim()) params.set("q", q.trim());
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (fulfillmentStatus) params.set("fulfillmentStatus", fulfillmentStatus);
      return adminFetch<AdminOrderRow[]>(
        `/api/v1/admin/orders?${params.toString()}`
      );
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            Live order records from MongoDB after checkout.
          </p>
        </div>
        <Link
          href="/account/login"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-green"
        >
          Admin login
        </Link>
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
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={fulfillmentStatus}
          onChange={(event) => setFulfillmentStatus(event.target.value)}
          className="border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All fulfillment</option>
          <option value="awaiting_fulfillment">Awaiting fulfillment</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
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
            {(query.data ?? []).map((order) => (
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
            {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-muted">
                  No orders yet. Place a checkout to see records here.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
