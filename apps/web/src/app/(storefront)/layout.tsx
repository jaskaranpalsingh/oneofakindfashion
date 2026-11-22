import { StorefrontShell } from "@/components/layout/storefront-shell";
import { fetchPublicStoreSettings } from "@/lib/store-settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeSettings = await fetchPublicStoreSettings();
  return (
    <StorefrontShell
      announcement={storeSettings.announcementBarText}
      storeSettings={storeSettings}
    >
      {children}
    </StorefrontShell>
  );
}
