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

export type CheckoutQuoteLine = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  options: CartLine["options"];
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
  maxQuantity?: number;
};

export type CheckoutQuoteResult = {
  itemCount: number;
  items?: CheckoutQuoteLine[];
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  shippingCents: number;
  taxCents: number;
  taxBreakdown: Array<{ name: string; rateBps: number; amountCents: number }>;
  totalCents: number;
  currency: "CAD";
  amountUntilFreeCents?: number;
  qualifiesForFreeShipping?: boolean;
  zoneName?: string | null;
  availableMethods?: Array<{
    code: string;
    name: string;
    description: string;
    rateCents: number | null;
    etaLabel: string;
    isPickup: boolean;
    available: boolean;
    qualifiesForFreeShipping: boolean;
    freeShippingApplied: boolean;
  }>;
  shipping: {
    standardCents: number;
    expressCents: number;
    freeShippingMinimumCents: number;
    localPickupEnabled: boolean;
    standardEta?: string;
    expressEta?: string;
    pickupInstructions?: string;
  };
};

export class CheckoutQuoteError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CheckoutQuoteError";
    this.code = code;
  }
}

export async function quoteCheckoutTotals(input: {
  shippingMethod: string;
  province: string;
  postalCode?: string;
  mode?: "cart" | "buy_now";
}): Promise<CheckoutQuoteResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/checkout/quote`, {
    method: "POST",
    credentials: "include",
    headers: cartHeaders(),
    body: JSON.stringify(input),
  });
  const headerGuest = response.headers.get("X-Guest-Id");
  if (headerGuest) writeGuestId(headerGuest);
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new CheckoutQuoteError(
      payload?.error?.code ?? "QUOTE_FAILED",
      payload?.error?.message ?? "Unable to calculate totals"
    );
  }
  return payload.data as CheckoutQuoteResult;
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
