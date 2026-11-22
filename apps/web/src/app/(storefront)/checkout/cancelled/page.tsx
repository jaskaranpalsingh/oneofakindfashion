"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function CancelledContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  useEffect(() => {
    if (!orderNumber) return;
    void fetch(`${getApiBaseUrl()}/api/v1/checkout/cancel`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    });
  }, [orderNumber]);

  return (
    <section className="py-14 sm:py-20">
      <Container className="max-w-2xl">
        <div className="border border-[#E8E2D2] bg-white p-8">
          <h1 className="font-serif text-4xl text-[#003F2D]">
            Payment cancelled
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F746E]">
            No payment was taken. Your items remain available in your shopping
            bag if this was a cart checkout.
            {orderNumber ? ` Reference: ${orderNumber}.` : ""}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/checkout"
              className={cn(buttonVariants({ variant: "primary" }))}
            >
              Return to checkout
            </Link>
            <Link
              href="/cart"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              View cart
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function CheckoutCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}
