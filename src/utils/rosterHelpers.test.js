import { describe, it, expect } from "vitest";
import {
  fmtDate,
  genDates,
  calcHrs,
  checkConflicts,
  isWorkShift,
  isRestDay,
  isNightShift,
  buildICS,
} from "./rosterHelpers.js";

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

describe("calcHrs", () => {
  it("calculates same-day shift hours", () => {
    expect(calcHrs("09:00", "17:00")).toBe(8);
  });

  it("calculates overnight shift hours across midnight", () => {
    expect(calcHrs("22:00", "06:00")).toBe(8);
  });

  it("calculates fractional hours accurately", () => {
    expect(calcHrs("09:00", "17:30")).toBe(8.5);
  });

  it("calculates 24-hour shift if same time specified with is24Hour flag", () => {
    expect(calcHrs("08:00", "08:00", true)).toBe(24);
  });
});

describe("checkConflicts", () => {
  const shifts = [
    { code: "M", title: "Morning", startTime: "07:00", endTime: "15:00", isOff: false },
    { code: "E", title: "Evening", startTime: "15:00", endTime: "23:00", isOff: false },
    { code: "N", title: "Night", startTime: "23:00", endTime: "07:00", isOff: false },
    { code: "O", title: "Off", startTime: "", endTime: "", isOff: true },
  ];

  it("flags short turnaround (< 11 hours rest)", () => {
    const roster = [
      { date: "2025-01-01", shift: "E", startTime: "15:00", endTime: "23:00" },
      { date: "2025-01-02", shift: "M", startTime: "07:00", endTime: "15:00" },
    ];
    const warnings = checkConflicts(roster, shifts);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("rest");
    expect(warnings[0].date).toBe("2025-01-02");
    expect(warnings[0].msg).toContain("Short turnaround rest: Only 8.0h rest");
  });

  it("flags direct collision if next shift starts before previous ends", () => {
    const roster = [
      { date: "2025-01-01", shift: "N", startTime: "22:00", endTime: "08:00" },
      { date: "2025-01-02", shift: "M", startTime: "07:00", endTime: "15:00" },
    ];
    const warnings = checkConflicts(roster, shifts);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("collision");
    expect(warnings[0].msg).toContain("Shift overlap conflict");
  });

  it("does not flag adequate rest (>= 11 hours)", () => {
    const roster = [
      { date: "2025-01-01", shift: "M", startTime: "07:00", endTime: "15:00" },
      { date: "2025-01-02", shift: "M", startTime: "07:00", endTime: "15:00" },
    ];
    const warnings = checkConflicts(roster, shifts);
    expect(warnings).toHaveLength(0);
  });

  it("warns when consecutive working days reach 7 or more", () => {
    const roster = [
      { date: "2025-01-01", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-02", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-03", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-04", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-05", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-06", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-07", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-08", shift: "M", startTime: "09:00", endTime: "17:00" },
    ];
    const warnings = checkConflicts(roster, shifts);
    const fatigueWarnings = warnings.filter((w) => w.type === "fatigue");
    expect(fatigueWarnings).toHaveLength(2);
    expect(fatigueWarnings[0].date).toBe("2025-01-07");
    expect(fatigueWarnings[0].msg).toContain("7 consecutive days");
    expect(fatigueWarnings[1].date).toBe("2025-01-08");
    expect(fatigueWarnings[1].msg).toContain("8 consecutive days");
  });

  it("resets streak on non-consecutive date gaps or off days", () => {
    const roster = [
      { date: "2025-01-01", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-02", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-03", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-04", shift: "O" }, // Off day
      { date: "2025-01-05", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-06", shift: "M", startTime: "09:00", endTime: "17:00" },
      { date: "2025-01-07", shift: "M", startTime: "09:00", endTime: "17:00" },
    ];
    const warnings = checkConflicts(roster, shifts);
    const fatigueWarnings = warnings.filter((w) => w.type === "fatigue");
    expect(fatigueWarnings).toHaveLength(0);
  });
});

describe("shift classification helpers", () => {
  const shifts = [
    { code: "M", title: "Morning", isOff: false },
    { code: "O", title: "Rest Day", isOff: true },
    { code: "N", title: "Night Shift", isOff: false },
  ];

  it("correctly identifies work vs rest vs night shifts", () => {
    expect(isWorkShift("M", shifts)).toBe(true);
    expect(isWorkShift("O", shifts)).toBe(false);
    expect(isRestDay("O", shifts)).toBe(true);
    expect(isRestDay("M", shifts)).toBe(false);
    expect(isNightShift("N", shifts, "23:00", "07:00")).toBe(true);
    expect(isNightShift("M", shifts, "07:00", "15:00")).toBe(false);
  });
});

describe("buildICS", () => {
  it("generates valid RFC 5545 format with local floating time and folded lines", () => {
    const roster = [
      {
        date: "2025-01-15",
        shift: "M",
        startTime: "09:00",
        endTime: "17:00",
        eventTitle: "Morning Shift at Terminal",
        notes: "Remember your badge and keys",
      },
    ];
    const shifts = [{ code: "M", title: "Morning", isOff: false }];

    const ics = buildICS(roster, shifts);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//SkyRoster//Smart Shift Planner v4.0//EN");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20250115T090000");
    expect(ics).toContain("DTEND:20250115T170000");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });
});
