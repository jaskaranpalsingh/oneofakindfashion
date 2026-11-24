"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/ui/container";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Checkout error:", error);
  }, [error]);

  return (
    <section className="bg-[#FAF7F0] py-16">
      <Container className="max-w-xl text-center">
        <h1 className="font-serif text-3xl text-[#003F2D]">
          Checkout could not load
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B726E]">
          Something went wrong while opening checkout. Please try again. Your
          bag is unchanged.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center bg-[#003F2D] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0B513B]"
          >
            Try again
          </button>
          <Link
            href="/cart"
            className="inline-flex h-11 items-center border border-[#E5DFD4] bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003F2D]"
          >
            View bag
          </Link>
        </div>
      </Container>
    </section>
  );
}
