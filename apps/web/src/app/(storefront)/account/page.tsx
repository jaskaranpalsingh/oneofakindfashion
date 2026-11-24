"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { getApiBaseUrl } from "@/lib/api";

type Overview = {
  user: { firstName: string; lastName: string; email: string };
  stats: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    wishlistCount: number;
  };
  defaultShippingAddress: {
    line1: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
  recentOrders: Array<{
    orderNumber: string;
    createdAt: string;
    totalCents: number;
    paymentStatus: string;
    fulfillmentStatus: string;
  }>;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default function AccountOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/account/overview`,
          { credentials: "include" }
        );
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Failed to load account");
        }
        setData(json.data as Overview);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load account");
      }
    })();
  }, []);

  return (
    <AccountShell
      title={data ? `Welcome, ${data.user.firstName}` : "Account Overview"}
      description="Your orders, wishlist and saved details in one place."
    >
      {error ? (
        <p className="border border-burgundy/20 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
          {error}
        </p>
      ) : null}

      {!data && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse border border-[#E5DFD4] bg-white"
            />
          ))}
        </div>
      ) : null}

      {data ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total orders", data.stats.totalOrders],
              ["Active orders", data.stats.activeOrders],
              ["Delivered", data.stats.deliveredOrders],
              ["Wishlist items", data.stats.wishlistCount],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="border border-[#E5DFD4] bg-white p-4 motion-safe:animate-[fadeIn_250ms_ease-out]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[#6B6458]">
                  {label}
                </p>
                <p className="mt-2 font-serif text-3xl text-[#003F2D]">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-[#E5DFD4] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#003F2D]">
                  Recent orders
                </h2>
                <Link
                  href="/account/orders"
                  className="text-xs uppercase tracking-[0.12em] text-[#C49A36] hover:underline"
                >
                  View all
                </Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="mt-4 text-sm text-[#6B6458]">No orders yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[#E5DFD4]">
                  {data.recentOrders.map((order) => (
                    <li
                      key={order.orderNumber}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <Link
                          href={`/order-confirmation/${order.orderNumber}`}
                          className="font-medium text-[#003F2D] hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-[#6B6458]">
                          {new Date(order.createdAt).toLocaleDateString("en-CA")} ·{" "}
                          {order.fulfillmentStatus.replaceAll("_", " ")}
                        </p>
                      </div>
                      <p className="text-[#003F2D]">
                        {money(order.totalCents)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-[#E5DFD4] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#003F2D]">
                  Default shipping address
                </h2>
                <Link
                  href="/account/addresses"
                  className="text-xs uppercase tracking-[0.12em] text-[#C49A36] hover:underline"
                >
                  Manage
                </Link>
              </div>
              {data.defaultShippingAddress ? (
                <p className="mt-4 text-sm leading-relaxed text-[#4A453C]">
                  {data.defaultShippingAddress.line1}
                  <br />
                  {data.defaultShippingAddress.city},{" "}
                  {data.defaultShippingAddress.province}{" "}
                  {data.defaultShippingAddress.postalCode}
                </p>
              ) : (
                <p className="mt-4 text-sm text-[#6B6458]">
                  No saved address yet.{" "}
                  <Link href="/account/addresses" className="text-[#003F2D] underline">
                    Add one
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AccountShell>
  );
}
