"use client";

import { useCallback, useEffect, useState } from "react";
import { CANADIAN_PROVINCES } from "@ookf/shared";
import { AccountShell } from "@/components/account/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

type Address = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

const emptyForm = {
  label: "",
  firstName: "",
  lastName: "",
  company: "",
  line1: "",
  line2: "",
  city: "",
  province: "AB",
  postalCode: "",
  phone: "",
  isDefaultShipping: true,
  isDefaultBilling: false,
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/account/addresses`, {
      credentials: "include",
    });
    const json = await response.json();
    if (response.ok && json.success) {
      setAddresses(json.data as Address[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        ...form,
        label: form.label || undefined,
        company: form.company || undefined,
        line2: form.line2 || undefined,
        phone: form.phone || undefined,
        country: "Canada" as const,
      };
      const response = await fetch(
        editingId
          ? `${getApiBaseUrl()}/api/v1/account/addresses/${editingId}`
          : `${getApiBaseUrl()}/api/v1/account/addresses`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Could not save address");
      }
      setMessage(editingId ? "Address updated." : "Address saved.");
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this address?")) return;
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/account/addresses/${id}`,
      { method: "DELETE", credentials: "include" }
    );
    const json = await response.json();
    if (!response.ok || !json.success) {
      setError(json?.error?.message ?? "Could not delete address");
      return;
    }
    setMessage("Address deleted.");
    await load();
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      label: address.label ?? "",
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      phone: address.phone ?? "",
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    });
  }

  return (
    <AccountShell
      title="Saved Addresses"
      description="Manage shipping and billing addresses for faster checkout."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {addresses.length === 0 ? (
            <p className="border border-[#E5DFD4] bg-white p-5 text-sm text-[#6B6458]">
              No saved addresses yet.
            </p>
          ) : (
            addresses.map((address) => (
              <article
                key={address.id}
                className="border border-[#E5DFD4] bg-white p-4 text-sm text-[#4A453C]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#003F2D]">
                      {address.firstName} {address.lastName}
                      {address.label ? ` · ${address.label}` : ""}
                    </p>
                    <p className="mt-1">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.province} {address.postalCode}
                    </p>
                    <p className="mt-2 text-xs text-[#6B6458]">
                      {address.isDefaultShipping ? "Default shipping · " : ""}
                      {address.isDefaultBilling ? "Default billing" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs uppercase tracking-[0.12em] text-[#C49A36]"
                      onClick={() => startEdit(address)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs uppercase tracking-[0.12em] text-burgundy"
                      onClick={() => void remove(address.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 border border-[#E5DFD4] bg-white p-5"
        >
          <h2 className="font-serif text-xl text-[#003F2D]">
            {editingId ? "Edit address" : "Add address"}
          </h2>
          <Input
            placeholder="Label (optional)"
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="First name"
              value={form.firstName}
              onChange={(e) =>
                setForm((p) => ({ ...p, firstName: e.target.value }))
              }
              required
            />
            <Input
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) =>
                setForm((p) => ({ ...p, lastName: e.target.value }))
              }
              required
            />
          </div>
          <Input
            placeholder="Company (optional)"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
          />
          <Input
            placeholder="Address line 1"
            value={form.line1}
            onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))}
            required
          />
          <Input
            placeholder="Address line 2"
            value={form.line2}
            onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              required
            />
            <select
              className="h-10 border border-[#E5DFD4] bg-white px-3 text-sm"
              value={form.province}
              onChange={(e) =>
                setForm((p) => ({ ...p, province: e.target.value }))
              }
            >
              {CANADIAN_PROVINCES.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            placeholder="Postal code"
            value={form.postalCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, postalCode: e.target.value }))
            }
            required
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefaultShipping}
              onChange={(e) =>
                setForm((p) => ({ ...p, isDefaultShipping: e.target.checked }))
              }
            />
            Default shipping address
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefaultBilling}
              onChange={(e) =>
                setForm((p) => ({ ...p, isDefaultBilling: e.target.checked }))
              }
            />
            Default billing address
          </label>
          {error ? <p className="text-sm text-burgundy">{error}</p> : null}
          {message ? <p className="text-sm text-[#003F2D]">{message}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editingId ? "Update address" : "Save address"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
