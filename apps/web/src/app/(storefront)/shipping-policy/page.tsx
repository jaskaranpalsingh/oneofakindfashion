import { DEFAULT_STORE, formatCad } from "@ookf/shared";
import {
  PolicyPage,
  PolicySection,
} from "@/components/content/policy-page";
import { getApiBaseUrl } from "@/lib/api";

export const metadata = {
  title: "Shipping Policy",
  description:
    "Shipping, delivery estimates, and local pickup information for ONE OF A KIND FASHION.",
};

async function loadShipping() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/shipping/config`, {
      next: { revalidate: 60 },
    });
    const json = await response.json();
    if (!response.ok || !json.success) return null;
    return json.data as {
      methods: Array<{
        code: string;
        name: string;
        baseRateCents: number;
        etaLabel: string;
        isPickup: boolean;
        qualifiesForFreeShipping: boolean;
      }>;
      freeShippingMinimumCents: number;
      localPickupEnabled: boolean;
      pickupInstructions: string;
      pickupHours: string;
      processingDays: number;
    };
  } catch {
    return null;
  }
}

export default async function ShippingPolicyPage() {
  const shipping = await loadShipping();
  const standard = shipping?.methods.find((method) => method.code === "standard");
  const express = shipping?.methods.find((method) => method.code === "express");
  const freeMin = shipping?.freeShippingMinimumCents ?? 20000;

  return (
    <PolicyPage
      title="Shipping policy"
      description="How we deliver orders across Canada and offer local pickup in Edmonton."
    >
      <PolicySection title="Shipping destinations">
        <p>
          We ship within Canada only to all provinces and territories supported
          in checkout. International addresses cannot be submitted. Shipping
          charges are calculated from your province, postal code, cart total and
          selected method.
        </p>
      </PolicySection>

      <PolicySection title="Delivery methods">
        <ul className="list-disc space-y-2 pl-5">
          {standard ? (
            <li>
              <strong>{standard.name}</strong>
              {standard.baseRateCents > 0
                ? ` from ${formatCad(standard.baseRateCents)}`
                : ""}
              {standard.etaLabel ? ` · ${standard.etaLabel}` : ""}. Zone rates may
              vary.
            </li>
          ) : null}
          {express ? (
            <li>
              <strong>{express.name}</strong>
              {express.baseRateCents > 0
                ? ` from ${formatCad(express.baseRateCents)}`
                : ""}
              {express.etaLabel ? ` · ${express.etaLabel}` : ""}. Express is not
              waived by the free-shipping threshold.
            </li>
          ) : null}
          {shipping?.localPickupEnabled ? (
            <li>
              <strong>Free local pickup</strong> in Edmonton at{" "}
              {DEFAULT_STORE.addressLine1}.
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-sm text-[#6B726E]">
          Estimates are guidance based on current store settings and can vary with
          carrier performance and destination. They are not guaranteed delivery
          commitments.
        </p>
      </PolicySection>

      <PolicySection title="Free shipping">
        <p>
          Free standard shipping may apply when your merchandise subtotal
          (after discounts, before tax and shipping) meets{" "}
          {formatCad(freeMin)}. Remote-area rules or excluded shipping classes
          may still apply when configured by the store.
        </p>
      </PolicySection>

      <PolicySection title="Order processing">
        <p>
          Orders are typically prepared within{" "}
          {shipping?.processingDays ?? 2} business day
          {(shipping?.processingDays ?? 2) === 1 ? "" : "s"} after payment
          confirmation, before carrier transit begins.
        </p>
      </PolicySection>

      <PolicySection title="Local pickup">
        <p>
          Pickup is available at {DEFAULT_STORE.addressLine1},{" "}
          {DEFAULT_STORE.city}, {DEFAULT_STORE.province}{" "}
          {DEFAULT_STORE.postalCode}
          {shipping?.pickupHours ? ` · ${shipping.pickupHours}` : ""}.{" "}
          {shipping?.pickupInstructions}
        </p>
        <p className="mt-2">
          We only mark an order ready for pickup after staff confirmation — you
          will be notified when it is available.
        </p>
      </PolicySection>

      <PolicySection title="Order tracking">
        <p>
          After your order ships, tracking details appear on your order
          confirmation and the{" "}
          <a href="/track-order" className="text-[#003F2D] underline-offset-4 hover:underline">
            Track order
          </a>{" "}
          page when a carrier tracking number is available.
        </p>
      </PolicySection>

      <PolicySection title="Address accuracy & delays">
        <p>
          Please double-check your shipping address and postal code. Incorrect
          addresses may delay delivery or incur return costs. Lost or delayed
          shipments are investigated with the carrier using the tracking
          information on file.
        </p>
      </PolicySection>

      <PolicySection title="Customer support">
        <p>
          Questions about delivery? Contact us at {DEFAULT_STORE.email} or{" "}
          {DEFAULT_STORE.phone}.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
