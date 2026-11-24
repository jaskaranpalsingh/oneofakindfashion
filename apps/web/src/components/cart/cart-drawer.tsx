"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CartDrawerFooter } from "@/components/cart/cart-drawer-footer";
import { CartDrawerHeader } from "@/components/cart/cart-drawer-header";
import { CartDrawerItem } from "@/components/cart/cart-drawer-item";
import { EmptyCart } from "@/components/cart/empty-cart";
import type { CartSnapshot } from "@/lib/cart";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CartDrawer({
  open,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartSnapshot | null;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<unknown>;
  onRemoveItem: (itemId: string) => Promise<unknown>;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const items = cart?.items ?? [];
  const canCheckout =
    items.length > 0 && items.every((item) => item.maxQuantity >= item.quantity);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  async function handleQty(itemId: string, quantity: number) {
    const current = cart?.items.find((item) => item.id === itemId);
    if (!current || current.quantity === quantity) return;
    setPendingId(itemId);
    setError(null);
    try {
      await onUpdateQuantity(itemId, quantity);
      setLiveMessage(`Quantity updated to ${quantity}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update quantity");
      setLiveMessage("Quantity update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setPendingId(itemId);
    setError(null);
    try {
      await onRemoveItem(itemId);
      setLiveMessage("Item removed from cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove item");
      setLiveMessage("Unable to remove item");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90]">
          <motion.button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 bg-[#252A27]/40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />

          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-[420px] flex-col border-l border-[#E8E2D6] bg-[#FFFCF7]"
            initial={reduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <span id={titleId} className="sr-only">
              Shopping bag
            </span>

            <CartDrawerHeader
              itemCount={cart?.itemCount ?? 0}
              onClose={onClose}
            />
            <div
              aria-hidden
              className="mx-5 h-px bg-gradient-to-r from-[#B68A25]/70 via-[#D4AF37]/35 to-transparent sm:mx-6"
            />

            <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
              {items.length === 0 ? (
                <EmptyCart onContinue={onClose} />
              ) : (
                <ul className="pb-2">
                  {items.map((item) => (
                    <CartDrawerItem
                      key={item.id}
                      item={item}
                      pending={pendingId === item.id}
                      onClose={onClose}
                      onUpdateQuantity={(quantity) =>
                        void handleQty(item.id, quantity)
                      }
                      onRemove={() => void handleRemove(item.id)}
                    />
                  ))}
                </ul>
              )}

              {error ? (
                <p
                  className="mb-4 border border-[#8B3A3A]/25 bg-[#FFF5F5] px-3 py-2 text-sm text-[#8B3A3A]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            {items.length > 0 ? (
              <CartDrawerFooter
                subtotalCents={cart?.subtotalCents ?? 0}
                discountCents={cart?.discountCents ?? 0}
                couponCode={cart?.couponCode ?? null}
                canCheckout={canCheckout}
                onContinueShopping={onClose}
                onNavigate={onClose}
              />
            ) : null}

            <p className="sr-only" aria-live="polite">
              {liveMessage}
            </p>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
