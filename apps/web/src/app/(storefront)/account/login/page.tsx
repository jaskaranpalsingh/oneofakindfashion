"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
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

      await fetch(`${getApiBaseUrl()}/api/v1/cart/merge`, {
        method: "POST",
        credentials: "include",
      });

      if (json.data.user.role === "admin") {
        router.push(nextPath?.startsWith("/admin") ? nextPath : "/admin");
      } else {
        router.push(
          nextPath && !nextPath.startsWith("/admin") ? nextPath : "/account"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="font-serif text-4xl text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Access your orders, wishlist, and saved addresses.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-green">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          New here?{" "}
          <Link href="/account/register" className="text-green hover:underline">
            Create an account
          </Link>
        </p>
      </Container>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="py-12 sm:py-16">
          <Container className="max-w-md">
            <p className="text-sm text-muted">Loading…</p>
          </Container>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
