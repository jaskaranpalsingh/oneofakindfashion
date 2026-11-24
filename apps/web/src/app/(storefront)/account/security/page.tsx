"use client";

import { useState } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

export default function AccountSecurityPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth/change-password`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Could not update password");
      }
      setMessage("Password updated.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setPending(false);
    }
  }

  async function requestDeletion() {
    if (
      !window.confirm(
        "Request account deletion? Our team will review and process this securely."
      )
    ) {
      return;
    }
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/auth/request-deletion`,
      { method: "POST", credentials: "include" }
    );
    const json = await response.json();
    if (!response.ok || !json.success) {
      setError(json?.error?.message ?? "Could not submit deletion request");
      return;
    }
    setMessage("Deletion request submitted.");
  }

  return (
    <AccountShell
      title="Account Security"
      description="Change your password and manage account privacy options."
    >
      <div className="max-w-xl space-y-6">
        <form
          onSubmit={onSubmit}
          className="space-y-3 border border-[#E5DFD4] bg-white p-5"
        >
          <h2 className="font-serif text-xl text-[#003F2D]">Change password</h2>
          <Input
            type="password"
            placeholder="Current password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((p) => ({ ...p, currentPassword: e.target.value }))
            }
            required
          />
          <Input
            type="password"
            placeholder="New password"
            value={form.newPassword}
            onChange={(e) =>
              setForm((p) => ({ ...p, newPassword: e.target.value }))
            }
            required
            minLength={8}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((p) => ({ ...p, confirmPassword: e.target.value }))
            }
            required
            minLength={8}
          />
          {error ? <p className="text-sm text-burgundy">{error}</p> : null}
          {message ? <p className="text-sm text-[#003F2D]">{message}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>

        <div className="border border-[#E5DFD4] bg-white p-5">
          <h2 className="font-serif text-xl text-[#003F2D]">
            Account deletion
          </h2>
          <p className="mt-2 text-sm text-[#6B6458]">
            You can request deletion of your personal account data. Order
            records required for tax and legal purposes may be retained.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void requestDeletion()}
          >
            Request deletion
          </Button>
        </div>
      </div>
    </AccountShell>
  );
}
