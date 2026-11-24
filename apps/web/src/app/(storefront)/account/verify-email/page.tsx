"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { getApiBaseUrl } from "@/lib/api";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/auth/verify-email`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Verification failed");
        }
        setStatus("ok");
        setMessage("Your email has been verified.");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      }
    })();
  }, [token]);

  return (
    <div className="mt-6 border border-[#E5DFD4] bg-white p-6">
      <p
        className={
          status === "error" ? "text-sm text-burgundy" : "text-sm text-[#003F2D]"
        }
      >
        {message}
      </p>
      <Link
        href="/account"
        className="mt-4 inline-block text-xs uppercase tracking-[0.12em] text-[#C49A36]"
      >
        Go to my account
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="font-serif text-4xl text-[#003F2D]">Email verification</h1>
        <Suspense fallback={<p className="mt-6 text-sm">Verifying…</p>}>
          <VerifyEmailInner />
        </Suspense>
      </Container>
    </section>
  );
}
