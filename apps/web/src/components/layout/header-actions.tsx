"use client";

import Link from "next/link";
import { Heart, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";

export function HeaderActions() {
  const { cartCount, openDrawer } = useCart();

  return (
    <div className="relative z-10 flex shrink-0 items-end gap-3 sm:gap-4">
      <ActionLink
        href="/account"
        label="Account"
        icon={<UserRound className="h-5 w-5" />}
      />
      <ActionLink
        href="/wishlist"
        label="Wishlist"
        icon={<Heart className="h-5 w-5" />}
        className="hidden md:flex"
      />
      <button
        type="button"
        onClick={openDrawer}
        className="group relative flex min-w-[2.5rem] flex-col items-center gap-1 text-[#D4AF37] transition hover:text-[#F4D778] sm:min-w-[3rem]"
        aria-label={`Open cart${cartCount ? `, ${cartCount} items` : ""}`}
      >
        <span className="relative inline-flex h-6 w-6 items-center justify-center">
          <ShoppingCart className="h-5 w-5" strokeWidth={1.6} />
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-bold text-[#003F2D]">
            {cartCount}
          </span>
        </span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.1em] text-[#FFF9EF] sm:inline">
          Cart
        </span>
      </button>
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon,
  className,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-w-[2.5rem] flex-col items-center gap-1 text-[#D4AF37] transition hover:text-[#F4D778] sm:min-w-[3rem] ${className ?? ""}`}
    >
      <span className="relative inline-flex h-6 w-6 items-center justify-center [&>svg]:stroke-[1.6]">
        {icon}
      </span>
      <span className="hidden text-[10px] font-medium uppercase tracking-[0.1em] text-[#FFF9EF] sm:inline">
        {label}
      </span>
    </Link>
  );
}
