"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatCad } from "@ookf/shared";
import { adminFetch } from "@/lib/admin-api";

type CustomerRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  totalSpendCents: number;
};

type CustomersResponse = {
  items: CustomerRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ["admin", "customers", q, status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      params.set("page", String(page));
      params.set("limit", "25");
      const data = await adminFetch<CustomersResponse | CustomerRow[]>(
        `/api/v1/admin/customers?${params}`
      );
      if (Array.isArray(data)) {
        return {
          items: data,
          meta: {
            page: 1,
            pageSize: data.length,
            total: data.length,
            totalPages: 1,
          },
        } satisfies CustomersResponse;
      }
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      adminFetch(`/api/v1/admin/customers/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: input.isActive }),
      }),
    onSuccess: async () => {
      setMessage("Customer updated");
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const items = customersQuery.data?.items ?? [];
  const meta = customersQuery.data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Registered customer accounts from MongoDB (no password or card data
          exposed).
        </p>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => {
            setPage(1);
            setQ(event.target.value);
          }}
          placeholder="Search name, email or phone"
          className="w-full max-w-md border border-border bg-white px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as typeof status);
          }}
          className="border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spend</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((customer) => (
              <tr key={customer.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {customer.firstName} {customer.lastName}
                  </Link>
                  <div className="text-xs text-muted">{customer.email}</div>
                  {customer.phone ? (
                    <div className="text-xs text-muted">{customer.phone}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-muted">
                  {customer.lastLoginAt
                    ? new Date(customer.lastLoginAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">{customer.orderCount}</td>
                <td className="px-4 py-3">
                  {formatCad(customer.totalSpendCents)}
                </td>
                <td className="px-4 py-3">
                  {customer.isActive ? "Active" : "Disabled"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-green"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-green"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: customer.id,
                          isActive: !customer.isActive,
                        })
                      }
                    >
                      {customer.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!customersQuery.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-muted">
                  No customers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="border border-border px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span className="text-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            className="border border-border px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
