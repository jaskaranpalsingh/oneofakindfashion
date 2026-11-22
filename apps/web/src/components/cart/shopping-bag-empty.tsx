"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function ShoppingBagEmpty() {
  return (
    <div className="mt-10 border border-[#E7E2D9] bg-white px-6 py-14 text-center">
      <ShoppingBag
        className="mx-auto h-10 w-10 text-[#B68A25]"
        strokeWidth={1.25}
        aria-hidden
      />
      <h2 className="mt-5 font-serif text-3xl text-[#003F2D]">
        Your shopping bag is empty.
      </h2>
      <p className="mt-3 text-sm text-[#687170]">
        Explore our collection to find something special.
      </p>
      <Link
        href="/shop"
        className="mt-7 inline-flex h-12 items-center justify-center bg-[#003F2D] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B513B]"
      >
        Continue shopping
      </Link>
    </div>
  );
}
