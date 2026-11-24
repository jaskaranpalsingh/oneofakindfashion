"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Heart,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { getApiBaseUrl } from "@/lib/api";
import { clearCustomerClientStateOnLogout } from "@/lib/clear-customer-client-state";
import { cn } from "@/lib/utils";

export type AccountUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  emailVerified?: boolean;
  marketingConsent?: boolean;
};

const NAV = [
  { href: "/account", label: "Account Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "My Profile", icon: UserRound },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "My Wishlist", icon: Heart },
  { href: "/cart", label: "Shopping Bag", icon: ShoppingBag },
  { href: "/track-order", label: "Track Order", icon: Truck },
  { href: "/account/security", label: "Account Security", icon: KeyRound },
] as const;

export function AccountShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          credentials: "include",
        });
        const json = await response.json();
        const nextUser = (json?.data?.user ?? null) as AccountUser | null;
        if (cancelled) return;
        if (!response.ok || !json.success || !nextUser) {
          router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        setUser(nextUser);
      } catch {
        if (!cancelled) {
          router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  async function logout() {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    clearCustomerClientStateOnLogout();
    window.location.href = "/account/login";
  }

  if (loading || !user) {
    return (
      <section className="bg-[#FAF7F0] py-12 sm:py-16">
        <Container>
          <div className="h-40 animate-pulse border border-[#E5DFD4] bg-white" />
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-[#FAF7F0] py-10 sm:py-14">
      <Container className="max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C49A36]">
            My Account
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#003F2D] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-[#6B6458]">{description}</p>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit border border-[#E5DFD4] bg-white p-4">
            <p className="px-2 text-sm font-medium text-[#003F2D]">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-1 truncate px-2 text-xs text-[#6B6458]">
              {user.email}
            </p>
            <nav className="mt-4 space-y-1" aria-label="Account">
              {NAV.map((item) => {
                const active =
                  item.href === "/account"
                    ? pathname === "/account"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 text-sm transition",
                      active
                        ? "bg-[#003F2D] text-[#FFF9EF]"
                        : "text-[#4A453C] hover:bg-[#FAF7F0]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-[#4A453C] transition hover:bg-[#FAF7F0]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </section>
  );
}
