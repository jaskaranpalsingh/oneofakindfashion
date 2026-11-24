import type { CarrierAdapter } from "./types";

/**
 * Manual / admin-configured rates only.
 * Live Canada Post / UPS / FedEx / Purolator adapters can register later
 * when API credentials exist — never invent live rates here.
 */
export function getManualCarrierAdapter(): CarrierAdapter {
  return {
    id: "manual",
    name: "Store configured rates",
    live: false,
    async getQuote() {
      return {
        available: false,
        rateCents: null,
        message: "Use admin-configured shipping methods",
      };
    },
    buildTrackingUrl(trackingNumber: string) {
      const trimmed = trackingNumber.trim();
      if (!trimmed) return null;
      // Generic Canada Post tracking deep link when number looks like CP.
      if (/^[A-Z]{2}\d{9}CA$/i.test(trimmed.replace(/\s+/g, ""))) {
        return `https://www.canadapost-postescanada.ca/track-reperage/en#/details/${encodeURIComponent(trimmed.replace(/\s+/g, ""))}`;
      }
      return null;
    },
  };
}
