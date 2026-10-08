import { describe, expect, it } from "vitest";
import { adminDecision, resolveAdminRole, sessionExpiry } from "./policy";

describe("admin 2FA policy", () => {
  it("resolves a Microsoft student grant without promoting other roles", () => {
    expect(resolveAdminRole("student", "microsoft", true)).toBe("admin");
    expect(resolveAdminRole("student", "microsoft", false)).toBeNull();
    expect(resolveAdminRole("student", "password", true)).toBeNull();
    expect(resolveAdminRole("cashier", "microsoft", true)).toBeNull();
    expect(resolveAdminRole("super_admin", "password", false)).toBe("super_admin");
  });
  it("requires admins to enroll in 2FA and verifies second factor", () => {
    for (const role of ["admin", "super_admin"]) {
      expect(adminDecision(role, "password", false)).toBe("setup");
      expect(adminDecision(role, "password", true)).toBe("allow");
      expect(adminDecision(role, "microsoft", false)).toBe("setup");
      expect(adminDecision(role, "microsoft", true, false)).toBe("verify");
      expect(adminDecision(role, "microsoft", true, true)).toBe("allow");
    }
    expect(adminDecision("cashier", "password", true)).toBe("deny");
    expect(adminDecision("student", "microsoft", false)).toBe("deny");
  });
  it("extends only cashier sessions", () => {
    const now = new Date("2026-10-07T00:00:00Z"), original = new Date("2026-10-14T00:00:00Z");
    expect(sessionExpiry("cashier", original, now).toISOString()).toBe("2026-11-06T00:00:00.000Z");
    expect(sessionExpiry("admin", original, now)).toBe(original);
  });
});
