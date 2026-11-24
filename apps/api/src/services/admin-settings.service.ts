import { DEFAULT_STORE, BRAND } from "@ookf/shared";
import { StoreSettingsModel } from "../models/content.model";

const SETTINGS_KEY = "default";

export async function getStoreSettings() {
  let settings = await StoreSettingsModel.findOne({ key: SETTINGS_KEY }).lean();
  if (!settings) {
    const created = await StoreSettingsModel.create({
      key: SETTINGS_KEY,
      storeName: BRAND.name,
      addressLine1: DEFAULT_STORE.addressLine1,
      city: DEFAULT_STORE.city,
      province: DEFAULT_STORE.province,
      postalCode: DEFAULT_STORE.postalCode,
      country: DEFAULT_STORE.country,
      phone: DEFAULT_STORE.phone,
      email: DEFAULT_STORE.email,
    });
    settings = created.toObject();
  }

  return {
    id: String(settings._id),
    key: settings.key,
    storeName: settings.storeName,
    logoUrl: settings.logoUrl ?? null,
    faviconUrl: settings.faviconUrl ?? null,
    addressLine1: settings.addressLine1,
    city: settings.city,
    province: settings.province,
    postalCode: settings.postalCode,
    country: settings.country,
    phone: settings.phone,
    email: settings.email,
    currency: settings.currency ?? "CAD",
    announcementBarText: settings.announcementBarText ?? "",
    newArrivalsDays: settings.newArrivalsDays ?? 30,
    socialLinks: {
      instagram: settings.socialLinks?.instagram ?? null,
      facebook: settings.socialLinks?.facebook ?? null,
      pinterest: settings.socialLinks?.pinterest ?? null,
      tiktok: settings.socialLinks?.tiktok ?? null,
    },
    shipping: {
      standardCents: settings.shipping?.standardCents ?? 1499,
      expressCents: settings.shipping?.expressCents ?? 2499,
      freeShippingMinimumCents:
        settings.shipping?.freeShippingMinimumCents ?? 20000,
      localPickupEnabled: settings.shipping?.localPickupEnabled ?? true,
      standardEta:
        settings.shipping?.standardEta ?? "3–7 business days",
      expressEta:
        settings.shipping?.expressEta ?? "1–3 business days",
      pickupInstructions:
        settings.shipping?.pickupInstructions ??
        "We will confirm pickup readiness by phone or email after your order is paid.",
      pickupHours:
        (settings.shipping as { pickupHours?: string } | undefined)
          ?.pickupHours ?? "By appointment — confirmed after payment",
      processingDays:
        (settings.shipping as { processingDays?: number } | undefined)
          ?.processingDays ?? 2,
      handlingDays:
        (settings.shipping as { handlingDays?: number } | undefined)
          ?.handlingDays ?? 1,
    },
    taxRules: settings.taxRules ?? [],
    navigation: settings.navigation ?? [],
    seoDefaults: settings.seoDefaults ?? {},
    updatedAt: settings.updatedAt,
  };
}

export async function updateStoreSettings(input: Record<string, unknown>) {
  const allowed = [
    "storeName",
    "logoUrl",
    "faviconUrl",
    "addressLine1",
    "city",
    "province",
    "postalCode",
    "country",
    "phone",
    "email",
    "currency",
    "announcementBarText",
    "newArrivalsDays",
    "socialLinks",
    "shipping",
    "taxRules",
    "navigation",
    "seoDefaults",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (input[key] !== undefined) {
      patch[key] = input[key];
    }
  }

  await StoreSettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: patch, $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true }
  );

  return getStoreSettings();
}
