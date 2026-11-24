"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, confirmPassword }),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Reset failed");
      }
      router.replace("/account/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <Input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
      />
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending || !token}>
        {pending ? "Updating…" : "Reset password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="font-serif text-4xl text-[#003F2D]">Reset password</h1>
        <Suspense fallback={<p className="mt-8 text-sm text-[#6B6458]">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-4 text-sm text-[#6B6458]">
          <Link href="/account/login" className="text-[#003F2D] underline">
            Back to sign in
          </Link>
        </p>
      </Container>
    </section>
  );
}
