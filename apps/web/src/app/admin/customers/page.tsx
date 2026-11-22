"use client";

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
  orderCount: number;
  totalSpendCents: number;
};

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ["admin", "customers", q],
    queryFn: () =>
      adminFetch<CustomerRow[]>(
        `/api/v1/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`
      ),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Registered customer accounts from MongoDB (no password data exposed).
        </p>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}
      {customersQuery.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(customersQuery.error as Error).message}
        </p>
      ) : null}

      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search name or email"
        className="w-full max-w-md border border-border bg-white px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-ivory text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spend</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(customersQuery.data ?? []).map((customer) => (
              <tr key={customer.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div className="text-xs text-muted">{customer.email}</div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">{customer.orderCount}</td>
                <td className="px-4 py-3">
                  {formatCad(customer.totalSpendCents)}
                </td>
                <td className="px-4 py-3">
                  {customer.isActive ? "Active" : "Disabled"}
                </td>
                <td className="px-4 py-3">
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
                </td>
              </tr>
            ))}
            {!customersQuery.isLoading &&
            (customersQuery.data?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted">
                  No customers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
