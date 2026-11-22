import { DEFAULT_STORE, BRAND } from "@ookf/shared";
import { getApiBaseUrl } from "@/lib/api";

export type PublicStoreSettings = {
  storeName: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  announcementBarText?: string;
  currency: string;
  socialLinks: {
    instagram: string | null;
    facebook: string | null;
    pinterest: string | null;
  };
  payments: {
    stripeConfigured: boolean;
  };
};

export const DEFAULT_PUBLIC_SETTINGS: PublicStoreSettings = {
  storeName: BRAND.name,
  phone: DEFAULT_STORE.phone,
  email: DEFAULT_STORE.email,
  addressLine1: DEFAULT_STORE.addressLine1,
  city: DEFAULT_STORE.city,
  province: DEFAULT_STORE.province,
  postalCode: DEFAULT_STORE.postalCode,
  country: DEFAULT_STORE.country,
  currency: "CAD",
  socialLinks: {
    instagram: null,
    facebook: null,
    pinterest: null,
  },
  payments: {
    stripeConfigured: false,
  },
};

export const FOOTER_TAGLINE = "Elegant Traditional Styles for Every Occasion";

export async function fetchPublicStoreSettings(): Promise<PublicStoreSettings> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/settings`, {
      next: { revalidate: 30, tags: ["store-settings"] },
    });
    const json = await response.json();
    if (!response.ok || !json.success || !json.data) {
      return DEFAULT_PUBLIC_SETTINGS;
    }

    const data = json.data as Partial<PublicStoreSettings>;
    return {
      ...DEFAULT_PUBLIC_SETTINGS,
      ...data,
      socialLinks: {
        ...DEFAULT_PUBLIC_SETTINGS.socialLinks,
        ...(data.socialLinks ?? {}),
      },
      payments: {
        ...DEFAULT_PUBLIC_SETTINGS.payments,
        ...(data.payments ?? {}),
      },
    };
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}
