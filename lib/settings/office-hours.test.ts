import { describe, expect, it } from "vitest";
import type { OfficeSchedule } from "@/lib/student/types";
import { hoursForDate, officeStatus, upcomingExceptions, weekSummary } from "./office-hours";

const schedule: OfficeSchedule = {
  weekly: [0, 1, 2, 3, 4].map((day) => ({ day, open: "09:00", close: "17:00" })),
  exceptions: [
    { date: "2026-10-11", closed: false, open: "12:00", close: "16:00", note: "Late start" },
    { date: "2026-10-15", closed: true, note: "Exam break" },
  ],
};

describe("office schedule", () => {
  it("uses an exception instead of weekly hours", () => {
    expect(hoursForDate(schedule, "2026-10-11")).toEqual({ closed: false, open: "12:00", close: "16:00", note: "Late start" });
  });

  it("closes a normally open weekday for an exception", () => {
    expect(hoursForDate(schedule, "2026-10-15")).toEqual({ closed: true, note: "Exam break" });
    expect(upcomingExceptions(schedule, new Date("2026-10-14T21:30:00Z"), 1)).toEqual([schedule.exceptions[1]]);
  });

  it("groups consecutive weekdays with the same hours", () => {
    expect(weekSummary(schedule)).toBe("Sun–Thu 09:00–17:00; Fri–Sat Closed");
  });

  it("uses Cairo's date across the UTC day boundary", () => {
    expect(officeStatus(schedule, new Date("2026-10-10T22:30:00Z"))).toEqual({
      openNow: false, todayLabel: "Open today 12:00–16:00", nextOpen: "Next opens today 12:00",
    });
  });
});
