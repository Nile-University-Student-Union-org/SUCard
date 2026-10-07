import { describe, expect, it } from "vitest";
import { parseClaimQr, computeAreas } from "@/lib/student/rules";
import { cairoParts, confirmDecision, isOfferActiveAt, periodWindow, remainingUses, validationOutcome, vendorIsActive } from "./rules";
const offer = { status: "active", startsAt: null, endsAt: null, activeDays: [], activeFrom: null, activeTo: null };
describe("vendor rules", () => {
  it("uses Cairo dates across UTC midnight and inclusive contract ends", () => {
    expect(cairoParts(new Date("2026-09-01T21:30:00Z")).day).toBe("2026-09-02");
    expect(vendorIsActive({ status: "active", contractStart: "2026-09-02", contractEnd: "2026-09-02" }, { status: "active" }, new Date("2026-09-01T21:30:00Z"))).toBe(true);
    expect(vendorIsActive({ status: "paused", contractStart: null, contractEnd: null }, { status: "active" }, new Date())).toBe(false);
  });
  it("handles day filters, inclusive dates and overnight ranges", () => {
    const night = { ...offer, startsAt: "2026-10-04", endsAt: "2026-10-04", activeDays: [0], activeFrom: "22:00", activeTo: "02:00" };
    expect(isOfferActiveAt(night, new Date("2026-10-04T20:30:00Z"))).toBe(true);
    expect(isOfferActiveAt(night, new Date("2026-10-04T22:30:00Z"))).toBe(true);
    expect(isOfferActiveAt(night, new Date("2026-10-04T23:30:00Z"))).toBe(false);
    expect(isOfferActiveAt({ ...night, status: "paused" }, new Date("2026-10-04T20:30:00Z"))).toBe(false);
  });
  it("starts weeks Sunday and handles calendar months", () => {
    expect(periodWindow("week", new Date("2026-10-07T10:00:00Z")).start?.toISOString()).toBe("2026-10-03T21:00:00.000Z");
    expect(periodWindow("month", new Date("2026-10-07T10:00:00Z")).resetsAt?.toISOString()).toBe("2026-10-31T22:00:00.000Z");
  });
  it("places Cairo day boundaries correctly when daylight time changes", () => {
    expect(periodWindow("day", new Date("2026-04-24T01:00:00Z")).start?.toISOString()).toBe("2026-04-23T22:00:00.000Z");
    expect(periodWindow("day", new Date("2026-10-30T01:00:00Z")).start?.toISOString()).toBe("2026-10-29T22:00:00.000Z");
  });
  it("uses configured semesters and fallback academic windows", () => {
    expect(periodWindow("semester", new Date("2026-10-07T10:00:00Z"), [{ name: "Pilot", start: "2026-10-01", end: "2026-10-31" }]).resetsAt?.toISOString()).toBe("2026-10-31T22:00:00.000Z");
    expect(periodWindow("semester", new Date("2027-01-10T10:00:00Z")).start?.toISOString()).toBe("2026-08-31T21:00:00.000Z");
    expect(periodWindow("semester", new Date("2027-06-15T10:00:00Z")).resetsAt?.toISOString()).toBe("2027-08-31T21:00:00.000Z");
  });
  it("clamps limits and follows validation precedence", () => {
    expect(remainingUses(null, 100)).toBeNull(); expect(remainingUses(1, 3)).toBe(0);
    const base = { qrValid: true, cardStatus: "active" as const, studentActive: true, vendorActive: true, activeOfferCount: 1, availableOfferCount: 1 };
    expect(validationOutcome({ ...base, qrValid: false, cardStatus: "void", vendorActive: false })).toBe("invalid_qr");
    expect(validationOutcome({ ...base, cardStatus: "unassigned", studentActive: false })).toBe("card_not_activated");
    expect(validationOutcome({ ...base, activeOfferCount: 1, availableOfferCount: 0 })).toBe("limit_reached");
    expect(validationOutcome({ ...base, cardStatus: "missing" })).toBe("not_su_card");
    expect(validationOutcome({ ...base, cardStatus: "void" })).toBe("card_cancelled");
    expect(validationOutcome({ ...base, studentActive: false, vendorActive: false })).toBe("student_suspended");
    expect(validationOutcome({ ...base, vendorActive: false, activeOfferCount: 0 })).toBe("vendor_inactive");
    expect(validationOutcome({ ...base, activeOfferCount: 0, availableOfferCount: 0 })).toBe("no_active_offer");
  });
  it("makes confirm idempotent and checks ownership", () => {
    const now = new Date(); const scan = { cashierId: "a", confirmed: false, result: "valid", createdAt: now };
    expect(confirmDecision(scan, "a", now)).toBe("confirm");
    expect(confirmDecision({ ...scan, confirmed: true }, "a", now)).toBe("existing");
    expect(confirmDecision(scan, "b", now)).toBe("forbidden");
    expect(confirmDecision(scan, "a", new Date(now.getTime() + 600001))).toBe("expired");
    expect(confirmDecision({ ...scan, result: "limit_reached" }, "a", now)).toBe("invalid");
  });
  it("reuses QR parsing and exposes new areas", () => {
    const token = "0123456789ABCDEFGHJK";
    expect(parseClaimQr(`NUSU1:${token}`)).toBe(token);
    expect(parseClaimQr(`https://example.com/c/${token}`)).toBe(token);
    expect(parseClaimQr("junk")).toBeNull();
    expect(computeAreas(false, false, "cashier", false)[0].key).toBe("scanner");
    expect(computeAreas(false, false, "vendor_manager", false)[0].key).toBe("vendor");
  });
});
