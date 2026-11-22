"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCad } from "@ookf/shared";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type SuccessOrder = {
  orderNumber: string;
  paymentStatus: string;
  fulfillmentStatus: string;
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
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<SuccessOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing payment session.");
      return;
    }

    let cancelled = false;
    let tries = 0;

    async function load() {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/checkout/success?session_id=${encodeURIComponent(sessionId!)}`,
          { credentials: "include" }
        );
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Unable to load order");
        }
        if (cancelled) return;
        const data = json.data as SuccessOrder;
        setOrder(data);
        tries += 1;
        if (data.paymentStatus !== "paid" && tries < 10) {
          window.setTimeout(() => {
            if (!cancelled) void load();
          }, 2000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load order");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const paid = order?.paymentStatus === "paid";

  return (
    <section className="bg-[#F8F5EB]/40 py-14 sm:py-20">
      <Container className="max-w-3xl">
        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {!error && !order ? (
          <p className="text-sm text-[#6F746E]">Confirming your payment…</p>
        ) : null}

        {order ? (
          <div className="border border-[#E8E2D2] bg-white p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C6A24A]">
              ONE OF A KIND FASHION
            </p>
            <h1 className="mt-3 font-serif text-4xl text-[#003F2D]">
              {paid
                ? "Thank you for your order!"
                : "Payment is being confirmed"}
            </h1>
            <p className="mt-3 text-sm text-[#6F746E]">
              {paid
                ? "Your order has been received and payment is verified."
                : "We’re waiting for final Stripe verification. This usually takes a few seconds."}
            </p>

            <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#6F746E]">Order number</dt>
                <dd className="font-medium text-[#003F2D]">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-[#6F746E]">Payment status</dt>
                <dd className="font-medium capitalize text-[#003F2D]">
                  {order.paymentStatus.replaceAll("_", " ")}
                </dd>
              </div>
            </dl>

            <ul className="mt-8 space-y-3 border-t border-[#E8E2D2] pt-6">
              {order.items.map((item, index) => (
                <li key={`${item.sku}-${index}`} className="text-sm">
                  <p className="font-medium text-[#003F2D]">
                    {item.productName} × {item.quantity}
                  </p>
                  <p className="text-[#6F746E]">{formatCad(item.lineTotalCents)}</p>
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/order-confirmation/${order.orderNumber}`}
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "w-full sm:w-auto"
                )}
              >
                View my order
              </Link>
              <Link
                href="/shop"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full sm:w-auto"
                )}
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
