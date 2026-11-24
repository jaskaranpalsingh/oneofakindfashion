import {
  clearAllWishlistClientState,
  dispatchAuthChange,
} from "@/lib/wishlist-store";

/** Wipe private client caches after logout (before redirect). */
export function clearCustomerClientStateOnLogout() {
  clearAllWishlistClientState();
  dispatchAuthChange({ userId: null, reason: "logout" });
}
