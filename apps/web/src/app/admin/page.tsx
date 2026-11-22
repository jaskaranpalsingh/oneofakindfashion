"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCad } from "@ookf/shared";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw } from "lucide-react";
import {
  adminFetch,
  type AdminOrderRow,
  type DashboardSummary,
  type RevenuePoint,
  type RevenueRange,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: Array<{ value: RevenueRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "ytd", label: "This year" },
];

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl text-green">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse border border-border bg-white p-5">
      <div className="h-3 w-20 rounded bg-ivory" />
      <div className="mt-4 h-8 w-28 rounded bg-ivory" />
      <div className="mt-2 h-3 w-24 rounded bg-ivory" />
    </div>
  );
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<RevenueRange>("30d");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["admin", "dashboard", "summary"],
    queryFn: () =>
      adminFetch<DashboardSummary>("/api/v1/admin/dashboard/summary"),
    refetchInterval: 30_000,
  });

  const revenueQuery = useQuery({
    queryKey: ["admin", "dashboard", "revenue", range],
    queryFn: () =>
      adminFetch<RevenuePoint[]>(
        `/api/v1/admin/dashboard/revenue?range=${range}`
      ),
    refetchInterval: 30_000,
  });

  const latestOrdersQuery = useQuery({
    queryKey: ["admin", "orders", "latest"],
    queryFn: () =>
      adminFetch<AdminOrderRow[]>("/api/v1/admin/orders?limit=10"),
    refetchInterval: 30_000,
  });

  const summary = summaryQuery.data;
  const chartData = useMemo(
    () =>
      (revenueQuery.data ?? []).map((point) => ({
        ...point,
        revenue: point.revenueCents / 100,
      })),
    [revenueQuery.data]
  );
  const hasPaidRevenue = chartData.some((point) => point.revenueCents > 0);

  async function refreshAll() {
    const results = await Promise.all([
      summaryQuery.refetch(),
      revenueQuery.refetch(),
      latestOrdersQuery.refetch(),
    ]);
    if (results.every((result) => result.isSuccess)) {
      setLastRefreshedAt(new Date());
    }
  }

  const failed =
    summaryQuery.isError || revenueQuery.isError || latestOrdersQuery.isError;
  const errorMessage =
    (summaryQuery.error as Error | null)?.message ||
    (revenueQuery.error as Error | null)?.message ||
    (latestOrdersQuery.error as Error | null)?.message ||
    "Unable to load dashboard data.";
  const refreshing =
    summaryQuery.isFetching ||
    revenueQuery.isFetching ||
    latestOrdersQuery.isFetching;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-green">Dashboard</h1>
          <div className="gold-rule mt-3" />
          <p className="mt-3 text-sm text-muted">
            Live metrics from MongoDB · timezone{" "}
            {summary?.timezone ?? "America/Edmonton"}
            {lastRefreshedAt ? (
              <>
                {" "}
                · refreshed{" "}
                {lastRefreshedAt.toLocaleTimeString("en-CA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green hover:border-gold disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {failed ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{errorMessage}</p>
          <p className="mt-1 text-xs">
            Ensure the API is running (`pnpm dev:api` or `npm run dev:api`) and
            you are signed in as admin. Zeros only appear after a successful
            response from an empty dataset.
          </p>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryQuery.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : summary ? (
          <>
            <KpiCard
              label="Revenue"
              value={formatCad(summary.revenue.netSalesCents)}
              hint={`${summary.revenue.paidOrderCount} paid · ${formatCad(summary.revenue.grossSalesCents)} gross`}
            />
            <KpiCard
              label="Orders"
              value={String(summary.orders.total)}
              hint={`${summary.orders.awaitingFulfillment} awaiting fulfillment`}
            />
            <KpiCard
              label="Customers"
              value={String(summary.customers.total)}
              hint="Registered customer accounts"
            />
            <KpiCard
              label="Products"
              value={String(summary.products.total)}
              hint={`${summary.products.published} published · ${summary.products.draft} draft`}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary ? (
          <>
            <KpiCard
              label="Today's revenue"
              value={formatCad(summary.today.revenueCents)}
              hint={`${summary.today.paidOrders} paid today`}
            />
            <KpiCard
              label="Today's orders"
              value={String(summary.orders.today)}
              hint={`${summary.orders.pendingPayment} pending payment`}
            />
            <div className="border border-border bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Inventory alerts
              </p>
              <p className="mt-3 font-serif text-3xl text-green">
                {summary.products.lowStock} / {summary.products.outOfStock}
              </p>
              <p className="mt-1 text-xs text-muted">
                Low stock / out of stock products
              </p>
              <Link
                href="/admin/inventory"
                className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-green hover:text-gold-dark"
              >
                View inventory
              </Link>
            </div>
          </>
        ) : summaryQuery.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="border border-border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-green">
              Revenue ({RANGE_OPTIONS.find((option) => option.value === range)?.label})
            </h2>
            <div className="flex flex-wrap gap-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={cn(
                    "border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    range === option.value
                      ? "border-green bg-green text-white"
                      : "border-border bg-white text-muted hover:border-gold"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-64">
            {revenueQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                Loading chart…
              </div>
            ) : !hasPaidRevenue ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                No paid orders in this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#003F2D" stopOpacity={0.35} />
                      <stop
                        offset="100%"
                        stopColor="#003F2D"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const orders = Number(
                        (item?.payload as { orders?: number } | undefined)
                          ?.orders ?? 0
                      );
                      return [
                        `${formatCad(Math.round(Number(value ?? 0) * 100))} · ${orders} paid`,
                        "Revenue",
                      ];
                    }}
                    labelFormatter={(label) => `Date ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#003F2D"
                    fill="url(#revFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border border-border bg-white p-5">
          <h2 className="font-serif text-2xl text-green">Sales snapshot</h2>
          {summary ? (
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-border/70 pb-2">
                <dt className="text-muted">Gross paid sales</dt>
                <dd className="font-medium text-green">
                  {formatCad(summary.revenue.grossSalesCents)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border/70 pb-2">
                <dt className="text-muted">Discounts</dt>
                <dd>{formatCad(summary.revenue.discountCents)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border/70 pb-2">
                <dt className="text-muted">Refunds</dt>
                <dd>{formatCad(summary.revenue.refundCents)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border/70 pb-2">
                <dt className="text-muted">Tax collected</dt>
                <dd>{formatCad(summary.revenue.taxCents)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-border/70 pb-2">
                <dt className="text-muted">Shipping collected</dt>
                <dd>{formatCad(summary.revenue.shippingCents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Net sales</dt>
                <dd className="font-semibold text-green">
                  {formatCad(summary.revenue.netSalesCents)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-sm text-muted">Loading snapshot…</p>
          )}
        </div>
      </div>

      <div className="border border-border bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-serif text-2xl text-green">Latest orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-green hover:text-gold-dark"
          >
            View all
          </Link>
        </div>
        {latestOrdersQuery.isLoading ? (
          <p className="px-5 py-8 text-sm text-muted">Loading orders…</p>
        ) : (latestOrdersQuery.data?.length ?? 0) === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {latestOrdersQuery.data?.map((order) => (
                  <tr key={order.id} className="border-t border-border/70">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-muted">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">{order.itemCount}</td>
                    <td className="px-4 py-3">{formatCad(order.totalCents)}</td>
                    <td className="px-4 py-3 capitalize">
                      {order.paymentStatus.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {order.fulfillmentStatus.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-green hover:text-gold-dark"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
