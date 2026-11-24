"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";
import {
  clearAuthenticatedWishlistCaches,
  dispatchAuthChange,
  mergeGuestWishlistAfterAuth,
} from "@/lib/wishlist-store";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    marketingConsent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (!form.acceptTerms) {
        throw new Error("Please accept the terms and conditions");
      }
      if (form.password !== form.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Registration failed");
      }
      clearAuthenticatedWishlistCaches();
      await fetch(`${getApiBaseUrl()}/api/v1/cart/merge`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const userId = json.data?.user?.id as string | undefined;
      if (userId) {
        await mergeGuestWishlistAfterAuth(userId);
        dispatchAuthChange({ userId, reason: "register" });
      }
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="font-serif text-4xl text-[#003F2D]">Create account</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="First name"
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
              required
            />
            <Input
              placeholder="Last name"
              value={form.lastName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lastName: event.target.value }))
              }
              required
            />
          </div>
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
          <Input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
          />
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            required
            minLength={8}
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                confirmPassword: event.target.value,
              }))
            }
            required
            minLength={8}
          />
          <label className="flex items-start gap-2 text-sm text-[#4A453C]">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.acceptTerms}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, acceptTerms: e.target.checked }))
              }
            />
            <span>
              I agree to the{" "}
              <Link href="/privacy-policy" className="underline">
                privacy policy
              </Link>{" "}
              and terms of use.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-[#4A453C]">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.marketingConsent}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  marketingConsent: e.target.checked,
                }))
              }
            />
            Send me style updates and offers (optional)
          </label>
          {error ? <p className="text-sm text-burgundy">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[#6B6458]">
          Already have an account?{" "}
          <Link href="/account/login" className="text-[#003F2D] hover:underline">
            Sign in
          </Link>
        </p>
      </Container>
    </section>
  );
}
