"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { getApiBaseUrl } from "@/lib/api";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/discounts", label: "Discounts", icon: Tags },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(!isLogin);

  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    void (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok || !json.success || json.data?.user?.role !== "admin") {
          if (!cancelled) {
            setUser(null);
            router.replace(
              `/admin/login?next=${encodeURIComponent(pathname || "/admin")}`
            );
          }
          return;
        }
        if (!cancelled) {
          setUser(json.data.user as AuthUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          router.replace("/admin/login");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLogin, pathname, router]);

  async function logout() {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.replace("/admin/login");
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory text-sm text-muted">
        Checking admin session…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 bg-green text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-4 py-5">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-md bg-white p-1">
              <BrandLogo href="/admin" size="md" variant="solid" priority />
            </div>
            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Admin Console
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-green-emerald text-white"
                      : "text-white/85 hover:bg-green-emerald hover:text-white"
                  }`}
                >
                  <span className="h-4 w-0.5 rounded-full bg-gold/80" />
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-2 border-t border-white/10 p-4 text-xs text-white/70">
            <p className="truncate text-white/90">{user.email}</p>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 hover:text-gold"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
            <Link href="/" className="block hover:text-gold">
              ← View storefront
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-green">Store Admin</p>
              <p className="text-xs text-muted">
                Signed in as {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/login"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-green lg:hidden"
              >
                Account
              </Link>
              <Link
                href="/"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-green"
              >
                Store
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
