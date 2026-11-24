"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCad } from "@ookf/shared";
import { AccountShell } from "@/components/account/account-shell";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderRow = {
  orderNumber: string;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  itemCount: number;
  totals: { totalCents: number };
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippingCarrier?: string | null;
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/orders/mine`, {
          credentials: "include",
        });
        const json = await response.json();
        if (response.status === 401) {
          setError("Sign in to view your orders.");
          return;
        }
        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Unable to load orders");
        }
        setOrders(json.data as OrderRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AccountShell
      title="My Orders"
      description="Track payment and fulfillment for every order on your account."
    >
      {loading ? (
        <p className="text-sm text-[#6B6458]">Loading orders…</p>
      ) : null}

      {error ? (
        <div className="space-y-4">
          <p className="border border-[#E5DFD4] bg-white px-4 py-3 text-sm text-[#003F2D]">
            {error}
          </p>
          <Link href="/account/login" className={cn(buttonVariants())}>
            Sign in
          </Link>
        </div>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <div className="space-y-4 border border-[#E5DFD4] bg-white p-6">
          <p className="text-sm text-[#6B6458]">No orders yet.</p>
          <Link href="/shop" className={cn(buttonVariants())}>
            Start shopping
          </Link>
        </div>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="overflow-x-auto border border-[#E5DFD4] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E5DFD4] bg-[#FAF7F0] text-xs uppercase tracking-[0.12em] text-[#6B6458]">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tracking</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.orderNumber}
                  className="border-b border-[#E5DFD4]/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="font-medium text-[#003F2D] hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#6B6458]">
                    {new Date(order.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3">{order.itemCount}</td>
                  <td className="px-4 py-3">
                    {formatCad(order.totals.totalCents)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {order.paymentStatus.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {order.fulfillmentStatus.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-[#6B6458]">
                    {order.trackingUrl && order.trackingNumber ? (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#003F2D] underline"
                      >
                        {order.shippingCarrier
                          ? `${order.shippingCarrier} · `
                          : ""}
                        {order.trackingNumber}
                      </a>
                    ) : (
                      order.trackingNumber || "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AccountShell>
  );
}
