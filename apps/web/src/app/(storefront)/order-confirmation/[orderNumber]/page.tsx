"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatCad } from "@ookf/shared";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderView = {
  orderNumber: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber?: string | null;
  totals: {
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    discountCents: number;
    totalCents: number;
  };
  items: Array<{
    productName: string;
    quantity: number;
    sku: string;
    lineTotalCents: number;
  }>;
  shippingMethod: string;
  shippingAddress?: {
    line1?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  createdAt?: string;
};

function OrderConfirmationContent() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const orderNumber = params.orderNumber;
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const [order, setOrder] = useState<OrderView | null>(null);
  const [email, setEmail] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [needsLookup, setNeedsLookup] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/orders/mine/${encodeURIComponent(orderNumber)}`,
          { credentials: "include" }
        );
        const json = await response.json();
        if (response.ok && json.success) {
          setOrder(json.data as OrderView);
          return;
        }

        if (emailFromQuery) {
          const lookupResponse = await fetch(
            `${getApiBaseUrl()}/api/v1/orders/lookup`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderNumber,
                email: emailFromQuery,
              }),
            }
          );
          const lookupJson = await lookupResponse.json();
          if (lookupResponse.ok && lookupJson.success) {
            setOrder(lookupJson.data as OrderView);
            return;
          }
        }

        setNeedsLookup(true);
      } catch {
        setNeedsLookup(true);
      }
    })();
  }, [orderNumber, emailFromQuery]);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/orders/lookup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Order not found");
      }
      setOrder(json.data as OrderView);
      setNeedsLookup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-4xl text-[#003F2D]">Order confirmation</h1>
        <p className="mt-2 text-sm text-[#6F746E]">Order {orderNumber}</p>

        {needsLookup && !order ? (
          <form onSubmit={lookup} className="mt-8 space-y-4 border border-[#E8E2D2] bg-white p-6">
            <p className="text-sm text-[#6F746E]">
              Enter the email used at checkout to view this order securely.
            </p>
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Looking up…" : "View order"}
            </Button>
          </form>
        ) : null}

        {order ? (
          <div className="mt-8 border border-[#E8E2D2] bg-white p-6">
            <p className="text-sm capitalize text-[#6F746E]">
              Payment: {order.paymentStatus.replaceAll("_", " ")} · Fulfillment:{" "}
              {order.fulfillmentStatus.replaceAll("_", " ")}
            </p>
            {order.trackingNumber ? (
              <p className="mt-2 text-sm text-[#003F2D]">
                Tracking: {order.trackingNumber}
              </p>
            ) : null}
            <ul className="mt-6 space-y-3">
              {order.items.map((item, index) => (
                <li key={`${item.sku}-${index}`} className="flex justify-between text-sm">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>{formatCad(item.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-[#E8E2D2] pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCad(order.totals.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCad(order.totals.shippingCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCad(order.totals.taxCents)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#003F2D]">
                <span>Total</span>
                <span>{formatCad(order.totals.totalCents)}</span>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/account/orders" className={cn(buttonVariants())}>
                My orders
              </Link>
              <Link
                href="/shop"
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                Continue shopping
              </Link>
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6F746E]">
          Loading order…
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
