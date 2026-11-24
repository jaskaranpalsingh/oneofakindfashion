import {
  DEFAULT_CANADA_SHIPPING_ZONES,
  ShippingMethod,
  formatCanadianPostalCode,
} from "@ookf/shared";
import { StoreSettingsModel } from "../models/content.model";
import {
  ShippingMethodModel,
  ShippingZoneModel,
} from "../models/shipping.model";
import { AppError } from "../utils/app-error";
import { getManualCarrierAdapter } from "./carriers/manual.carrier";

const DEFAULT_ZONE_RATES: Record<
  string,
  Array<{ methodCode: string; rateCents: number; etaLabel: string }>
> = {
  alberta: [
    {
      methodCode: ShippingMethod.STANDARD,
      rateCents: 1499,
      etaLabel: "3–7 business days",
    },
    {
      methodCode: ShippingMethod.EXPRESS,
      rateCents: 2499,
      etaLabel: "1–3 business days",
    },
  ],
  west_prairies: [
    {
      methodCode: ShippingMethod.STANDARD,
      rateCents: 1699,
      etaLabel: "4–8 business days",
    },
    {
      methodCode: ShippingMethod.EXPRESS,
      rateCents: 2799,
      etaLabel: "2–4 business days",
    },
  ],
  central: [
    {
      methodCode: ShippingMethod.STANDARD,
      rateCents: 1799,
      etaLabel: "4–8 business days",
    },
    {
      methodCode: ShippingMethod.EXPRESS,
      rateCents: 2999,
      etaLabel: "2–4 business days",
    },
  ],
  atlantic: [
    {
      methodCode: ShippingMethod.STANDARD,
      rateCents: 1999,
      etaLabel: "5–10 business days",
    },
    {
      methodCode: ShippingMethod.EXPRESS,
      rateCents: 3499,
      etaLabel: "3–5 business days",
    },
  ],
  territories: [
    {
      methodCode: ShippingMethod.STANDARD,
      rateCents: 2999,
      etaLabel: "7–14 business days",
    },
    {
      methodCode: ShippingMethod.EXPRESS,
      rateCents: 4999,
      etaLabel: "4–7 business days",
    },
  ],
};

export async function ensureShippingDefaults() {
  const methodCount = await ShippingMethodModel.countDocuments();
  if (methodCount === 0) {
    await ShippingMethodModel.insertMany([
      {
        code: ShippingMethod.STANDARD,
        name: "Standard Shipping",
        description: "Canada-wide ground delivery",
        baseRateCents: 1499,
        etaLabel: "3–7 business days",
        isPickup: false,
        qualifiesForFreeShipping: true,
        isActive: true,
        sortOrder: 1,
      },
      {
        code: ShippingMethod.EXPRESS,
        name: "Express Shipping",
        description: "Faster Canada-wide delivery",
        baseRateCents: 2499,
        etaLabel: "1–3 business days",
        isPickup: false,
        qualifiesForFreeShipping: false,
        isActive: true,
        sortOrder: 2,
      },
      {
        code: ShippingMethod.LOCAL_PICKUP,
        name: "Free Local Pickup — Edmonton",
        description: "Collect at our boutique",
        baseRateCents: 0,
        etaLabel: "Ready after preparation",
        isPickup: true,
        qualifiesForFreeShipping: false,
        isActive: true,
        sortOrder: 3,
      },
    ]);
  }

  const zoneCount = await ShippingZoneModel.countDocuments();
  if (zoneCount === 0) {
    await ShippingZoneModel.insertMany(
      DEFAULT_CANADA_SHIPPING_ZONES.map((zone) => ({
        key: zone.key,
        name: zone.name,
        provinces: [...zone.provinces],
        postalPrefixes: [],
        isRemote: zone.key === "territories",
        remoteSurchargeCents: zone.key === "territories" ? 500 : 0,
        rates: (DEFAULT_ZONE_RATES[zone.key] ?? []).map((rate) => ({
          ...rate,
          enabled: true,
          perKgCents: 0,
          freeWeightGrams: 0,
        })),
        isActive: true,
        sortOrder: zone.sortOrder,
      }))
    );
  }

  // Sync legacy flat rates from StoreSettings when methods still match defaults.
  const settings = await StoreSettingsModel.findOne({ key: "default" }).lean();
  if (settings?.shipping) {
    if (typeof settings.shipping.standardCents === "number") {
      await ShippingMethodModel.updateOne(
        { code: ShippingMethod.STANDARD, baseRateCents: 1499 },
        {
          $set: {
            baseRateCents: settings.shipping.standardCents,
            etaLabel:
              settings.shipping.standardEta || "3–7 business days",
          },
        }
      );
    }
    if (typeof settings.shipping.expressCents === "number") {
      await ShippingMethodModel.updateOne(
        { code: ShippingMethod.EXPRESS, baseRateCents: 2499 },
        {
          $set: {
            baseRateCents: settings.shipping.expressCents,
            etaLabel:
              settings.shipping.expressEta || "1–3 business days",
          },
        }
      );
    }
    if (settings.shipping.localPickupEnabled === false) {
      await ShippingMethodModel.updateOne(
        { code: ShippingMethod.LOCAL_PICKUP },
        { $set: { isActive: false } }
      );
    }
  }
}

function mapMethod(doc: {
  _id: unknown;
  code: string;
  name: string;
  description?: string | null;
  baseRateCents: number;
  etaLabel?: string | null;
  isPickup?: boolean | null;
  qualifiesForFreeShipping?: boolean | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}) {
  return {
    id: String(doc._id),
    code: doc.code,
    name: doc.name,
    description: doc.description ?? "",
    baseRateCents: doc.baseRateCents,
    etaLabel: doc.etaLabel ?? "",
    isPickup: Boolean(doc.isPickup),
    qualifiesForFreeShipping: Boolean(doc.qualifiesForFreeShipping),
    isActive: doc.isActive !== false,
    sortOrder: doc.sortOrder ?? 0,
  };
}

function mapZone(doc: {
  _id: unknown;
  key: string;
  name: string;
  provinces?: string[] | null;
  postalPrefixes?: string[] | null;
  isRemote?: boolean | null;
  remoteSurchargeCents?: number | null;
  rates?: Array<{
    methodCode: string;
    rateCents: number;
    etaLabel?: string | null;
    enabled?: boolean | null;
    perKgCents?: number | null;
    freeWeightGrams?: number | null;
  }> | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}) {
  return {
    id: String(doc._id),
    key: doc.key,
    name: doc.name,
    provinces: doc.provinces ?? [],
    postalPrefixes: doc.postalPrefixes ?? [],
    isRemote: Boolean(doc.isRemote),
    remoteSurchargeCents: doc.remoteSurchargeCents ?? 0,
    rates: (doc.rates ?? []).map((rate) => ({
      methodCode: rate.methodCode,
      rateCents: rate.rateCents,
      etaLabel: rate.etaLabel ?? "",
      enabled: rate.enabled !== false,
      perKgCents: rate.perKgCents ?? 0,
      freeWeightGrams: rate.freeWeightGrams ?? 0,
    })),
    isActive: doc.isActive !== false,
    sortOrder: doc.sortOrder ?? 0,
  };
}

export async function listShippingMethods(opts?: { activeOnly?: boolean }) {
  await ensureShippingDefaults();
  const filter = opts?.activeOnly ? { isActive: true } : {};
  const rows = await ShippingMethodModel.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return rows.map(mapMethod);
}

export async function listShippingZones(opts?: { activeOnly?: boolean }) {
  await ensureShippingDefaults();
  const filter = opts?.activeOnly ? { isActive: true } : {};
  const rows = await ShippingZoneModel.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return rows.map(mapZone);
}

export async function upsertShippingMethod(input: {
  id?: string;
  code: string;
  name: string;
  description?: string;
  baseRateCents: number;
  etaLabel?: string;
  isPickup?: boolean;
  qualifiesForFreeShipping?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const code = input.code.trim().toLowerCase();
  if (!code) throw new AppError(400, "INVALID_CODE", "Method code is required");

  if (input.id) {
    const updated = await ShippingMethodModel.findByIdAndUpdate(
      input.id,
      {
        $set: {
          code,
          name: input.name.trim(),
          description: input.description ?? "",
          baseRateCents: Math.max(0, Math.round(input.baseRateCents)),
          etaLabel: input.etaLabel ?? "",
          isPickup: Boolean(input.isPickup),
          qualifiesForFreeShipping: Boolean(input.qualifiesForFreeShipping),
          isActive: input.isActive !== false,
          sortOrder: input.sortOrder ?? 0,
        },
      },
      { new: true }
    ).lean();
    if (!updated) throw new AppError(404, "NOT_FOUND", "Shipping method not found");
    return mapMethod(updated);
  }

  const created = await ShippingMethodModel.create({
    code,
    name: input.name.trim(),
    description: input.description ?? "",
    baseRateCents: Math.max(0, Math.round(input.baseRateCents)),
    etaLabel: input.etaLabel ?? "",
    isPickup: Boolean(input.isPickup),
    qualifiesForFreeShipping: Boolean(input.qualifiesForFreeShipping),
    isActive: input.isActive !== false,
    sortOrder: input.sortOrder ?? 0,
  });
  return mapMethod(created.toObject());
}

export async function deleteShippingMethod(id: string) {
  const method = await ShippingMethodModel.findById(id);
  if (!method) throw new AppError(404, "NOT_FOUND", "Shipping method not found");
  if (
    method.code === ShippingMethod.STANDARD ||
    method.code === ShippingMethod.EXPRESS ||
    method.code === ShippingMethod.LOCAL_PICKUP
  ) {
    method.isActive = false;
    await method.save();
    return { id, deactivated: true };
  }
  await method.deleteOne();
  return { id, deleted: true };
}

export async function upsertShippingZone(input: {
  id?: string;
  key: string;
  name: string;
  provinces: string[];
  postalPrefixes?: string[];
  isRemote?: boolean;
  remoteSurchargeCents?: number;
  rates?: Array<{
    methodCode: string;
    rateCents: number;
    etaLabel?: string;
    enabled?: boolean;
    perKgCents?: number;
    freeWeightGrams?: number;
  }>;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const key = input.key.trim().toLowerCase();
  const payload = {
    key,
    name: input.name.trim(),
    provinces: (input.provinces ?? []).map((p) => p.toUpperCase()),
    postalPrefixes: (input.postalPrefixes ?? []).map((p) =>
      p.toUpperCase().replace(/\s+/g, "")
    ),
    isRemote: Boolean(input.isRemote),
    remoteSurchargeCents: Math.max(0, Math.round(input.remoteSurchargeCents ?? 0)),
    rates: (input.rates ?? []).map((rate) => ({
      methodCode: rate.methodCode.toLowerCase(),
      rateCents: Math.max(0, Math.round(rate.rateCents)),
      etaLabel: rate.etaLabel ?? "",
      enabled: rate.enabled !== false,
      perKgCents: Math.max(0, Math.round(rate.perKgCents ?? 0)),
      freeWeightGrams: Math.max(0, Math.round(rate.freeWeightGrams ?? 0)),
    })),
    isActive: input.isActive !== false,
    sortOrder: input.sortOrder ?? 0,
  };

  if (input.id) {
    const updated = await ShippingZoneModel.findByIdAndUpdate(
      input.id,
      { $set: payload },
      { new: true }
    ).lean();
    if (!updated) throw new AppError(404, "NOT_FOUND", "Shipping zone not found");
    return mapZone(updated);
  }

  const created = await ShippingZoneModel.create(payload);
  return mapZone(created.toObject());
}

export async function deleteShippingZone(id: string) {
  const zone = await ShippingZoneModel.findByIdAndDelete(id);
  if (!zone) throw new AppError(404, "NOT_FOUND", "Shipping zone not found");
  return { id, deleted: true };
}

export function findMatchingZone(
  zones: Array<ReturnType<typeof mapZone>>,
  province: string,
  postalCode?: string | null
) {
  const prov = province.toUpperCase();
  const compact = (postalCode ?? "")
    .toUpperCase()
    .replace(/\s+/g, "");

  // Prefer postal-prefix matches (remote / special rules) over province zones.
  if (compact) {
    const byPrefix = zones
      .filter(
        (zone) =>
          zone.isActive &&
          zone.postalPrefixes.some((prefix) => compact.startsWith(prefix))
      )
      .sort((a, b) => b.postalPrefixes[0]?.length - a.postalPrefixes[0]?.length);
    if (byPrefix[0]) return byPrefix[0];
  }

  return (
    zones.find(
      (zone) => zone.isActive && zone.provinces.includes(prov)
    ) ?? null
  );
}

export type ShippingQuoteInput = {
  methodCode: string;
  province: string;
  postalCode?: string | null;
  /** Merchandise subtotal after discounts, before tax/shipping */
  eligibleSubtotalCents: number;
  /** Total package weight in grams (0 if unknown) */
  weightGrams?: number;
  /** Sum of product additionalHandlingCents */
  handlingCents?: number;
};

export async function quoteShipping(input: ShippingQuoteInput) {
  await ensureShippingDefaults();
  const carrier = getManualCarrierAdapter();

  const [methods, zones, settings] = await Promise.all([
    listShippingMethods({ activeOnly: true }),
    listShippingZones({ activeOnly: true }),
    StoreSettingsModel.findOne({ key: "default" }).lean(),
  ]);

  const freeMin =
    settings?.shipping?.freeShippingMinimumCents ?? 20000;
  const pickupEnabled = settings?.shipping?.localPickupEnabled !== false;

  const availableMethods = methods
    .filter((method) => {
      if (method.isPickup && !pickupEnabled) return false;
      return method.isActive;
    })
    .map((method) => {
      const zone = method.isPickup
        ? null
        : findMatchingZone(zones, input.province, input.postalCode);

      let rateCents = method.baseRateCents;
      let etaLabel = method.etaLabel;
      let available = true;
      let zoneName: string | null = null;
      let remoteSurchargeCents = 0;

      if (method.isPickup) {
        rateCents = 0;
      } else if (zone) {
        zoneName = zone.name;
        const zoneRate = zone.rates.find(
          (rate) => rate.methodCode === method.code && rate.enabled
        );
        if (!zoneRate) {
          available = false;
        } else {
          rateCents = zoneRate.rateCents;
          if (zoneRate.etaLabel) etaLabel = zoneRate.etaLabel;
          if (
            zoneRate.perKgCents > 0 &&
            (input.weightGrams ?? 0) > zoneRate.freeWeightGrams
          ) {
            const billableGrams = Math.max(
              0,
              (input.weightGrams ?? 0) - zoneRate.freeWeightGrams
            );
            rateCents += Math.ceil(billableGrams / 1000) * zoneRate.perKgCents;
          }
          if (zone.isRemote || zone.remoteSurchargeCents > 0) {
            remoteSurchargeCents = zone.remoteSurchargeCents;
            rateCents += remoteSurchargeCents;
          }
        }
      }

      rateCents += Math.max(0, input.handlingCents ?? 0);

      let freeShippingApplied = false;
      if (
        method.qualifiesForFreeShipping &&
        freeMin > 0 &&
        input.eligibleSubtotalCents >= freeMin
      ) {
        rateCents = 0;
        freeShippingApplied = true;
        remoteSurchargeCents = 0;
      }

      return {
        ...method,
        available,
        rateCents: available ? rateCents : null,
        etaLabel,
        zoneName,
        remoteSurchargeCents: freeShippingApplied ? 0 : remoteSurchargeCents,
        freeShippingApplied,
        carrier: carrier.name,
      };
    });

  const selected = availableMethods.find(
    (method) => method.code === input.methodCode
  );

  if (!selected) {
    throw new AppError(
      400,
      "SHIPPING_METHOD_UNAVAILABLE",
      "Selected shipping method is not available"
    );
  }
  if (!selected.available || selected.rateCents === null) {
    throw new AppError(
      400,
      "SHIPPING_UNAVAILABLE",
      "Shipping is not available for this destination with the selected method"
    );
  }

  const amountUntilFreeCents = Math.max(
    0,
    freeMin - input.eligibleSubtotalCents
  );

  return {
    shippingCents: selected.rateCents,
    selected,
    availableMethods,
    freeShippingMinimumCents: freeMin,
    amountUntilFreeCents,
    qualifiesForFreeShipping: amountUntilFreeCents === 0 && freeMin > 0,
    zoneName: selected.zoneName,
    snapshot: {
      methodCode: selected.code,
      methodName: selected.name,
      rateCents: selected.rateCents,
      etaLabel: selected.etaLabel,
      zoneName: selected.zoneName,
      freeShippingApplied: selected.freeShippingApplied,
      remoteSurchargeCents: selected.remoteSurchargeCents,
      postalCode: input.postalCode
        ? formatCanadianPostalCode(input.postalCode)
        : null,
      province: input.province.toUpperCase(),
      calculatedAt: new Date().toISOString(),
    },
  };
}

export async function getPublicShippingConfig() {
  await ensureShippingDefaults();
  const [methods, settings] = await Promise.all([
    listShippingMethods({ activeOnly: true }),
    StoreSettingsModel.findOne({ key: "default" }).lean(),
  ]);

  return {
    methods: methods.map((method) => ({
      code: method.code,
      name: method.name,
      description: method.description,
      baseRateCents: method.baseRateCents,
      etaLabel: method.etaLabel,
      isPickup: method.isPickup,
      qualifiesForFreeShipping: method.qualifiesForFreeShipping,
    })),
    freeShippingMinimumCents:
      settings?.shipping?.freeShippingMinimumCents ?? 20000,
    localPickupEnabled: settings?.shipping?.localPickupEnabled !== false,
    pickupInstructions:
      settings?.shipping?.pickupInstructions ??
      "We will confirm pickup readiness by phone or email after your order is paid.",
    pickupHours: (settings?.shipping as { pickupHours?: string } | undefined)
      ?.pickupHours ?? "By appointment — we confirm after payment",
    processingDays:
      (settings?.shipping as { processingDays?: number } | undefined)
        ?.processingDays ?? 2,
    handlingDays:
      (settings?.shipping as { handlingDays?: number } | undefined)
        ?.handlingDays ?? 1,
  };
}
