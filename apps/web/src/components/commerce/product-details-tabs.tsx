"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatCad } from "@ookf/shared";
import type { ProductDetail } from "@/lib/catalogue";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabId = "details" | "shipping" | "care";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "details", label: "Details" },
  { id: "shipping", label: "Shipping & Returns" },
  { id: "care", label: "Care Instructions" },
];

const CLOTHING_SPEC_LABELS: Record<string, string> = {
  fabric: "Fabric",
  workType: "Work Type",
  sleeveStyle: "Sleeve Style",
  stitchingType: "Stitching Type",
  occasion: "Occasion",
  embroideryDetails: "Embroidery",
  neckDesign: "Neck Design",
  dupattaIncluded: "Dupatta Included",
  sizeChartRef: "Size Chart",
};

const JEWELLERY_SPEC_LABELS: Record<string, string> = {
  jewelleryType: "Jewellery Type",
  material: "Material",
  finishColour: "Finish",
  stoneType: "Stone Type",
  size: "Size",
  dimensions: "Dimensions",
  weight: "Weight",
};

function formatSpecValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value).trim();
  if (!text) return null;
  return text;
}

function collectSpecs(
  attrs: Record<string, unknown> | null | undefined,
  labels: Record<string, string>
): Array<{ label: string; value: string }> {
  if (!attrs) return [];
  const rows: Array<{ label: string; value: string }> = [];
  for (const [key, label] of Object.entries(labels)) {
    if (key === "careInstructions") continue;
    const formatted = formatSpecValue(attrs[key]);
    if (formatted) rows.push({ label, value: formatted });
  }
  return rows;
}

function ShippingReturnsPanel() {
  const [config, setConfig] = useState<{
    freeShippingMinimumCents: number;
    localPickupEnabled: boolean;
    methods: Array<{
      name: string;
      baseRateCents: number;
      etaLabel: string;
      isPickup: boolean;
    }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/shipping/config`,
          { credentials: "include" }
        );
        const json = await response.json();
        if (!cancelled && response.ok && json.success) {
          setConfig(json.data);
        }
      } catch {
        // Keep static fallback copy below.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-xl space-y-4 text-sm leading-relaxed text-[#252A27]">
      <p>Ships within Canada. International shipping is not available.</p>
      {config ? (
        <ul className="space-y-2 text-[#656B68]">
          {config.methods
            .filter((method) => !method.isPickup)
            .map((method) => (
              <li key={method.name}>
                {method.name}
                {method.baseRateCents > 0
                  ? ` from ${formatCad(method.baseRateCents)}`
                  : ""}
                {method.etaLabel ? ` · ${method.etaLabel}` : ""}
              </li>
            ))}
          <li>
            Free standard shipping from{" "}
            {formatCad(config.freeShippingMinimumCents)} merchandise subtotal
            (after discounts).
          </li>
          {config.localPickupEnabled ? (
            <li>Edmonton local pickup available at checkout.</li>
          ) : null}
        </ul>
      ) : (
        <p className="text-[#656B68]">
          Shipping rates and delivery timing are confirmed at checkout based on
          your destination.
        </p>
      )}
      <ul className="space-y-2 text-[#656B68]">
        <li>
          <Link
            href="/shipping-policy"
            className="font-medium text-[#003F2D] underline-offset-4 hover:underline"
          >
            Shipping Policy
          </Link>
        </li>
        <li>
          <Link
            href="/returns"
            className="font-medium text-[#003F2D] underline-offset-4 hover:underline"
          >
            Returns
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function ProductDetailsTabs({ product }: { product: ProductDetail }) {
  const baseId = useId();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<TabId>("details");

  const specs =
    product.productType === "jewellery"
      ? collectSpecs(product.jewellery, JEWELLERY_SPEC_LABELS)
      : collectSpecs(product.clothing, CLOTHING_SPEC_LABELS);

  const careText =
    product.productType === "jewellery"
      ? formatSpecValue(product.jewellery?.careInstructions)
      : formatSpecValue(product.clothing?.careInstructions);

  const description =
    product.description?.trim() ||
    product.shortDescription?.trim() ||
    null;

  return (
    <div className="mt-10 border-t border-[#E5E1D9] pt-8">
      <div
        role="tablist"
        aria-label="Product information"
        className="flex flex-wrap gap-x-8 gap-y-3 border-b border-[#E5E1D9]"
      >
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`${baseId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => {
                const order = TABS.map((item) => item.id);
                const current = order.indexOf(active);
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  setActive(order[(current + 1) % order.length]!);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  setActive(order[(current - 1 + order.length) % order.length]!);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  setActive(order[0]!);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  setActive(order[order.length - 1]!);
                }
              }}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D] focus-visible:ring-offset-2",
                selected ? "text-[#003F2D]" : "text-[#656B68] hover:text-[#003F2D]"
              )}
            >
              {tab.label}
              {selected ? (
                <motion.span
                  layoutId={reduceMotion ? undefined : `${baseId}-tab-underline`}
                  className="absolute inset-x-0 -bottom-px h-[2px] bg-[#B68A25]"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            role="tabpanel"
            id={`${baseId}-${active}-panel`}
            aria-labelledby={`${baseId}-${active}-tab`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {active === "details" ? (
              <div className="space-y-6">
                {description ? (
                  <p className="font-serif text-lg leading-relaxed text-[#252A27]/90 italic sm:text-xl">
                    {description}
                  </p>
                ) : (
                  <p className="text-sm text-[#656B68]">
                    Product details will appear here once added by the store.
                  </p>
                )}

                {specs.length > 0 ? (
                  <dl className="grid gap-0 sm:grid-cols-2 sm:gap-x-10">
                    {specs.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-[#E5E1D9] py-3.5 text-sm"
                      >
                        <dt className="font-semibold text-[#003F2D]">{row.label}</dt>
                        <dd className="text-[#252A27]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            ) : null}

            {active === "shipping" ? (
              <ShippingReturnsPanel />
            ) : null}

            {active === "care" ? (
              <div className="max-w-xl text-sm leading-relaxed text-[#252A27]">
                {careText ? (
                  <p className="whitespace-pre-wrap">{careText}</p>
                ) : (
                  <p className="text-[#656B68]">
                    Care instructions for this piece will appear here when configured
                    for the product.
                  </p>
                )}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
