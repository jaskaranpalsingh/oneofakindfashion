"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatCad } from "@ookf/shared";
import { adminFetch } from "@/lib/admin-api";

type CustomerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  marketingConsent: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  deletionRequestedAt: string | null;
  internalNotes: string;
  orderCount: number;
  totalSpendCents: number;
  addresses: Array<Record<string, unknown>>;
  orders: Array<{
    orderNumber: string;
    totalCents: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
    trackingNumber: string | null;
  }>;
};

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["admin", "customers", params.id],
    queryFn: () =>
      adminFetch<CustomerDetail>(`/api/v1/admin/customers/${params.id}`),
  });

  useEffect(() => {
    if (detailQuery.data) setNotes(detailQuery.data.internalNotes ?? "");
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      adminFetch(`/api/v1/admin/customers/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setMessage("Customer updated");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "customers", params.id],
      });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      adminFetch(`/api/v1/admin/customers/${params.id}/send-password-reset`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => setMessage("Password reset email queued"),
    onError: (error: Error) => setMessage(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      adminFetch(`/api/v1/admin/customers/${params.id}/process-deletion`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      setMessage("Account deleted and sessions revoked");
      window.location.href = "/admin/customers";
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const customer = detailQuery.data;

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted">Loading customer…</p>;
  }

  if (!customer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">Customer not found.</p>
        <Link href="/admin/customers" className="text-sm text-green underline">
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/customers"
            className="text-xs uppercase tracking-[0.12em] text-muted"
          >
            Customers
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-ink">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-sm text-muted">{customer.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
            onClick={() =>
              saveMutation.mutate({ isActive: !customer.isActive })
            }
          >
            {customer.isActive ? "Disable account" : "Activate account"}
          </button>
          <button
            type="button"
            className="border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
            onClick={() => resetMutation.mutate()}
          >
            Send password reset
          </button>
          {customer.deletionRequestedAt ? (
            <button
              type="button"
              className="border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-800"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Permanently anonymize this customer account and revoke sessions? Orders are kept for records."
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
            >
              {deleteMutation.isPending
                ? "Processing…"
                : "Process deletion request"}
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Orders", customer.orderCount],
          ["Total spend", formatCad(customer.totalSpendCents)],
          ["Status", customer.isActive ? "Active" : "Disabled"],
          ["Email", customer.emailVerified ? "Verified" : "Unverified"],
        ].map(([label, value]) => (
          <div key={String(label)} className="border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-serif text-2xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-white p-5 text-sm">
          <h2 className="font-serif text-xl text-ink">Profile</h2>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Phone</dt>
              <dd>{customer.phone || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Registered</dt>
              <dd>{new Date(customer.createdAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Last login</dt>
              <dd>
                {customer.lastLoginAt
                  ? new Date(customer.lastLoginAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Marketing</dt>
              <dd>{customer.marketingConsent ? "Opted in" : "Opted out"}</dd>
            </div>
            {customer.deletionRequestedAt ? (
              <div className="flex justify-between gap-3 text-red-700">
                <dt>Deletion requested</dt>
                <dd>
                  {new Date(customer.deletionRequestedAt).toLocaleString()}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="border border-border bg-white p-5">
          <h2 className="font-serif text-xl text-ink">Internal notes</h2>
          <textarea
            className="mt-3 h-28 w-full border border-border p-3 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            className="mt-3 border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
            onClick={() => saveMutation.mutate({ internalNotes: notes })}
          >
            Save notes
          </button>
        </div>
      </div>

      <div className="border border-border bg-white p-5">
        <h2 className="font-serif text-xl text-ink">Saved addresses</h2>
        {customer.addresses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No saved addresses.</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {customer.addresses.map((address, index) => (
              <li key={index} className="border border-border p-3 text-sm">
                <p className="font-medium">
                  {String(address.firstName)} {String(address.lastName)}
                </p>
                <p className="mt-1 text-muted">
                  {String(address.line1)}
                  <br />
                  {String(address.city)}, {String(address.province)}{" "}
                  {String(address.postalCode)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-border bg-white p-5">
        <h2 className="font-serif text-xl text-ink">Order history</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Payment</th>
                <th className="py-2 pr-3">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr key={order.orderNumber} className="border-b border-border/60">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/admin/orders`}
                      className="text-green hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-3">{formatCad(order.totalCents)}</td>
                  <td className="py-2 pr-3 capitalize">
                    {order.paymentStatus.replaceAll("_", " ")}
                  </td>
                  <td className="py-2 pr-3 capitalize">
                    {order.fulfillmentStatus.replaceAll("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
