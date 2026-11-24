"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatCad } from "@ookf/shared";
import { adminFetch } from "@/lib/admin-api";

type OrderDetail = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    options: Record<string, string | undefined>;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }>;
  totals: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    currency: string;
  };
  billingAddress: Record<string, string | undefined>;
  shippingAddress: Record<string, string | undefined>;
  shippingMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  shippingCarrier: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  createdAt: string;
};

const FULFILLMENT_OPTIONS = [
  "pending_payment",
  "awaiting_fulfillment",
  "processing",
  "packed",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delivery_exception",
  "returned",
  "preparing_pickup",
  "ready_for_pickup",
  "collected",
  "cancelled",
] as const;

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ["admin", "orders", params.id],
    queryFn: async () => {
      const order = await adminFetch<OrderDetail>(
        `/api/v1/admin/orders/${params.id}`
      );
      setFulfillmentStatus(order.fulfillmentStatus);
      setTrackingNumber(order.trackingNumber ?? "");
      setTrackingUrl(order.trackingUrl ?? "");
      setShippingCarrier(order.shippingCarrier ?? "");
      setInternalNotes(order.internalNotes ?? "");
      return order;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      adminFetch(`/api/v1/admin/orders/${params.id}/fulfillment`, {
        method: "PATCH",
        body: JSON.stringify({
          fulfillmentStatus,
          trackingNumber,
          trackingUrl,
          shippingCarrier,
          internalNotes,
        }),
      }),
    onSuccess: async () => {
      setMessage("Order updated");
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      await orderQuery.refetch();
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const order = orderQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-green"
          >
            ← Orders
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-ink">
            {order?.orderNumber ?? "Order"}
          </h1>
        </div>
      </div>

      {orderQuery.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(orderQuery.error as Error).message}
        </p>
      ) : null}
      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}

      {orderQuery.isLoading ? (
        <p className="text-sm text-muted">Loading order…</p>
      ) : null}

      {order ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <div className="border border-border bg-white p-5">
              <h2 className="font-serif text-xl text-green">Items</h2>
              <ul className="mt-4 divide-y divide-border/70">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{item.productName}</p>
                      <p className="text-xs text-muted">
                        SKU {item.sku}
                        {item.options?.size ? ` · Size ${item.options.size}` : ""}
                        {item.options?.colour
                          ? ` · Colour ${item.options.colour}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted">Qty {item.quantity}</p>
                    </div>
                    <p>{formatCad(item.lineTotalCents)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{formatCad(order.totals.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd>{formatCad(order.totals.discountCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd>{formatCad(order.totals.shippingCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Tax</dt>
                  <dd>{formatCad(order.totals.taxCents)}</dd>
                </div>
                <div className="flex justify-between font-medium text-green">
                  <dt>Total</dt>
                  <dd>{formatCad(order.totals.totalCents)}</dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AddressCard title="Shipping" address={order.shippingAddress} />
              <AddressCard title="Billing" address={order.billingAddress} />
            </div>
          </div>

          <div className="space-y-4 border border-border bg-white p-5">
            <p className="text-sm">
              <span className="text-muted">Customer:</span>{" "}
              {order.customerName}
              <br />
              {order.customerEmail}
              {order.customerPhone ? (
                <>
                  <br />
                  {order.customerPhone}
                </>
              ) : null}
            </p>
            <p className="text-sm capitalize">
              <span className="text-muted">Payment:</span>{" "}
              {order.paymentStatus.replaceAll("_", " ")}
            </p>
            <p className="text-sm capitalize">
              <span className="text-muted">Shipping method:</span>{" "}
              {order.shippingMethod.replaceAll("_", " ")}
            </p>

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Fulfillment status
              <select
                value={fulfillmentStatus}
                onChange={(event) => setFulfillmentStatus(event.target.value)}
                className="mt-1 w-full border border-border px-3 py-2 text-sm text-ink"
              >
                {FULFILLMENT_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Carrier
              <input
                value={shippingCarrier}
                onChange={(event) => setShippingCarrier(event.target.value)}
                className="mt-1 w-full border border-border px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Tracking number
              <input
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                className="mt-1 w-full border border-border px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Tracking URL
              <input
                value={trackingUrl}
                onChange={(event) => setTrackingUrl(event.target.value)}
                className="mt-1 w-full border border-border px-3 py-2 text-sm"
                placeholder="https://"
              />
            </label>

            {order.customerNotes ? (
              <div className="border border-border bg-ivory px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Customer notes
                </p>
                <p className="mt-1 text-sm text-ink">{order.customerNotes}</p>
              </div>
            ) : null}

            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Internal notes
              <textarea
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                rows={4}
                className="mt-1 w-full border border-border px-3 py-2 text-sm"
              />
            </label>

            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="w-full bg-green px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-green-emerald disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save fulfillment"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddressCard({
  title,
  address,
}: {
  title: string;
  address: Record<string, string | undefined>;
}) {
  return (
    <div className="border border-border bg-white p-4 text-sm">
      <h3 className="font-serif text-lg text-green">{title}</h3>
      <p className="mt-2 text-muted">
        {address.firstName} {address.lastName}
        <br />
        {address.line1}
        {address.line2 ? (
          <>
            <br />
            {address.line2}
          </>
        ) : null}
        <br />
        {address.city}, {address.province} {address.postalCode}
        <br />
        {address.country}
      </p>
    </div>
  );
}
