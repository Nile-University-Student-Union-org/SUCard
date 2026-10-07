import { describe, expect, it } from "vitest";
import { LOCKOUT_WINDOW_MS, passwordLocked } from "./password-lockout-policy";

describe("password lockout", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  it("allows the first five failures, then locks the next attempt", () => {
    for (let count = 0; count < 5; count++) expect(passwordLocked(count, now, now)).toBe(false);
    expect(passwordLocked(5, now, now)).toBe(true);
  });
  it("expires 15 minutes after the last failure", () => {
    expect(passwordLocked(5, new Date(now.getTime() - LOCKOUT_WINDOW_MS + 1), now)).toBe(true);
    expect(passwordLocked(5, new Date(now.getTime() - LOCKOUT_WINDOW_MS), now)).toBe(false);
  });
});
