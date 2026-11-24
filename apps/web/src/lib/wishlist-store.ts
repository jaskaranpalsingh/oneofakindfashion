/**
 * Client wishlist store with strict guest vs authenticated isolation.
 * Authenticated wishlists are keyed by MongoDB user id; MongoDB is source of truth.
 */

import { getApiBaseUrl } from "@/lib/api";

export const WISHLIST_GUEST_KEY = "ookf_wishlist:guest";
export const WISHLIST_LEGACY_KEY = "ookf_wishlist";
export const WISHLIST_OWNER_KEY = "ookf_wishlist:owner";
export const AUTH_CHANGE_EVENT = "ookf:auth-change";

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedIds: string[] = [];
let ownerId: string | null = null; // null = guest
let syncGeneration = 0;

function userKey(userId: string) {
  return `ookf_wishlist:user:${userId}`;
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(parsed.filter((id): id is string => typeof id === "string")),
    ];
  } catch {
    return [];
  }
}

function readStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  return parseIds(window.localStorage.getItem(key));
}

function writeStorage(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  if (ids.length === 0) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(ids));
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeWishlist(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWishlistSnapshot() {
  return cachedIds;
}

const SERVER_EMPTY: string[] = [];

export function getWishlistServerSnapshot() {
  return SERVER_EMPTY;
}

export function getWishlistOwnerId() {
  return ownerId;
}

function setCache(ids: string[], nextOwner: string | null) {
  cachedIds = ids;
  ownerId = nextOwner;
  if (typeof window !== "undefined") {
    if (nextOwner) {
      window.localStorage.setItem(WISHLIST_OWNER_KEY, nextOwner);
      writeStorage(userKey(nextOwner), ids);
    } else {
      window.localStorage.removeItem(WISHLIST_OWNER_KEY);
      writeStorage(WISHLIST_GUEST_KEY, ids);
    }
  }
  emit();
}

/** Migrate legacy shared key into guest-only storage once. */
function migrateLegacyKey() {
  if (typeof window === "undefined") return;
  const legacy = readStorage(WISHLIST_LEGACY_KEY);
  if (legacy.length > 0) {
    const guest = readStorage(WISHLIST_GUEST_KEY);
    writeStorage(WISHLIST_GUEST_KEY, [...new Set([...guest, ...legacy])]);
  }
  window.localStorage.removeItem(WISHLIST_LEGACY_KEY);
}

export function readGuestWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  migrateLegacyKey();
  return readStorage(WISHLIST_GUEST_KEY);
}

export function clearGuestWishlist() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WISHLIST_GUEST_KEY);
  window.localStorage.removeItem(WISHLIST_LEGACY_KEY);
  if (!ownerId) {
    cachedIds = [];
    emit();
  }
}

/** Clear authenticated user caches without touching the guest wishlist. */
export function clearAuthenticatedWishlistCaches() {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (
      key &&
      (key === WISHLIST_OWNER_KEY || key.startsWith("ookf_wishlist:user:"))
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  cachedIds = [];
  ownerId = null;
  syncGeneration += 1;
  emit();
}

/** Clear all client wishlist caches (logout). */
export function clearAllWishlistClientState() {
  if (typeof window === "undefined") return;
  clearAuthenticatedWishlistCaches();
  window.localStorage.removeItem(WISHLIST_GUEST_KEY);
  window.localStorage.removeItem(WISHLIST_LEGACY_KEY);
  cachedIds = [];
  ownerId = null;
  emit();
}

export function dispatchAuthChange(detail: {
  userId: string | null;
  reason: "login" | "logout" | "register" | "hydrate";
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail }));
}

/**
 * Load wishlist for the current auth principal.
 * Logged-in: server replaces client state (never merge another user's local cache).
 * Guest: guest localStorage only.
 */
export async function hydrateWishlistFromAuth(): Promise<string[]> {
  migrateLegacyKey();
  const generation = ++syncGeneration;

  try {
    const meResponse = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-store" },
    });
    const meJson = await meResponse.json().catch(() => null);
    if (generation !== syncGeneration) return cachedIds;

    const userId =
      meResponse.ok && meJson?.success && meJson.data?.user?.id
        ? (meJson.data.user.id as string)
        : null;

    if (!userId) {
      const guestIds = readStorage(WISHLIST_GUEST_KEY);
      setCache(guestIds, null);
      return guestIds;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/v1/account/wishlist`, {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-store" },
    });
    if (generation !== syncGeneration) return cachedIds;

    if (response.status === 401) {
      const guestIds = readStorage(WISHLIST_GUEST_KEY);
      setCache(guestIds, null);
      return guestIds;
    }

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      // Keep empty for this user — never fall back to another account's cache.
      setCache([], userId);
      return [];
    }

    const serverIds = Array.isArray(json.data?.ids)
      ? (json.data.ids as string[])
      : [];
    setCache(serverIds, userId);
    return serverIds;
  } catch {
    if (generation !== syncGeneration) return cachedIds;
    if (!ownerId) {
      const guestIds = readStorage(WISHLIST_GUEST_KEY);
      setCache(guestIds, null);
      return guestIds;
    }
    return cachedIds;
  }
}

/**
 * After login/register: merge guest wishlist into the authenticated account once,
 * then clear guest storage and load the server wishlist for that user only.
 */
export async function mergeGuestWishlistAfterAuth(
  userId: string
): Promise<string[]> {
  const guestIds = readGuestWishlistIds();
  const generation = ++syncGeneration;

  if (guestIds.length > 0) {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/account/wishlist/sync`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ productIds: guestIds }),
      });
    } catch {
      // Guest merge is best-effort; server wishlist still loads below.
    }
  }

  clearGuestWishlist();
  window.localStorage.removeItem(WISHLIST_LEGACY_KEY);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/account/wishlist`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });
  if (generation !== syncGeneration) return cachedIds;

  const json = await response.json().catch(() => null);
  const serverIds =
    response.ok && json?.success && Array.isArray(json.data?.ids)
      ? (json.data.ids as string[])
      : [];
  setCache(serverIds, userId);
  return serverIds;
}

export async function toggleWishlistProduct(productId: string) {
  const current = [...cachedIds];
  const removing = current.includes(productId);
  const next = removing
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  const previousOwner = ownerId;
  setCache(next, previousOwner);

  // Guests stay local-only.
  if (!previousOwner) {
    return { ids: next, removing };
  }

  try {
    const response = await fetch(
      removing
        ? `${getApiBaseUrl()}/api/v1/account/wishlist/${productId}`
        : `${getApiBaseUrl()}/api/v1/account/wishlist`,
      {
        method: removing ? "DELETE" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          ...(removing
            ? { "Cache-Control": "no-store" }
            : {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              }),
        },
        body: removing ? undefined : JSON.stringify({ productId }),
      }
    );

    if (response.status === 401) {
      // Session expired — keep optimistic guest-like state but drop owner.
      setCache(next, null);
      writeStorage(WISHLIST_GUEST_KEY, next);
      return { ids: next, removing };
    }

    if (!response.ok) {
      setCache(current, previousOwner);
      throw new Error("Wishlist update failed");
    }

    const json = await response.json().catch(() => null);
    if (json?.success && Array.isArray(json.data?.ids)) {
      setCache(json.data.ids as string[], previousOwner);
      return { ids: json.data.ids as string[], removing };
    }
  } catch (error) {
    setCache(current, previousOwner);
    throw error;
  }

  return { ids: next, removing };
}
