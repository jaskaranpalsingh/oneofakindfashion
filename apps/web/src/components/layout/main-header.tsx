"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { HeaderActions } from "@/components/layout/header-actions";
import { HeaderContact } from "@/components/layout/header-contact";
import { HeaderSearch } from "@/components/layout/header-search";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { cn } from "@/lib/utils";

export function MainHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <div className="relative z-10 mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-3 sm:gap-3.5 lg:gap-5">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#FFF9EF] lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <BrandLogo priority size="header" />

        <div className="mx-0.5 hidden h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-gold/70 to-transparent lg:block" />

        <div className="hidden min-w-0 flex-1 lg:block">
          <HeaderSearch />
        </div>

        <div className="mx-0.5 hidden h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-gold/70 to-transparent lg:block" />

        <HeaderContact />

        <div className="mx-0.5 hidden h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-gold/70 to-transparent lg:block" />

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            aria-label="Open search"
            className="inline-flex h-10 w-10 items-center justify-center text-[#FFF9EF] lg:hidden"
            onClick={() => setMobileSearchOpen((value) => !value)}
          >
            <Search className="h-5 w-5" />
          </button>
          <HeaderActions />
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 border-t border-white/10 px-4 py-2 lg:hidden",
          mobileSearchOpen ? "block" : "hidden"
        )}
      >
        <HeaderSearch />
      </div>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
