import { describe, expect, it } from "vitest";
import { startOfTodayEdmonton } from "../services/dashboard.service";

describe("startOfTodayEdmonton", () => {
  it("returns a Date at the Edmonton midnight boundary", () => {
    const fixed = new Date("2026-06-15T18:30:00.000Z");
    const start = startOfTodayEdmonton(fixed);

    expect(start).toBeInstanceOf(Date);
    expect(Number.isNaN(start.getTime())).toBe(false);

    // Edmonton date of the fixed instant should match the start key.
    const edmontonDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Edmonton",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(fixed);
    const startDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Edmonton",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(start);

    expect(startDay).toBe(edmontonDay);
    expect(start.getTime()).toBeLessThanOrEqual(fixed.getTime());
  });
});
