"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/shop/lehengas", label: "Lehengas" },
  { href: "/shop/suits", label: "Suits" },
  { href: "/shop/jewellery", label: "Jewellery" },
  { href: "/shop/new-arrivals", label: "New Arrivals" },
  { href: "/shop/sale", label: "Sale", isSale: true },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="relative z-10 hidden border-t border-white/10 lg:block"
    >
      <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-0.5 px-3 py-1.5 xl:gap-x-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          if ("isSale" in item && item.isSale) {
            return (
              <li key={item.href} className="px-1.5">
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-full bg-gradient-to-b from-[#F4D778] to-[#D4AF37] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#003F2D] shadow-[0_1px_6px_rgba(212,175,55,0.28)] transition hover:brightness-105"
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative inline-flex items-center px-2.5 py-2 font-serif text-[12px] uppercase tracking-[0.14em] transition xl:px-3 xl:text-[13px]",
                  active
                    ? "text-[#D4AF37]"
                    : "text-[#FFF9EF]/92 hover:text-[#F4D778]"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-2.5 bottom-0.5 h-[2px] bg-[#D4AF37] transition",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
