"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

type StoreSettings = {
  storeName: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  currency: string;
  announcementBarText: string;
  socialLinks?: {
    instagram?: string | null;
    facebook?: string | null;
    pinterest?: string | null;
    tiktok?: string | null;
  };
  shipping: {
    standardCents: number;
    expressCents: number;
    freeShippingMinimumCents: number;
    localPickupEnabled: boolean;
    standardEta?: string;
    expressEta?: string;
    pickupInstructions?: string;
  };
  taxRules?: Array<{ province: string; name: string; rateBps: number }>;
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminFetch<StoreSettings>("/api/v1/admin/settings"),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm({
        ...settingsQuery.data,
        taxRules: settingsQuery.data.taxRules ?? [],
        socialLinks: {
          instagram: settingsQuery.data.socialLinks?.instagram ?? null,
          facebook: settingsQuery.data.socialLinks?.facebook ?? null,
          pinterest: settingsQuery.data.socialLinks?.pinterest ?? null,
          tiktok: settingsQuery.data.socialLinks?.tiktok ?? null,
        },
      });
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminFetch("/api/v1/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      }),
    onSuccess: async () => {
      setMessage("Settings saved. Storefront will reflect changes on refresh.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      await queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  if (settingsQuery.isError) {
    return (
      <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {(settingsQuery.error as Error).message}
      </p>
    );
  }

  if (!form) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Store configuration stored in MongoDB and used by checkout and
          storefront.
        </p>
      </div>

      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 border border-border bg-white p-5 md:grid-cols-2">
        {(
          [
            ["storeName", "Store name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["addressLine1", "Address"],
            ["city", "City"],
            ["province", "Province"],
            ["postalCode", "Postal code"],
            ["country", "Country"],
            ["currency", "Currency"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
          >
            {label}
            <input
              value={String(form[key] ?? "")}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? { ...current, [key]: event.target.value }
                    : current
                )
              }
              className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
            />
          </label>
        ))}

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted md:col-span-2">
          Announcement bar
          <input
            value={form.announcementBarText}
            onChange={(event) =>
              setForm((current) =>
                current
                  ? { ...current, announcementBarText: event.target.value }
                  : current
              )
            }
            className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          />
        </label>

        <div className="md:col-span-2 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Shipping & pickup
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {(
              [
                ["standardCents", "Standard shipping (cents)"],
                ["expressCents", "Express shipping (cents)"],
                ["freeShippingMinimumCents", "Free shipping minimum (cents)"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
              >
                {label}
                <input
                  type="number"
                  min={0}
                  value={form.shipping[key]}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            shipping: {
                              ...current.shipping,
                              [key]: Number(event.target.value) || 0,
                            },
                          }
                        : current
                    )
                  }
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Standard ETA
              <input
                value={form.shipping.standardEta ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          shipping: {
                            ...current.shipping,
                            standardEta: event.target.value,
                          },
                        }
                      : current
                  )
                }
                className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Express ETA
              <input
                value={form.shipping.expressEta ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          shipping: {
                            ...current.shipping,
                            expressEta: event.target.value,
                          },
                        }
                      : current
                  )
                }
                className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
              />
            </label>
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Pickup instructions
            <textarea
              rows={3}
              value={form.shipping.pickupInstructions ?? ""}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        shipping: {
                          ...current.shipping,
                          pickupInstructions: event.target.value,
                        },
                      }
                    : current
                )
              }
              className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
            />
          </label>
          <label className="mt-4 flex items-center gap-2 text-sm text-green">
            <input
              type="checkbox"
              checked={form.shipping.localPickupEnabled}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        shipping: {
                          ...current.shipping,
                          localPickupEnabled: event.target.checked,
                        },
                      }
                    : current
                )
              }
            />
            Local pickup enabled
          </label>
        </div>

        <div className="md:col-span-2 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Tax rules (Canada)
          </p>
          <p className="mt-1 text-xs text-muted">
            Enter only rates that apply to your tax registration. Rate is in
            basis points (500 = 5%). Leave empty for no tax until configured.
          </p>
          <div className="mt-3 space-y-3">
            {(form.taxRules ?? []).map((rule, index) => (
              <div
                key={`tax-${index}`}
                className="grid gap-3 sm:grid-cols-[100px_1fr_140px_auto]"
              >
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Province
                  <input
                    value={rule.province}
                    maxLength={2}
                    placeholder="AB"
                    onChange={(event) =>
                      setForm((current) => {
                        if (!current) return current;
                        const taxRules = [...(current.taxRules ?? [])];
                        taxRules[index] = {
                          ...taxRules[index],
                          province: event.target.value.toUpperCase(),
                        };
                        return { ...current, taxRules };
                      })
                    }
                    className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Name
                  <input
                    value={rule.name}
                    placeholder="GST"
                    onChange={(event) =>
                      setForm((current) => {
                        if (!current) return current;
                        const taxRules = [...(current.taxRules ?? [])];
                        taxRules[index] = {
                          ...taxRules[index],
                          name: event.target.value,
                        };
                        return { ...current, taxRules };
                      })
                    }
                    className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Rate (bps)
                  <input
                    type="number"
                    min={0}
                    value={rule.rateBps}
                    onChange={(event) =>
                      setForm((current) => {
                        if (!current) return current;
                        const taxRules = [...(current.taxRules ?? [])];
                        taxRules[index] = {
                          ...taxRules[index],
                          rateBps: Number(event.target.value) || 0,
                        };
                        return { ...current, taxRules };
                      })
                    }
                    className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            taxRules: (current.taxRules ?? []).filter(
                              (_, i) => i !== index
                            ),
                          }
                        : current
                    )
                  }
                  className="self-end border border-border px-3 py-2 text-xs uppercase tracking-[0.12em] text-muted hover:text-ink"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((current) =>
                current
                  ? {
                      ...current,
                      taxRules: [
                        ...(current.taxRules ?? []),
                        { province: "AB", name: "GST", rateBps: 0 },
                      ],
                    }
                  : current
              )
            }
            className="mt-3 border border-border px-3 py-2 text-xs uppercase tracking-[0.12em] text-green hover:border-gold"
          >
            Add tax rule
          </button>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Social links (footer)
          </p>
          <p className="mt-1 text-xs text-muted">
            Leave blank to hide an icon. Only valid https URLs are shown.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {(
              [
                ["instagram", "Instagram URL"],
                ["facebook", "Facebook URL"],
                ["pinterest", "Pinterest URL"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
              >
                {label}
                <input
                  type="url"
                  placeholder="https://"
                  value={String(form.socialLinks?.[key] ?? "")}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            socialLinks: {
                              ...current.socialLinks,
                              [key]: event.target.value.trim() || null,
                            },
                          }
                        : current
                    )
                  }
                  className="mt-1 w-full border border-border px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
        className="bg-green px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-green-emerald disabled:opacity-50"
      >
        {saveMutation.isPending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
