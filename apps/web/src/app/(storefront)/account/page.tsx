"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getApiBaseUrl } from "@/lib/api";

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          credentials: "include",
        });
        const json = await response.json();
        const nextUser = (json?.data?.user ?? null) as AuthUser | null;

        if (cancelled) return;

        if (!response.ok || !json.success || !nextUser) {
          router.replace("/account/login?next=/account");
          return;
        }

        setUser(nextUser);
      } catch {
        if (!cancelled) {
          router.replace("/account/login?next=/account");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/account/login";
  }

  if (loading || !user) {
    return (
      <section className="py-12 sm:py-16">
        <Container>
          <p className="text-sm text-muted">Loading account…</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-2xl space-y-6">
        <h1 className="font-serif text-4xl text-ink">
          Hello, {user.firstName}
        </h1>
        <p className="text-sm text-muted">{user.email}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/account/orders">
            <Button variant="secondary">My Orders</Button>
          </Link>
          {user.role === "admin" ? (
            <Link href="/admin">
              <Button>Admin Dashboard</Button>
            </Link>
          ) : null}
          <Button variant="ghost" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </Container>
    </section>
  );
}
