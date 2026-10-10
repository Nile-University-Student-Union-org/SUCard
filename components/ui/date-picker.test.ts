import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  parseISODate,
  formatISODate,
  formatDisplayDate,
  getCairoTodayString,
  DatePicker,
} from "./date-picker";
import { DateRangePicker } from "./date-range-picker";
import { datePickerPlacement } from "@/lib/date-picker-placement";

describe("DatePicker utilities", () => {
  it("parses ISO date strings correctly without timezone drift", () => {
    const d1 = parseISODate("2026-10-10");
    expect(d1).not.toBeNull();
    expect(d1?.getFullYear()).toBe(2026);
    expect(d1?.getMonth()).toBe(9); // 0-indexed October
    expect(d1?.getDate()).toBe(10);

    const d2 = parseISODate("2026-02-28T12:00:00Z");
    expect(d2).not.toBeNull();
    expect(d2?.getFullYear()).toBe(2026);
    expect(d2?.getMonth()).toBe(1); // February
    expect(d2?.getDate()).toBe(28);

    const leap = parseISODate("2024-02-29");
    expect(leap).not.toBeNull();
    expect(leap?.getDate()).toBe(29);

    expect(parseISODate("invalid")).toBeNull();
    expect(parseISODate("")).toBeNull();
    expect(parseISODate(undefined)).toBeNull();
    expect(parseISODate(null)).toBeNull();
  });

  it("formats Date objects to YYYY-MM-DD", () => {
    const d = new Date(2026, 4, 3); // May 3, 2026
    expect(formatISODate(d)).toBe("2026-05-03");

    const d2 = new Date(2026, 11, 25); // Dec 25, 2026
    expect(formatISODate(d2)).toBe("2026-12-25");
  });

  it("formats ISO string for display in British English format", () => {
    expect(formatDisplayDate("2026-10-10")).toBe("10 Oct 2026");
    expect(formatDisplayDate("2026-01-05")).toBe("5 Jan 2026");
    expect(formatDisplayDate("")).toBe("");
    expect(formatDisplayDate(undefined)).toBe("");
  });

  it("returns today in Africa/Cairo timezone in YYYY-MM-DD format", () => {
    const today = getCairoTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const parsed = parseISODate(today);
    expect(parsed).not.toBeNull();
  });
});

describe("datePickerPlacement math & viewport bounds", () => {
  it("positions below anchor when space is available", () => {
    const res = datePickerPlacement({
      anchor: { left: 100, right: 300, top: 100, bottom: 144 },
      panel: { width: 310, height: 350 },
      bounds: { left: 8, right: 1000, top: 8, bottom: 800 },
      align: "left",
      placement: "bottom",
    });

    expect(res.top).toBe(152); // 144 + gap (8)
    expect(res.left).toBe(100);
    expect(res.width).toBe(310);
  });

  it("prefers top when placement is top and space is available", () => {
    const res = datePickerPlacement({
      anchor: { left: 100, right: 300, top: 400, bottom: 444 },
      panel: { width: 310, height: 300 },
      bounds: { left: 8, right: 1000, top: 8, bottom: 800 },
      align: "left",
      placement: "top",
    });

    expect(res.top).toBe(400 - 300 - 8); // 92
  });

  it("flips above anchor when below space is constrained", () => {
    const res = datePickerPlacement({
      anchor: { left: 100, right: 300, top: 500, bottom: 544 },
      panel: { width: 310, height: 200 },
      bounds: { left: 8, right: 1000, top: 8, bottom: 600 },
      align: "left",
      placement: "bottom",
    });

    // Below only has 600 - 544 - 8 = 48px < 200px. Above has 500 - 8 - 8 = 484px > 200px.
    expect(res.top).toBe(500 - 200 - 8); // 292
  });

  it("clamps to screen bounds on 360px mobile viewports", () => {
    const res = datePickerPlacement({
      anchor: { left: 200, right: 350, top: 100, bottom: 144 },
      panel: { width: 310, height: 350 },
      bounds: { left: 8, right: 352, top: 8, bottom: 700 },
      align: "left",
      placement: "bottom",
    });

    // Bounds: left 8, right 352 (width 344).
    // Panel width is 310. Desired left was 200, which would exceed 352.
    expect(res.left).toBeLessThanOrEqual(352 - res.width);
    expect(res.left).toBeGreaterThanOrEqual(8);
  });

  it("handles right alignment correctly", () => {
    const res = datePickerPlacement({
      anchor: { left: 100, right: 500, top: 100, bottom: 144 },
      panel: { width: 300, height: 300 },
      bounds: { left: 8, right: 1000, top: 8, bottom: 800 },
      align: "right",
      placement: "bottom",
    });

    expect(res.left).toBe(500 - 300); // 200
  });

  it("handles center alignment correctly", () => {
    const res = datePickerPlacement({
      anchor: { left: 100, right: 300, top: 100, bottom: 144 },
      panel: { width: 300, height: 300 },
      bounds: { left: 8, right: 1000, top: 8, bottom: 800 },
      align: "center",
      placement: "bottom",
    });

    expect(res.left).toBe((100 + 300 - 300) / 2); // 50
  });
});

describe("Component Exports & Rules Compliance", () => {
  it("exports DatePicker as a component", () => {
    expect(typeof DatePicker).toBe("function");
  });

  it("exports DateRangePicker as a component", () => {
    expect(typeof DateRangePicker).toBe("function");
  });

  it("ensures no forbidden sparkle icons are used in date pickers", () => {
    const uiDir = path.resolve(__dirname);
    const datePickerContent = fs.readFileSync(path.join(uiDir, "date-picker.tsx"), "utf-8");
    const dateRangePickerContent = fs.readFileSync(path.join(uiDir, "date-range-picker.tsx"), "utf-8");

    const forbidden = ["Spark", "les"].join("");
    expect(datePickerContent).not.toContain(forbidden);
    expect(dateRangePickerContent).not.toContain(forbidden);
  });

  it("supports disabledDates prop in DatePicker", () => {
    const uiDir = path.resolve(__dirname);
    const datePickerContent = fs.readFileSync(path.join(uiDir, "date-picker.tsx"), "utf-8");
    expect(datePickerContent).toContain("disabledDates");
  });
});
