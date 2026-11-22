"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  addCartItem,
  applyCartCoupon,
  fetchCart,
  removeCartCoupon,
  removeCartItem,
  setBuyNowIntent,
  updateCartItem,
  type CartSnapshot,
} from "@/lib/cart";
import { CartDrawer } from "@/components/cart/cart-drawer";

type CartContextValue = {
  cart: CartSnapshot | null;
  cartCount: number;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (input: {
    productId: string;
    variantId: string;
    quantity: number;
  }) => Promise<CartSnapshot>;
  updateItem: (itemId: string, quantity: number) => Promise<CartSnapshot>;
  removeItem: (itemId: string) => Promise<CartSnapshot>;
  applyCoupon: (code: string) => Promise<CartSnapshot>;
  clearCoupon: () => Promise<CartSnapshot>;
  buyNow: (input: {
    productId: string;
    variantId: string;
    quantity: number;
  }) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const next = await fetchCart();
      setCart(next);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (input: {
      productId: string;
      variantId: string;
      quantity: number;
    }) => {
      const next = await addCartItem(input);
      setCart(next);
      setDrawerOpen(true);
      return next;
    },
    []
  );

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    const next = await updateCartItem(itemId, quantity);
    setCart(next);
    return next;
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const next = await removeCartItem(itemId);
    setCart(next);
    return next;
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const next = await applyCartCoupon(code);
    setCart(next);
    return next;
  }, []);

  const clearCoupon = useCallback(async () => {
    const next = await removeCartCoupon();
    setCart(next);
    return next;
  }, []);

  const buyNow = useCallback(
    async (input: {
      productId: string;
      variantId: string;
      quantity: number;
    }) => {
      await setBuyNowIntent(input);
      setDrawerOpen(false);
      router.push("/checkout?mode=buy_now");
    },
    [router]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount: cart?.itemCount ?? 0,
      loading,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refreshCart,
      addToCart,
      updateItem,
      removeItem,
      applyCoupon,
      clearCoupon,
      buyNow,
    }),
    [
      cart,
      loading,
      drawerOpen,
      refreshCart,
      addToCart,
      updateItem,
      removeItem,
      applyCoupon,
      clearCoupon,
      buyNow,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={updateItem}
        onRemoveItem={removeItem}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
