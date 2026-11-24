"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  AUTH_CHANGE_EVENT,
  getWishlistServerSnapshot,
  getWishlistSnapshot,
  hydrateWishlistFromAuth,
  subscribeWishlist,
  toggleWishlistProduct,
} from "@/lib/wishlist-store";

const EMPTY_IDS: string[] = [];

export function useWishlist() {
  const ids = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getWishlistServerSnapshot
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateWishlistFromAuth();
      if (!cancelled) setHydrated(true);
    })();

    const onAuthChange = () => {
      void hydrateWishlistFromAuth();
    };
    const onStorage = (event: StorageEvent) => {
      if (
        event.key &&
        (event.key.startsWith("ookf_wishlist") ||
          event.key === "ookf_wishlist:owner")
      ) {
        void hydrateWishlistFromAuth();
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isSaved = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const toggle = useCallback(async (productId: string) => {
    try {
      await toggleWishlistProduct(productId);
    } catch {
      // Optimistic update rolled back inside the store.
    }
  }, []);

  return {
    ids: ids.length === 0 ? EMPTY_IDS : ids,
    hydrated,
    isSaved,
    toggle,
    count: ids.length,
  };
}
