"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { formatCad } from "@ookf/shared";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type TrackedOrder = {
  orderNumber: string;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingMethod: string;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryAt?: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    sku: string;
    imageUrl?: string | null;
    options?: Record<string, string>;
    lineTotalCents: number;
  }>;
  totals?: { totalCents: number };
};

const SHIP_STEPS = [
  "awaiting_fulfillment",
  "processing",
  "packed",
  "shipped",
  "delivered",
] as const;

const PICKUP_STEPS = [
  "awaiting_fulfillment",
  "preparing_pickup",
  "ready_for_pickup",
  "collected",
] as const;

function stepIndex(status: string, pickup: boolean) {
  const steps: readonly string[] = pickup ? PICKUP_STEPS : SHIP_STEPS;
  const aliases: Record<string, string> = {
    pending_payment: steps[0],
    in_transit: "shipped",
    out_for_delivery: "shipped",
    processing: pickup ? "preparing_pickup" : "processing",
  };
  const normalized = aliases[status] ?? status;
  const index = steps.indexOf(normalized);
  return index < 0 ? 0 : index;
}

function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("order") ?? ""
  );
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPickup = order?.shippingMethod === "local_pickup";
  const activeStep = useMemo(
    () => (order ? stepIndex(order.fulfillmentStatus, Boolean(isPickup)) : 0),
    [order, isPickup]
  );
  const steps = isPickup ? PICKUP_STEPS : SHIP_STEPS;
  const labels = isPickup
    ? ["Order confirmed", "Preparing order", "Ready for pickup", "Collected"]
    : ["Order confirmed", "Processing", "Packed", "Shipped", "Delivered"];

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/orders/lookup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Order not found");
      }
      setOrder(json.data as TrackedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to find order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C49A36]">
        Orders
      </p>
      <h1 className="mt-2 font-serif text-4xl text-[#003F2D]">Track order</h1>
      <p className="mt-2 text-sm text-[#6B726E]">
        Enter your order number and the email used at checkout. Order details are
        only shown after verification.
      </p>

      <form
        onSubmit={lookup}
        className="mt-8 grid gap-4 border border-[#E5DFD4] bg-white p-5 sm:grid-cols-2"
      >
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
          Order number
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm text-[#003F2D]"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-[#E5DFD4] px-3 py-2 text-sm text-[#003F2D]"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="h-11 bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.14em] text-white sm:col-span-2 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Track order"}
        </button>
      </form>

      {error ? (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {order ? (
        <div className="mt-8 space-y-6 border border-[#E5DFD4] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#6B726E]">
                Order
              </p>
              <p className="font-serif text-2xl text-[#003F2D]">
                {order.orderNumber}
              </p>
              <p className="mt-1 text-sm text-[#6B726E]">
                Placed{" "}
                {new Date(order.createdAt).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right text-sm text-[#6B726E]">
              <p>Payment: {order.paymentStatus.replaceAll("_", " ")}</p>
              <p>Status: {order.fulfillmentStatus.replaceAll("_", " ")}</p>
              {order.totals ? (
                <p className="mt-1 font-semibold text-[#003F2D]">
                  {formatCad(order.totals.totalCents)}
                </p>
              ) : null}
            </div>
          </div>

          <ol className="space-y-0">
            {labels.map((label, index) => {
              const done = index <= activeStep;
              return (
                <li key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 h-2.5 w-2.5 rounded-full",
                        done ? "bg-[#003F2D]" : "bg-[#E5DFD4]"
                      )}
                    />
                    {index < labels.length - 1 ? (
                      <span
                        className={cn(
                          "min-h-8 w-px flex-1",
                          index < activeStep ? "bg-[#003F2D]" : "bg-[#E5DFD4]"
                        )}
                      />
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "pb-6 text-sm",
                      done ? "text-[#003F2D]" : "text-[#6B726E]"
                    )}
                  >
                    {label}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="space-y-2 text-sm text-[#6B726E]">
            <p>
              Method:{" "}
              <span className="text-[#003F2D]">
                {order.shippingMethod.replaceAll("_", " ")}
              </span>
            </p>
            {order.shippingCarrier ? (
              <p>
                Carrier:{" "}
                <span className="text-[#003F2D]">{order.shippingCarrier}</span>
              </p>
            ) : null}
            {order.trackingNumber ? (
              <p>
                Tracking:{" "}
                <span className="text-[#003F2D]">{order.trackingNumber}</span>
              </p>
            ) : null}
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center bg-[#003F2D] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                Track shipment
              </a>
            ) : null}
          </div>

          <ul className="divide-y divide-[#E5DFD4] border-t border-[#E5DFD4]">
            {order.items.map((item, index) => (
              <li key={`${item.sku}-${index}`} className="flex gap-3 py-3">
                <div className="relative h-16 w-14 overflow-hidden bg-[#FAF7F0]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#003F2D]">{item.productName}</p>
                  <p className="text-xs text-[#6B726E]">
                    Qty {item.quantity} · SKU {item.sku}
                  </p>
                </div>
                <p className="text-sm text-[#003F2D]">
                  {formatCad(item.lineTotalCents)}
                </p>
              </li>
            ))}
          </ul>

          <Link
            href="/shipping-policy"
            className="text-sm text-[#003F2D] underline-offset-4 hover:underline"
          >
            Shipping policy
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-12 text-sm text-[#6B726E]">Loading…</p>
      }
    >
      <TrackOrderForm />
    </Suspense>
  );
}
