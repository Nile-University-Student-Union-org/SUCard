import { describe, it, expect } from "vitest";
import { parseTime, formatTime, formatDisplayTime } from "./time-picker";

describe("TimePicker utilities", () => {
  it("parses valid 24h time strings", () => {
    expect(parseTime("09:30")).toEqual({ hours: 9, minutes: 30 });
    expect(parseTime("00:00")).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime("23:59")).toEqual({ hours: 23, minutes: 59 });
    expect(parseTime("14:05")).toEqual({ hours: 14, minutes: 5 });
  });

  it("returns null for invalid time strings", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime(null)).toBeNull();
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("12:60")).toBeNull();
    expect(parseTime("invalid")).toBeNull();
  });

  it("formats hours and minutes to HH:mm string", () => {
    expect(formatTime(9, 5)).toBe("09:05");
    expect(formatTime(0, 0)).toBe("00:00");
    expect(formatTime(23, 45)).toBe("23:45");
  });

  it("formats display time cleanly", () => {
    expect(formatDisplayTime("08:30")).toBe("08:30");
    expect(formatDisplayTime("")).toBe("");
    expect(formatDisplayTime("invalid")).toBe("");
  });
});
