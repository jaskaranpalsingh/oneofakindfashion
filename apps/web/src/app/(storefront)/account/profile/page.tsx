"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

export default function AccountProfilePage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    marketingConsent: false,
    emailVerified: false,
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        credentials: "include",
      });
      const json = await response.json();
      const user = json?.data?.user;
      if (user) {
        setForm({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          marketingConsent: Boolean(user.marketingConsent),
          emailVerified: Boolean(user.emailVerified),
        });
      }
    })();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          marketingConsent: form.marketingConsent,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to update profile");
      }
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setPending(false);
    }
  }

  async function resendVerification() {
    setMessage(null);
    setError(null);
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/auth/resend-verification`,
      { method: "POST", credentials: "include" }
    );
    const json = await response.json();
    if (!response.ok || !json.success) {
      setError(json?.error?.message ?? "Could not resend verification");
      return;
    }
    setMessage(
      json.data?.alreadyVerified
        ? "Email is already verified."
        : "Verification email sent (if email delivery is configured)."
    );
  }

  return (
    <AccountShell
      title="My Profile"
      description="Update your contact details and communication preferences."
    >
      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 border border-[#E5DFD4] bg-white p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6458]">
            First name
            <Input
              className="mt-1"
              value={form.firstName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, firstName: e.target.value }))
              }
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6458]">
            Last name
            <Input
              className="mt-1"
              value={form.lastName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lastName: e.target.value }))
              }
              required
            />
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6458]">
          Email
          <Input className="mt-1" value={form.email} disabled />
          <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-[#6B6458]">
            {form.emailVerified
              ? "Verified"
              : "Not verified — contact support to change your email."}
          </span>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6458]">
          Phone
          <Input
            className="mt-1"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#4A453C]">
          <input
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                marketingConsent: e.target.checked,
              }))
            }
          />
          Send me style updates and offers
        </label>

        {error ? <p className="text-sm text-burgundy">{error}</p> : null}
        {message ? <p className="text-sm text-[#003F2D]">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {!form.emailVerified ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void resendVerification()}
            >
              Resend verification
            </Button>
          ) : null}
        </div>
      </form>
    </AccountShell>
  );
}
