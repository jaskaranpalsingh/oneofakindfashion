"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const SHIP_STEPS = [
  "awaiting_fulfillment",
  "processing",
  "packed",
  "shipped",
  "delivered",
] as const;

const PICKUP_STEPS = [
  "awaiting_fulfillment",
  "preparing_pickup",
  "ready_for_pickup",
  "collected",
] as const;

function stepIndex(status: string, pickup: boolean) {
  const steps: readonly string[] = pickup ? PICKUP_STEPS : SHIP_STEPS;
  const aliases: Record<string, string> = {
    pending_payment: steps[0],
    confirmed: steps[0],
    in_transit: "shipped",
    out_for_delivery: "shipped",
    processing: pickup ? "preparing_pickup" : "processing",
    cancelled: steps[0],
    refunded: steps[0],
  };
  const normalized = aliases[status] ?? status;
  const index = steps.indexOf(normalized);
  return index < 0 ? 0 : index;
}

export function OrderTimeline({
  fulfillmentStatus,
  shippingMethod,
  trackingNumber,
  trackingUrl,
  shippingCarrier,
  events,
}: {
  fulfillmentStatus: string;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippingCarrier?: string | null;
  events?: Array<{ type: string; message: string; createdAt?: string | null }>;
}) {
  const isPickup = shippingMethod === "local_pickup";
  const steps = isPickup ? PICKUP_STEPS : SHIP_STEPS;
  const labels = isPickup
    ? ["Order confirmed", "Preparing order", "Ready for pickup", "Collected"]
    : ["Order confirmed", "Processing", "Packed", "Shipped", "Delivered"];
  const active = useMemo(
    () => stepIndex(fulfillmentStatus, isPickup),
    [fulfillmentStatus, isPickup]
  );
  const terminal =
    fulfillmentStatus === "cancelled" || fulfillmentStatus === "refunded";

  return (
    <div className="space-y-5">
      {terminal ? (
        <p className="border border-[#E5DFD4] bg-[#FAF7F0] px-3 py-2 text-sm capitalize text-[#003F2D]">
          Order {fulfillmentStatus.replaceAll("_", " ")}
        </p>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-5">
          {steps.map((step, index) => {
            const done = index <= active;
            return (
              <li
                key={step}
                className={cn(
                  "border px-3 py-2 text-center text-xs transition duration-200",
                  done
                    ? "border-[#003F2D] bg-[#003F2D] text-[#FFF9EF]"
                    : "border-[#E5DFD4] bg-white text-[#6B6458]"
                )}
              >
                {labels[index]}
              </li>
            );
          })}
        </ol>
      )}

      {trackingNumber ? (
        <p className="text-sm text-[#4A453C]">
          {shippingCarrier ? `${shippingCarrier} · ` : "Tracking · "}
          {trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#003F2D] underline"
            >
              {trackingNumber}
            </a>
          ) : (
            trackingNumber
          )}
        </p>
      ) : null}

      {events && events.length > 0 ? (
        <ul className="space-y-2 border-t border-[#E5DFD4] pt-4">
          {[...events].reverse().map((event, index) => (
            <li key={`${event.type}-${index}`} className="text-sm text-[#6B6458]">
              <span className="font-medium capitalize text-[#003F2D]">
                {event.type.replaceAll("_", " ")}
              </span>
              {event.message ? ` — ${event.message}` : ""}
              {event.createdAt ? (
                <span className="ml-2 text-xs">
                  {new Date(event.createdAt).toLocaleString("en-CA")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
