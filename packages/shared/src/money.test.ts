import { describe, expect, it } from "vitest";
import {
  applyPercentageDiscount,
  clampDiscount,
  formatCad,
  fromCents,
  sumCents,
  toCents,
} from "./money";

describe("money helpers", () => {
  it("converts dollars to cents without float drift", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(fromCents(1999)).toBe(19.99);
  });

  it("formats CAD currency", () => {
    expect(formatCad(12500)).toContain("125.00");
  });

  it("applies percentage discounts safely", () => {
    expect(applyPercentageDiscount(10000, 10)).toBe(1000);
    expect(applyPercentageDiscount(10000, 0)).toBe(0);
    expect(applyPercentageDiscount(10000, 100)).toBe(10000);
  });

  it("clamps discounts to subtotal", () => {
    expect(clampDiscount(5000, 3000)).toBe(3000);
    expect(clampDiscount(-100, 3000)).toBe(0);
  });

  it("sums minor units", () => {
    expect(sumCents([100, 250, 50])).toBe(400);
  });
});
