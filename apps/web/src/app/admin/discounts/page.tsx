"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Tags,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatCad } from "@ookf/shared";
import { adminFetch } from "@/lib/admin-api";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minimumOrderCents: number;
  maximumDiscountCents: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  productIds: string[];
  categoryIds: string[];
  status: string;
  archivedAt: string | null;
};

type CouponStats = {
  total: number;
  active: number;
  expired: number;
  scheduled: number;
  disabled: number;
  usageLimitReached: number;
  totalRedemptions: number;
  totalDiscountCents: number;
};

type CategoryOption = { id: string; name: string; slug: string };
type ProductOption = { id: string; name: string };

type FormState = {
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: string;
  minimumOrderCad: string;
  maximumDiscountCad: string;
  startsAt: string;
  endsAt: string;
  noExpiry: boolean;
  usageLimit: string;
  perCustomerLimit: string;
  categoryIds: string[];
  productIds: string[];
  isActive: boolean;
  appliesTo: "all" | "categories" | "products";
};

const emptyForm = (): FormState => ({
  code: "",
  description: "",
  type: "percentage",
  value: "10",
  minimumOrderCad: "0",
  maximumDiscountCad: "",
  startsAt: "",
  endsAt: "",
  noExpiry: true,
  usageLimit: "",
  perCustomerLimit: "",
  categoryIds: [],
  productIds: [],
  isActive: true,
  appliesTo: "all",
});

const STORE_TZ = "America/Edmonton";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function partsInStoreTz(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/** Show an ISO instant as America/Edmonton wall time for datetime-local inputs. */
function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const p = partsInStoreTz(new Date(iso));
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** Parse datetime-local value as America/Edmonton wall time → UTC ISO. */
function fromDatetimeLocal(value: string) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return new Date(value).toISOString();

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  // Guess UTC, then correct by the store-timezone clock skew.
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asLocal = partsInStoreTz(new Date(utcGuess));
  const asUtcMs = Date.UTC(
    asLocal.year,
    asLocal.month - 1,
    asLocal.day,
    asLocal.hour,
    asLocal.minute,
    asLocal.second
  );
  const desiredMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(utcGuess + (desiredMs - asUtcMs)).toISOString();
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-[#003F2D]/10 text-[#003F2D]";
    case "scheduled":
      return "bg-[#C49A36]/15 text-[#8A6A1F]";
    case "expired":
    case "usage_limit_reached":
      return "bg-[#E5DFD4] text-[#6B6458]";
    case "disabled":
    case "archived":
      return "bg-red-50 text-red-800";
    default:
      return "bg-[#FAF7F0] text-[#6B6458]";
  }
}

export default function AdminDiscountsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const couponsQuery = useQuery({
    queryKey: ["admin", "discounts", statusFilter, typeFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search.trim()) params.set("q", search.trim());
      const qs = params.toString();
      return adminFetch<Coupon[]>(
        `/api/v1/admin/discounts${qs ? `?${qs}` : ""}`
      );
    },
  });

  const statsQuery = useQuery({
    queryKey: ["admin", "discounts", "stats"],
    queryFn: () => adminFetch<CouponStats>("/api/v1/admin/discounts/stats"),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", "discount-form"],
    queryFn: async () => {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/categories?includeHidden=true`,
        { credentials: "include" }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Unable to load categories");
      }
      return (json.data as CategoryOption[]) ?? [];
    },
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products", "discount-form"],
    queryFn: () =>
      adminFetch<{ items: ProductOption[] } | ProductOption[]>(
        "/api/v1/admin/products?pageSize=200"
      ).then((data) =>
        Array.isArray(data) ? data : ((data.items as ProductOption[]) ?? [])
      ),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "discounts"] }),
    ]);
  };

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setError(null);
  }

  function openEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      type: coupon.type,
      value:
        coupon.type === "percentage"
          ? String(coupon.value)
          : (coupon.value / 100).toFixed(2),
      minimumOrderCad: (coupon.minimumOrderCents / 100).toFixed(2),
      maximumDiscountCad: coupon.maximumDiscountCents
        ? (coupon.maximumDiscountCents / 100).toFixed(2)
        : "",
      startsAt: toDatetimeLocal(coupon.startsAt),
      endsAt: toDatetimeLocal(coupon.endsAt),
      noExpiry: !coupon.endsAt,
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      perCustomerLimit: coupon.perCustomerLimit
        ? String(coupon.perCustomerLimit)
        : "",
      categoryIds: coupon.categoryIds ?? [],
      productIds: coupon.productIds ?? [],
      isActive: coupon.isActive,
      appliesTo:
        coupon.productIds?.length > 0
          ? "products"
          : coupon.categoryIds?.length > 0
            ? "categories"
            : "all",
    });
    setFormOpen(true);
    setError(null);
  }

  function buildPayload() {
    const value =
      form.type === "percentage"
        ? Number(form.value)
        : Math.round(Number(form.value) * 100);
    return {
      ...(editingId ? {} : { code: form.code.trim().toUpperCase() }),
      description: form.description.trim(),
      type: form.type,
      value,
      minimumOrderCents: Math.round(Number(form.minimumOrderCad || 0) * 100),
      maximumDiscountCents: form.maximumDiscountCad
        ? Math.round(Number(form.maximumDiscountCad) * 100)
        : null,
      startsAt: form.startsAt ? fromDatetimeLocal(form.startsAt) : null,
      endsAt: form.noExpiry ? null : fromDatetimeLocal(form.endsAt),
      noExpiry: form.noExpiry,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerLimit: form.perCustomerLimit
        ? Number(form.perCustomerLimit)
        : null,
      categoryIds: form.appliesTo === "categories" ? form.categoryIds : [],
      productIds: form.appliesTo === "products" ? form.productIds : [],
      isActive: form.isActive,
    };
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = buildPayload();
      if (editingId) {
        return adminFetch(`/api/v1/admin/discounts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return adminFetch("/api/v1/admin/discounts", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      setMessage(editingId ? "Coupon updated" : "Coupon created");
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (coupon: Coupon) =>
      adminFetch(`/api/v1/admin/discounts/${coupon.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !coupon.isActive }),
      }),
    onSuccess: async () => {
      setMessage("Coupon status updated");
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/v1/admin/discounts/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: async () => {
      setMessage("Coupon duplicated (disabled until you enable it)");
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/v1/admin/discounts/${id}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: async () => {
      setArchiveTarget(null);
      setMessage("Coupon archived. Past orders keep their discount snapshots.");
      await invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const stats = statsQuery.data;
  const coupons = couponsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const summaryCards = useMemo(
    () => [
      ["Total coupons", stats?.total ?? 0],
      ["Active", stats?.active ?? 0],
      ["Expired", stats?.expired ?? 0],
      ["Scheduled", stats?.scheduled ?? 0],
      ["Redemptions", stats?.totalRedemptions ?? 0],
      ["Discounts given", formatCad(stats?.totalDiscountCents ?? 0)],
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink">Discounts</h1>
          <p className="mt-1 text-sm text-muted">
            Coupons validated server-side at cart and checkout. Dates use your
            local clock (store timezone America/Edmonton).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-green px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition duration-150 hover:bg-green-emerald"
        >
          <Plus className="h-4 w-4" />
          Create coupon
        </button>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green transition duration-150">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map(([label, value]) => (
          <div key={String(label)} className="border border-border bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-serif text-2xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-border bg-white p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code"
            className="h-10 w-full border border-border bg-ivory pl-9 pr-3 text-sm outline-none transition duration-150 focus:border-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 border border-border bg-white px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
          <option value="usage_limit_reached">Usage limit reached</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 border border-border bg-white px-3 text-sm"
        >
          <option value="all">All types</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed CAD</option>
        </select>
      </div>

      {formOpen ? (
        <form
          className="space-y-4 border border-border bg-white p-5"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-ink">
              {editingId ? "Edit coupon" : "Create coupon"}
            </h2>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted"
              onClick={() => setFormOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Coupon code</span>
              <input
                required={!editingId}
                disabled={Boolean(editingId)}
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                className="h-11 w-full border border-border px-3 uppercase outline-none transition duration-150 focus:border-green"
                placeholder="WELCOME10"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Description (optional)</span>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none transition duration-150 focus:border-green"
                placeholder="Spring sale for lehengas"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Discount type</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as FormState["type"],
                  }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
              >
                <option value="percentage">Percentage discount</option>
                <option value="fixed">Fixed amount (CAD)</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Discount value</span>
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                max={form.type === "percentage" ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Minimum order (CAD)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.minimumOrderCad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minimumOrderCad: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">
                Maximum discount (CAD, optional)
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.maximumDiscountCad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maximumDiscountCad: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
                placeholder="e.g. 50.00"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Start date & time</span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startsAt: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Expiry date & time</span>
              <input
                type="datetime-local"
                disabled={form.noExpiry}
                value={form.endsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endsAt: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green disabled:bg-ivory"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">
              <input
                type="checkbox"
                checked={form.noExpiry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, noExpiry: e.target.checked }))
                }
                className="h-4 w-4 accent-green"
              />
              No expiry date
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">Total usage limit</span>
              <input
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, usageLimit: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
                placeholder="Unlimited"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-green">
                Usage limit per customer
              </span>
              <input
                type="number"
                min={1}
                value={form.perCustomerLimit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, perCustomerLimit: e.target.value }))
                }
                className="h-11 w-full border border-border px-3 outline-none focus:border-green"
                placeholder="Unlimited"
              />
            </label>
          </div>

          <div className="space-y-3 border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-green">
              <Tags className="h-4 w-4" />
              Applies to
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["all", "All products"],
                  ["categories", "Selected categories"],
                  ["products", "Specific products"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="appliesTo"
                    checked={form.appliesTo === value}
                    onChange={() => setForm((f) => ({ ...f, appliesTo: value }))}
                    className="accent-green"
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.appliesTo === "categories" ? (
              <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(category.id)}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          categoryIds: e.target.checked
                            ? [...f.categoryIds, category.id]
                            : f.categoryIds.filter((id) => id !== category.id),
                        }));
                      }}
                      className="accent-green"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            ) : null}
            {form.appliesTo === "products" ? (
              <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.productIds.includes(product.id)}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          productIds: e.target.checked
                            ? [...f.productIds, product.id]
                            : f.productIds.filter((id) => id !== product.id),
                        }));
                      }}
                      className="accent-green"
                    />
                    {product.name}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="h-4 w-4 accent-green"
            />
            Active
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 bg-green px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition duration-150 hover:bg-green-emerald disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {editingId ? "Save changes" : "Create coupon"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition duration-150 hover:bg-ivory"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Coupon code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Used / Limit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-medium tracking-wide">
                  {coupon.code}
                </td>
                <td className="px-4 py-3 capitalize">{coupon.type}</td>
                <td className="px-4 py-3">
                  {coupon.type === "percentage"
                    ? `${coupon.value}%`
                    : formatCad(coupon.value)}
                </td>
                <td className="px-4 py-3">
                  {formatCad(coupon.minimumOrderCents)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {coupon.startsAt
                    ? new Date(coupon.startsAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {coupon.endsAt
                    ? new Date(coupon.endsAt).toLocaleString()
                    : "No expiry"}
                </td>
                <td className="px-4 py-3">
                  {coupon.usedCount}
                  {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : " / ∞"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                      statusClass(coupon.status)
                    )}
                  >
                    {statusLabel(coupon.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      title="Edit"
                      className="text-green transition duration-150 hover:text-gold-dark"
                      onClick={() => openEdit(coupon)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={coupon.isActive ? "Disable" : "Enable"}
                      className="text-green transition duration-150 hover:text-gold-dark"
                      onClick={() => toggleMutation.mutate(coupon)}
                    >
                      {coupon.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Duplicate"
                      className="text-green transition duration-150 hover:text-gold-dark"
                      onClick={() => duplicateMutation.mutate(coupon.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Copy code"
                      className="text-green transition duration-150 hover:text-gold-dark"
                      onClick={async () => {
                        await navigator.clipboard.writeText(coupon.code);
                        setCopiedId(coupon.id);
                        window.setTimeout(() => setCopiedId(null), 1500);
                      }}
                    >
                      {copiedId === coupon.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Tags className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Archive"
                      className="text-red-700 transition duration-150 hover:text-red-900"
                      onClick={() => setArchiveTarget(coupon)}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!couponsQuery.isLoading && coupons.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted">
                  No coupons match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {archiveTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition duration-150">
          <div className="w-full max-w-md border border-border bg-white p-6 shadow-sm">
            <h3 className="font-serif text-xl text-ink">Archive coupon?</h3>
            <p className="mt-2 text-sm text-muted">
              Archive <strong>{archiveTarget.code}</strong>? Past orders keep
              their discount amounts. The coupon can no longer be applied at
              checkout.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
                onClick={() => setArchiveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiveMutation.isPending}
                className="bg-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                onClick={() => archiveMutation.mutate(archiveTarget.id)}
              >
                {archiveMutation.isPending ? "Archiving…" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
