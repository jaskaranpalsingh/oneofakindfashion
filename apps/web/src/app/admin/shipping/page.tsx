"use client";

import { useCallback, useEffect, useState } from "react";
import { CANADIAN_PROVINCES, formatCad } from "@ookf/shared";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

type ShippingMethodRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  baseRateCents: number;
  etaLabel: string;
  isPickup: boolean;
  qualifiesForFreeShipping: boolean;
  isActive: boolean;
  sortOrder: number;
};

type ZoneRate = {
  methodCode: string;
  rateCents: number;
  etaLabel: string;
  enabled: boolean;
  perKgCents: number;
  freeWeightGrams: number;
};

type ShippingZoneRow = {
  id: string;
  key: string;
  name: string;
  provinces: string[];
  postalPrefixes: string[];
  isRemote: boolean;
  remoteSurchargeCents: number;
  rates: ZoneRate[];
  isActive: boolean;
  sortOrder: number;
};

const fieldClass =
  "mt-1 w-full border border-[#E5DFD4] bg-white px-3 py-2 text-sm text-[#003F2D]";
const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]";

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethodRow[]>([]);
  const [zones, setZones] = useState<ShippingZoneRow[]>([]);
  const [settings, setSettings] = useState<{
    freeShippingMinimumCents: number;
    localPickupEnabled: boolean;
    pickupInstructions: string;
    pickupHours: string;
    processingDays: number;
    handlingDays: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [methodsRes, zonesRes, settingsRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/v1/admin/shipping/methods`, {
          credentials: "include",
        }),
        fetch(`${getApiBaseUrl()}/api/v1/admin/shipping/zones`, {
          credentials: "include",
        }),
        fetch(`${getApiBaseUrl()}/api/v1/admin/settings`, {
          credentials: "include",
        }),
      ]);
      const methodsJson = await methodsRes.json();
      const zonesJson = await zonesRes.json();
      const settingsJson = await settingsRes.json();
      if (!methodsRes.ok || !methodsJson.success) {
        throw new Error(methodsJson?.error?.message ?? "Failed to load methods");
      }
      if (!zonesRes.ok || !zonesJson.success) {
        throw new Error(zonesJson?.error?.message ?? "Failed to load zones");
      }
      if (!settingsRes.ok || !settingsJson.success) {
        throw new Error(settingsJson?.error?.message ?? "Failed to load settings");
      }
      setMethods(methodsJson.data as ShippingMethodRow[]);
      setZones(zonesJson.data as ShippingZoneRow[]);
      const shipping = settingsJson.data.shipping as {
        freeShippingMinimumCents: number;
        localPickupEnabled: boolean;
        pickupInstructions: string;
        pickupHours?: string;
        processingDays?: number;
        handlingDays?: number;
      };
      setSettings({
        freeShippingMinimumCents: shipping.freeShippingMinimumCents,
        localPickupEnabled: shipping.localPickupEnabled,
        pickupInstructions: shipping.pickupInstructions,
        pickupHours: shipping.pickupHours ?? "",
        processingDays: shipping.processingDays ?? 2,
        handlingDays: shipping.handlingDays ?? 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shipping");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: {
            freeShippingMinimumCents: settings.freeShippingMinimumCents,
            localPickupEnabled: settings.localPickupEnabled,
            pickupInstructions: settings.pickupInstructions,
            pickupHours: settings.pickupHours,
            processingDays: settings.processingDays,
            handlingDays: settings.handlingDays,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to save settings");
      }
      setMessage("Shipping settings saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveMethod(method: ShippingMethodRow) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/shipping/methods`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(method),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to save method");
      }
      setMessage(`Saved method ${method.name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save method");
    } finally {
      setSaving(false);
    }
  }

  async function saveZone(zone: ShippingZoneRow) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/shipping/zones`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zone),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to save zone");
      }
      setMessage(`Saved zone ${zone.name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save zone");
    } finally {
      setSaving(false);
    }
  }

  async function removeZone(id: string) {
    if (!window.confirm("Delete this shipping zone?")) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/shipping/zones/${id}`,
        { method: "DELETE", credentials: "include" }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to delete zone");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete zone");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#6B726E]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading shipping…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C49A36]">
          Fulfilment
        </p>
        <h1 className="font-serif text-3xl text-[#003F2D]">Shipping</h1>
        <p className="mt-1 text-sm text-[#6B726E]">
          Canada-wide methods, zones and free-shipping rules. Rates sync to
          checkout automatically.
        </p>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-[#C49A36]/40 bg-[#C49A36]/10 px-4 py-3 text-sm text-[#003F2D]">
          {message}
        </p>
      ) : null}

      {settings ? (
        <section className="border border-[#E5DFD4] bg-white p-5">
          <h2 className="font-serif text-2xl text-[#003F2D]">Store shipping rules</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Free standard shipping threshold (CAD)
              <input
                type="number"
                min={0}
                step={0.01}
                className={fieldClass}
                value={(settings.freeShippingMinimumCents / 100).toFixed(2)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    freeShippingMinimumCents: Math.round(
                      Number(e.target.value || 0) * 100
                    ),
                  })
                }
              />
            </label>
            <label className={labelClass}>
              Processing days
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={settings.processingDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    processingDays: Number(e.target.value || 0),
                  })
                }
              />
            </label>
            <label className={labelClass}>
              Handling days
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={settings.handlingDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    handlingDays: Number(e.target.value || 0),
                  })
                }
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Pickup hours
              <input
                className={fieldClass}
                value={settings.pickupHours}
                onChange={(e) =>
                  setSettings({ ...settings, pickupHours: e.target.value })
                }
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-[#003F2D]">
              <input
                type="checkbox"
                checked={settings.localPickupEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    localPickupEnabled: e.target.checked,
                  })
                }
              />
              Local pickup enabled
            </label>
            <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
              Pickup instructions
              <textarea
                rows={3}
                className={fieldClass}
                value={settings.pickupInstructions}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pickupInstructions: e.target.value,
                  })
                }
              />
            </label>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSettings()}
            className="mt-4 inline-flex h-10 items-center bg-[#003F2D] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
          >
            Save rules
          </button>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#003F2D]">Shipping methods</h2>
        {methods.map((method, index) => (
          <div key={method.id} className="border border-[#E5DFD4] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className={labelClass}>
                Name
                <input
                  className={fieldClass}
                  value={method.name}
                  onChange={(e) => {
                    const next = [...methods];
                    next[index] = { ...method, name: e.target.value };
                    setMethods(next);
                  }}
                />
              </label>
              <label className={labelClass}>
                Code
                <input className={fieldClass} value={method.code} disabled />
              </label>
              <label className={labelClass}>
                Base rate (CAD)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={fieldClass}
                  value={(method.baseRateCents / 100).toFixed(2)}
                  onChange={(e) => {
                    const next = [...methods];
                    next[index] = {
                      ...method,
                      baseRateCents: Math.round(Number(e.target.value || 0) * 100),
                    };
                    setMethods(next);
                  }}
                />
              </label>
              <label className={labelClass}>
                ETA label
                <input
                  className={fieldClass}
                  value={method.etaLabel}
                  onChange={(e) => {
                    const next = [...methods];
                    next[index] = { ...method, etaLabel: e.target.value };
                    setMethods(next);
                  }}
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#003F2D]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={method.isActive}
                  onChange={(e) => {
                    const next = [...methods];
                    next[index] = { ...method, isActive: e.target.checked };
                    setMethods(next);
                  }}
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={method.qualifiesForFreeShipping}
                  onChange={(e) => {
                    const next = [...methods];
                    next[index] = {
                      ...method,
                      qualifiesForFreeShipping: e.target.checked,
                    };
                    setMethods(next);
                  }}
                />
                Qualifies for free shipping threshold
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={method.isPickup} disabled />
                Local pickup
              </label>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveMethod(method)}
              className="mt-3 inline-flex h-9 items-center border border-[#E5DFD4] px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
            >
              Save method
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-[#003F2D]">Shipping zones</h2>
          <button
            type="button"
            onClick={() =>
              setZones((current) => [
                ...current,
                {
                  id: "",
                  key: `zone-${Date.now()}`,
                  name: "New zone",
                  provinces: ["AB"],
                  postalPrefixes: [],
                  isRemote: false,
                  remoteSurchargeCents: 0,
                  rates: [
                    {
                      methodCode: "standard",
                      rateCents: 1499,
                      etaLabel: "3–7 business days",
                      enabled: true,
                      perKgCents: 0,
                      freeWeightGrams: 0,
                    },
                    {
                      methodCode: "express",
                      rateCents: 2499,
                      etaLabel: "1–3 business days",
                      enabled: true,
                      perKgCents: 0,
                      freeWeightGrams: 0,
                    },
                  ],
                  isActive: true,
                  sortOrder: current.length + 1,
                },
              ])
            }
            className="inline-flex h-9 items-center gap-2 border border-[#E5DFD4] bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add zone
          </button>
        </div>

        {zones.map((zone, index) => (
          <div key={zone.id || zone.key} className="border border-[#E5DFD4] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Zone name
                <input
                  className={fieldClass}
                  value={zone.name}
                  onChange={(e) => {
                    const next = [...zones];
                    next[index] = { ...zone, name: e.target.value };
                    setZones(next);
                  }}
                />
              </label>
              <label className={labelClass}>
                Key
                <input
                  className={fieldClass}
                  value={zone.key}
                  onChange={(e) => {
                    const next = [...zones];
                    next[index] = { ...zone, key: e.target.value };
                    setZones(next);
                  }}
                />
              </label>
            </div>
            <fieldset className="mt-3">
              <legend className={labelClass}>Provinces / territories</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CANADIAN_PROVINCES.map((province) => {
                  const checked = zone.provinces.includes(province.code);
                  return (
                    <label
                      key={province.code}
                      className="inline-flex items-center gap-1.5 border border-[#E5DFD4] px-2 py-1 text-xs text-[#003F2D]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = [...zones];
                          const provinces = checked
                            ? zone.provinces.filter((code) => code !== province.code)
                            : [...zone.provinces, province.code];
                          next[index] = { ...zone, provinces };
                          setZones(next);
                        }}
                      />
                      {province.code}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <label className={`${labelClass} mt-3`}>
              Postal prefixes (comma-separated FSAs for remote rules)
              <input
                className={fieldClass}
                value={zone.postalPrefixes.join(", ")}
                onChange={(e) => {
                  const next = [...zones];
                  next[index] = {
                    ...zone,
                    postalPrefixes: e.target.value
                      .split(",")
                      .map((part) => part.trim().toUpperCase())
                      .filter(Boolean),
                  };
                  setZones(next);
                }}
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {zone.rates.map((rate, rateIndex) => (
                <div key={rate.methodCode} className="border border-[#E5DFD4] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
                    {rate.methodCode}
                  </p>
                  <label className={`${labelClass} mt-2`}>
                    Rate (CAD)
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className={fieldClass}
                      value={(rate.rateCents / 100).toFixed(2)}
                      onChange={(e) => {
                        const next = [...zones];
                        const rates = [...zone.rates];
                        rates[rateIndex] = {
                          ...rate,
                          rateCents: Math.round(Number(e.target.value || 0) * 100),
                        };
                        next[index] = { ...zone, rates };
                        setZones(next);
                      }}
                    />
                  </label>
                  <label className={`${labelClass} mt-2`}>
                    ETA
                    <input
                      className={fieldClass}
                      value={rate.etaLabel}
                      onChange={(e) => {
                        const next = [...zones];
                        const rates = [...zone.rates];
                        rates[rateIndex] = { ...rate, etaLabel: e.target.value };
                        next[index] = { ...zone, rates };
                        setZones(next);
                      }}
                    />
                  </label>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-[#003F2D]">
                    <input
                      type="checkbox"
                      checked={rate.enabled}
                      onChange={(e) => {
                        const next = [...zones];
                        const rates = [...zone.rates];
                        rates[rateIndex] = { ...rate, enabled: e.target.checked };
                        next[index] = { ...zone, rates };
                        setZones(next);
                      }}
                    />
                    Enabled in this zone
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-[#003F2D]">
                <input
                  type="checkbox"
                  checked={zone.isRemote}
                  onChange={(e) => {
                    const next = [...zones];
                    next[index] = { ...zone, isRemote: e.target.checked };
                    setZones(next);
                  }}
                />
                Remote area
              </label>
              <label className={labelClass}>
                Remote surcharge
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={fieldClass}
                  value={(zone.remoteSurchargeCents / 100).toFixed(2)}
                  onChange={(e) => {
                    const next = [...zones];
                    next[index] = {
                      ...zone,
                      remoteSurchargeCents: Math.round(
                        Number(e.target.value || 0) * 100
                      ),
                    };
                    setZones(next);
                  }}
                />
              </label>
              <p className="text-xs text-[#6B726E]">
                Current standard:{" "}
                {formatCad(
                  zone.rates.find((rate) => rate.methodCode === "standard")
                    ?.rateCents ?? 0
                )}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveZone(zone)}
                className="inline-flex h-9 items-center bg-[#003F2D] px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
              >
                Save zone
              </button>
              {zone.id ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removeZone(zone.id)}
                  className="inline-flex h-9 items-center gap-1 border border-red-200 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <p className="text-xs text-[#6B726E]">
        Live carrier APIs (Canada Post, UPS, FedEx, Purolator) are prepared as
        adapters but only activate when credentials are configured. Checkout uses
        these admin rates until then.
      </p>
    </div>
  );
}
