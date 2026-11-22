import { getApiBaseUrl } from "@/lib/api";

const GUEST_KEY = "ookf_guest_id";

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  sku: string;
  options: {
    size?: string;
    colour?: string;
    material?: string;
    other?: string;
  };
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
  maxQuantity: number;
};

export type CartSnapshot = {
  id: string;
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
  discountCents?: number;
  totalCents?: number;
  currency: "CAD";
  couponCode: string | null;
  guestId?: string | null;
};

function readGuestId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

function writeGuestId(guestId: string | null | undefined) {
  if (typeof window === "undefined" || !guestId) return;
  try {
    window.localStorage.setItem(GUEST_KEY, guestId);
  } catch {
    // ignore storage failures
  }
}

function cartHeaders(extra?: HeadersInit): HeadersInit {
  const guestId = readGuestId();
  return {
    "Content-Type": "application/json",
    ...(guestId ? { "X-Guest-Id": guestId } : {}),
    ...(extra ?? {}),
  };
}

async function parseCartResponse(response: Response): Promise<CartSnapshot> {
  const headerGuest = response.headers.get("X-Guest-Id");
  if (headerGuest) writeGuestId(headerGuest);

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload?.error?.message ?? "Cart request failed");
  }

  const data = payload.data as CartSnapshot;
  if (data.guestId) writeGuestId(data.guestId);
  return data;
}

export async function fetchCart(): Promise<CartSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/cart`, {
    credentials: "include",
    headers: cartHeaders(),
  });
  return parseCartResponse(response);
}

export async function addCartItem(input: {
  productId: string;
  variantId: string;
  quantity: number;
}): Promise<CartSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/cart/items`, {
    method: "POST",
    credentials: "include",
    headers: cartHeaders(),
    body: JSON.stringify(input),
  });
  return parseCartResponse(response);
}

export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartSnapshot> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/cart/items/${itemId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: cartHeaders(),
      body: JSON.stringify({ quantity }),
    }
  );
  return parseCartResponse(response);
}

export async function removeCartItem(itemId: string): Promise<CartSnapshot> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/cart/items/${itemId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: cartHeaders(),
    }
  );
  return parseCartResponse(response);
}

export async function applyCartCoupon(code: string): Promise<CartSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/cart/coupon`, {
    method: "POST",
    credentials: "include",
    headers: cartHeaders(),
    body: JSON.stringify({ code }),
  });
  return parseCartResponse(response);
}

export async function removeCartCoupon(): Promise<CartSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/cart/coupon`, {
    method: "DELETE",
    credentials: "include",
    headers: cartHeaders(),
  });
  return parseCartResponse(response);
}

export async function setBuyNowIntent(input: {
  productId: string;
  variantId: string;
  quantity: number;
}): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/checkout/buy-now`, {
    method: "POST",
    credentials: "include",
    headers: cartHeaders(),
    body: JSON.stringify(input),
  });
  const headerGuest = response.headers.get("X-Guest-Id");
  if (headerGuest) writeGuestId(headerGuest);
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload?.error?.message ?? "Unable to start Buy Now");
  }
}

export function formatVariantOptions(
  options: CartLine["options"] | Record<string, string | undefined>
): string {
  return Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `${label}: ${value}`;
    })
    .join(" | ");
}
