export type CarrierQuoteRequest = {
  province: string;
  postalCode?: string | null;
  weightGrams?: number;
};

export type CarrierQuoteResult = {
  available: boolean;
  rateCents: number | null;
  etaLabel?: string;
  message?: string;
};

export type CarrierAdapter = {
  /** Stable carrier id */
  id: string;
  name: string;
  /** True only when live API credentials are configured */
  live: boolean;
  getQuote(request: CarrierQuoteRequest): Promise<CarrierQuoteResult>;
  buildTrackingUrl?(trackingNumber: string): string | null;
};
