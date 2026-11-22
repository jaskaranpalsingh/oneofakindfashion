"use client";

import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { PublicStoreSettings } from "@/lib/store-settings";

export function StorefrontShell({
  children,
  announcement,
  storeSettings,
}: {
  children: React.ReactNode;
  announcement?: string;
  storeSettings?: PublicStoreSettings;
}) {
  return (
    <CartProvider>
      <StorefrontFrame announcement={announcement} storeSettings={storeSettings}>
        {children}
      </StorefrontFrame>
    </CartProvider>
  );
}

function StorefrontFrame({
  children,
  announcement,
  storeSettings,
}: {
  children: React.ReactNode;
  announcement?: string;
  storeSettings?: PublicStoreSettings;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ivory text-ink">
      <SiteHeader announcement={announcement} />
      <div className="flex-1">{children}</div>
      <SiteFooter settings={storeSettings} />
    </div>
  );
}
