"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import { ShoppingBagEmpty } from "@/components/cart/shopping-bag-empty";
import { ShoppingBagItem } from "@/components/cart/shopping-bag-item";
import { Container } from "@/components/ui/container";

export default function CartPage() {
  const reduceMotion = useReducedMotion();
  const {
    cart,
    loading,
    updateItem,
    removeItem,
    refreshCart,
    applyCoupon,
    clearCoupon,
  } = useCart();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = cart?.items ?? [];
  const canCheckout =
    items.length > 0 && items.every((item) => item.maxQuantity >= item.quantity);
  const discountCents = cart?.discountCents ?? 0;

  async function handleQty(itemId: string, quantity: number) {
    const current = cart?.items.find((item) => item.id === itemId);
    if (!current || current.quantity === quantity) return;
    setPendingId(itemId);
    setError(null);
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update quantity");
      await refreshCart();
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setPendingId(itemId);
    setError(null);
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove item");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="bg-[#FAF8F3] py-10 sm:py-14 lg:py-16">
      <Container className="max-w-[1440px]">
        <motion.nav
          aria-label="Breadcrumb"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="text-[12px] text-[#687170]"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-[#003F2D]">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-[#003F2D]" aria-current="page">
              Shopping Bag
            </li>
          </ol>
        </motion.nav>

        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 max-w-2xl"
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#B68A25]">
            Bag
          </p>
          <h1 className="mt-3 font-serif text-[2.15rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-5xl lg:text-[3.4rem]">
            Shopping Bag
          </h1>
          <span className="mt-4 block h-px w-[72px] bg-[#B68A25]" aria-hidden />
          <p className="mt-4 text-sm text-[#687170] sm:text-[15px]">
            Review your selections before secure checkout.
          </p>
        </motion.header>

        {loading ? (
          <p className="mt-10 text-sm text-[#687170]">Loading cart…</p>
        ) : null}

        {error ? (
          <p
            className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!loading && items.length === 0 ? <ShoppingBagEmpty /> : null}

        {!loading && items.length > 0 ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-8 xl:gap-10">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ul className="border border-[#E7E2D9] bg-white">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <ShoppingBagItem
                      key={item.id}
                      item={item}
                      pending={pendingId === item.id}
                      onUpdateQuantity={(quantity) =>
                        void handleQty(item.id, quantity)
                      }
                      onRemove={() => void handleRemove(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-2 text-sm text-[#003F2D] underline-offset-4 transition hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                Continue shopping
              </Link>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <OrderSummary
                subtotalCents={cart?.subtotalCents ?? 0}
                discountCents={discountCents}
                couponCode={cart?.couponCode ?? null}
                canCheckout={canCheckout}
                onApplyCoupon={async (code) => {
                  await applyCoupon(code);
                }}
                onRemoveCoupon={async () => {
                  await clearCoupon();
                }}
              />
            </motion.div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
