"use client";

import Link from "next/link";
import { DEFAULT_STORE } from "@ookf/shared";
import { MapPin, Phone, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/shop/lehengas", label: "Lehengas" },
  { href: "/shop/suits", label: "Suits" },
  { href: "/shop/jewellery", label: "Jewellery" },
  { href: "/shop/new-arrivals", label: "New Arrivals" },
  { href: "/shop/sale", label: "Sale" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

export function MobileNavigation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] bg-black/45 transition lg:hidden",
        open ? "visible opacity-100" : "invisible opacity-0"
      )}
      onClick={onClose}
    >
      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-[#003F2D] text-[#FFF9EF] shadow-xl transition duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <BrandLogo size="sm" />
          <button
            type="button"
            aria-label="Close menu"
            className="inline-flex h-10 w-10 items-center justify-center text-[#FFF9EF]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block border-b border-white/10 px-3 py-3.5 font-serif text-sm uppercase tracking-[0.14em] text-[#FFF9EF]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4 text-sm text-[#FFF9EF]/85">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-gold" />
            <p>
              {DEFAULT_STORE.addressLine1}
              <br />
              {DEFAULT_STORE.city}, {DEFAULT_STORE.province}, Canada
            </p>
          </div>
          <a
            href={`tel:${DEFAULT_STORE.phone}`}
            className="flex items-center gap-2 hover:text-gold-light"
          >
            <Phone className="h-4 w-4 text-gold" />
            {DEFAULT_STORE.phone}
          </a>
        </div>
      </aside>
    </div>
  );
}
