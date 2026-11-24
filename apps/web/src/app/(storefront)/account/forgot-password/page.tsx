"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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
        `${getApiBaseUrl()}/api/v1/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Request failed");
      }
      setMessage(
        "If an account exists for that email, a reset link has been sent."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="font-serif text-4xl text-[#003F2D]">Forgot password</h1>
        <p className="mt-2 text-sm text-[#6B6458]">
          Enter your email and we will send a reset link if an account exists.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-burgundy">{error}</p> : null}
          {message ? <p className="text-sm text-[#003F2D]">{message}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[#6B6458]">
          <Link href="/account/login" className="text-[#003F2D] underline">
            Back to sign in
          </Link>
        </p>
      </Container>
    </section>
  );
}
