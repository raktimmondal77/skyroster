import { describe, it, expect } from "vitest";
import { fmtDate, genDates } from "./rosterHelpers.js";

describe("fmtDate", () => {
  it("formats an ISO date as human-readable", () => {
    expect(fmtDate(new Date("2025-01-15"))).toMatch(/2025/);
  });
});

describe("genDates", () => {
  it("generates inclusive date range", () => {
    const dates = genDates("2025-01-01", "2025-01-07");
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2025-01-01");
    expect(dates[6]).toBe("2025-01-07");
  });
});
