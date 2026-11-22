import { getApiBaseUrl } from "@/lib/api";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/admin/login")
    ) {
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      );
      window.location.assign(`/admin/login?next=${next}`);
    }
    throw new AdminApiError(
      payload?.error?.message ?? "Admin API request failed",
      response.status
    );
  }
  return payload.data as T;
}

export type DashboardSummary = {
  timezone: string;
  currency: "CAD";
  generatedAt?: string;
  revenue: {
    label: string;
    grossSalesCents: number;
    discountCents: number;
    taxCents: number;
    shippingCents: number;
    refundCents: number;
    netSalesCents: number;
    paidOrderCount: number;
    refundedOrderCount: number;
  };
  orders: {
    total: number;
    today: number;
    pendingPayment: number;
    awaitingFulfillment: number;
  };
  today: {
    revenueCents: number;
    paidOrders: number;
  };
  customers: { total: number };
  products: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    lowStock: number;
    outOfStock: number;
  };
};

export type RevenueRange = "7d" | "30d" | "90d" | "ytd";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalCents: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingMethod: string;
  createdAt: string;
};

export type RevenuePoint = {
  date: string;
  revenueCents: number;
  orders: number;
};
