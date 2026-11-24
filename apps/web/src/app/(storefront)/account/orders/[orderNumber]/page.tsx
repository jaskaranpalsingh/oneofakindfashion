"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCad } from "@ookf/shared";
import { AccountShell } from "@/components/account/account-shell";
import { OrderTimeline } from "@/components/account/order-timeline";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderDetail = {
  orderNumber: string;
  createdAt: string;
  paidAt?: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingMethod?: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippingCarrier?: string | null;
  totals: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    currency: string;
  };
  items: Array<{
    productName: string;
    productSlug?: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    imageUrl?: string | null;
    options?: Record<string, string | undefined>;
  }>;
  shippingAddress?: Record<string, string | undefined> | null;
  billingAddress?: Record<string, string | undefined> | null;
  events?: Array<{ type: string; message: string; createdAt?: string | null }>;
};

export default function AccountOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.orderNumber) return;
    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/orders/mine/${encodeURIComponent(params.orderNumber)}`,
          { credentials: "include" }
        );
        const json = await response.json();
        if (response.status === 401) {
          setError("Sign in to view this order.");
          return;
        }
        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Order not found");
        }
        setOrder(json.data as OrderDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load order");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.orderNumber]);

  return (
    <AccountShell
      title={order ? `Order ${order.orderNumber}` : "Order details"}
      description="Payment status, fulfillment progress, and item snapshots for this order."
    >
      <div className="mb-4">
        <Link
          href="/account/orders"
          className="text-sm text-[#003F2D] hover:underline"
        >
          ← Back to My Orders
        </Link>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse border border-[#E5DFD4] bg-white" />
      ) : null}

      {error ? (
        <div className="space-y-4">
          <p className="border border-[#E5DFD4] bg-white px-4 py-3 text-sm text-[#003F2D]">
            {error}
          </p>
          <Link href="/account/orders" className={cn(buttonVariants())}>
            View orders
          </Link>
        </div>
      ) : null}

      {order ? (
        <div className="space-y-6">
          <div className="grid gap-4 border border-[#E5DFD4] bg-white p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#6B6458]">
                Placed
              </p>
              <p className="mt-1 text-sm text-[#003F2D]">
                {new Date(order.createdAt).toLocaleString("en-CA")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#6B6458]">
                Payment
              </p>
              <p className="mt-1 text-sm capitalize text-[#003F2D]">
                {order.paymentStatus.replaceAll("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#6B6458]">
                Total
              </p>
              <p className="mt-1 font-serif text-xl text-[#003F2D]">
                {formatCad(order.totals.totalCents)}
              </p>
            </div>
          </div>

          <div className="border border-[#E5DFD4] bg-white p-5">
            <h2 className="font-serif text-xl text-[#003F2D]">Progress</h2>
            <div className="mt-4">
              <OrderTimeline
                fulfillmentStatus={order.fulfillmentStatus}
                shippingMethod={order.shippingMethod}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
                shippingCarrier={order.shippingCarrier}
                events={order.events}
              />
            </div>
          </div>

          <div className="border border-[#E5DFD4] bg-white p-5">
            <h2 className="font-serif text-xl text-[#003F2D]">Items</h2>
            <ul className="mt-4 divide-y divide-[#E5DFD4]">
              {order.items.map((item, index) => (
                <li
                  key={`${item.sku}-${index}`}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-[#FAF7F0]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#003F2D]">
                      {item.productSlug ? (
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="hover:underline"
                        >
                          {item.productName}
                        </Link>
                      ) : (
                        item.productName
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[#6B6458]">
                      Qty {item.quantity}
                      {item.options?.size ? ` · Size ${item.options.size}` : ""}
                      {item.options?.colour
                        ? ` · Colour ${item.options.colour}`
                        : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-[#003F2D]">
                    {formatCad(item.lineTotalCents)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-[#E5DFD4] pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6458]">Subtotal</dt>
                <dd>{formatCad(order.totals.subtotalCents)}</dd>
              </div>
              {order.totals.discountCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[#6B6458]">Discount</dt>
                  <dd>-{formatCad(order.totals.discountCents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6458]">Shipping</dt>
                <dd>{formatCad(order.totals.shippingCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6B6458]">Tax</dt>
                <dd>{formatCad(order.totals.taxCents)}</dd>
              </div>
              <div className="flex justify-between gap-3 font-medium text-[#003F2D]">
                <dt>Total</dt>
                <dd>{formatCad(order.totals.totalCents)}</dd>
              </div>
            </dl>
          </div>

          {order.shippingAddress ? (
            <div className="border border-[#E5DFD4] bg-white p-5 text-sm">
              <h2 className="font-serif text-xl text-[#003F2D]">
                Shipping address
              </h2>
              <p className="mt-3 text-[#4A453C]">
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? (
                  <>
                    <br />
                    {order.shippingAddress.line2}
                  </>
                ) : null}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
                {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Track order
            </Link>
            <Link
              href="/contact"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Contact support
            </Link>
          </div>
        </div>
      ) : null}
    </AccountShell>
  );
}
