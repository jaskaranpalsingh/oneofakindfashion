/**
 * Money is stored as integer minor units (cents) to avoid floating-point errors.
 */
export type MoneyCents = number;

export function toCents(amount: number): MoneyCents {
  return Math.round(amount * 100);
}

export function fromCents(cents: MoneyCents): number {
  return cents / 100;
}

export function formatCad(cents: MoneyCents, locale = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(fromCents(cents));
}

export function applyPercentageDiscount(
  amountCents: MoneyCents,
  percent: number
): MoneyCents {
  if (percent <= 0) return 0;
  if (percent >= 100) return amountCents;
  return Math.round((amountCents * percent) / 100);
}

export function clampDiscount(
  discountCents: MoneyCents,
  subtotalCents: MoneyCents
): MoneyCents {
  return Math.max(0, Math.min(discountCents, subtotalCents));
}

export function sumCents(values: MoneyCents[]): MoneyCents {
  return values.reduce((total, value) => total + value, 0);
}
