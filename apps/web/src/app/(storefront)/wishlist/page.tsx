"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "@ookf/shared";
import { WishlistItem } from "@/components/commerce/wishlist-item";
import { Container } from "@/components/ui/container";
import { useWishlist } from "@/hooks/use-wishlist";
import { ApiClientError, getApiBaseUrl } from "@/lib/api";

async function fetchWishlistProducts(ids: string[]) {
  if (ids.length === 0) return [] as ProductSummary[];

  const params = new URLSearchParams({
    ids: ids.join(","),
    pageSize: String(Math.min(100, Math.max(ids.length, 1))),
    sort: "newest",
  });

  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/products?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: ProductSummary[] }
    | { success: false; error: { message: string } }
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiClientError(
      payload && "error" in payload
        ? payload.error.message
        : "Unable to load wishlist products",
      response.status
    );
  }

  return payload.data;
}

export default function WishlistPage() {
  const { ids, hydrated } = useWishlist();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idKey = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchWishlistProducts(ids);
        if (cancelled) return;
        const byId = new Map(rows.map((product) => [product.id, product]));
        const ordered = [...ids]
          .reverse()
          .map((id) => byId.get(id))
          .filter((product): product is ProductSummary => Boolean(product));
        setProducts(ordered);
      } catch (err) {
        if (cancelled) return;
        setProducts([]);
        setError(
          err instanceof Error ? err.message : "Unable to load your wishlist"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when id set changes
  }, [hydrated, idKey]);

  const countLabel =
    products.length === 0
      ? null
      : products.length === 1
        ? "1 saved piece"
        : `${products.length} saved pieces`;

  return (
    <section className="bg-[#FAF8F3] py-10 sm:py-14 lg:py-16">
      <Container className="max-w-[1100px]">
        <nav aria-label="Breadcrumb" className="text-[12px] text-[#687170]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-[#003F2D]">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-[#003F2D]" aria-current="page">
              Wishlist
            </li>
          </ol>
        </nav>

        <header className="mt-7 max-w-2xl">
          <h1 className="font-serif text-[2.15rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-5xl">
            Wishlist
          </h1>
          <span className="mt-4 block h-px w-[72px] bg-[#B68A25]" aria-hidden />
          <p className="mt-4 text-sm text-[#687170] sm:text-[15px]">
            {countLabel
              ? `${countLabel} saved in this browser.`
              : "Pieces you save with the heart appear here."}
          </p>
        </header>

        {!hydrated || loading ? (
          <p className="mt-10 text-sm text-[#687170]">Loading…</p>
        ) : null}

        {error ? (
          <p className="mt-8 text-sm text-[#8B3A3A]" role="alert">
            {error}
          </p>
        ) : null}

        {hydrated && !loading && !error && products.length === 0 ? (
          <div className="mt-10 border border-[#E7E2D9] bg-white px-6 py-14 sm:px-10">
            <p className="font-serif text-[1.85rem] leading-snug text-[#003F2D]">
              Your wishlist is empty
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#687170]">
              Tap the heart on any product to save it for later.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-11 items-center bg-[#003F2D] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0B513B]"
            >
              Continue shopping
            </Link>
          </div>
        ) : null}

        {products.length > 0 ? (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#687170]">{countLabel}</p>
              <Link
                href="/shop"
                className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#003F2D] underline-offset-4 transition hover:underline"
              >
                Continue shopping
              </Link>
            </div>
            <ul className="border border-[#E7E2D9] bg-white">
              {products.map((product) => (
                <WishlistItem key={product.id} product={product} />
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
