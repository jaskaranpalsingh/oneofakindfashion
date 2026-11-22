"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("owner@oneofakindfashion.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Login failed");
      }
      if (json.data?.user?.role !== "admin") {
        throw new Error("This account is not an admin. Use the owner admin login.");
      }
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md border border-border bg-white p-8 shadow-sm">
        <div className="mx-auto w-40">
          <BrandLogo href="/admin" size="md" />
        </div>
        <h1 className="mt-6 font-serif text-3xl text-green">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with your admin account to load live dashboard data.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
          {error ? (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in to admin"}
          </Button>
        </form>

        <p className="mt-5 text-xs leading-relaxed text-muted">
          Default owner (after `pnpm create-admin`):
          <br />
          <span className="font-medium text-ink">
            owner@oneofakindfashion.local
          </span>
          <br />
          Use the password from your <code>.env</code>{" "}
          <code>ADMIN_INITIAL_PASSWORD</code>.
        </p>

        <p className="mt-4 text-sm text-muted">
          <Link href="/" className="text-green hover:underline">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ivory text-sm text-muted">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
