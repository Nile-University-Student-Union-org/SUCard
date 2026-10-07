import { describe, expect, it } from "vitest";
import { createStaffSchema, updateStaffSchema, resetStaffPasswordSchema, auditQuerySchema } from "./validation";
import { decodeAuditCursor, encodeAuditCursor } from "./cursor";
import { wouldRemoveLastSuperAdmin } from "./rules";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "./types";

const create = { email: "  ADMIN@EXAMPLE.COM ", name: "  Admin  ", role: "admin", password: "x".repeat(STAFF_PASSWORD_MIN) };

describe("staff request validation", () => {
  it("normalizes email and name", () => {
    expect(createStaffSchema.parse(create)).toMatchObject({ email: "admin@example.com", name: "Admin" });
  });
  it("enforces both password bounds", () => {
    expect(createStaffSchema.safeParse({ ...create, password: "x".repeat(STAFF_PASSWORD_MIN - 1) }).success).toBe(false);
    expect(createStaffSchema.safeParse({ ...create, password: "x".repeat(STAFF_PASSWORD_MAX) }).success).toBe(true);
    expect(resetStaffPasswordSchema.safeParse({ password: "x".repeat(STAFF_PASSWORD_MAX + 1) }).success).toBe(false);
  });
  it("rejects unknown and empty update fields", () => {
    expect(updateStaffSchema.safeParse({}).success).toBe(false);
    expect(updateStaffSchema.safeParse({ name: "A", email: "x@example.com" }).success).toBe(false);
  });
  it("validates audit query bounds and actions", () => {
    expect(auditQuerySchema.parse({ limit: "2", action: "staff.created" }).limit).toBe(2);
    expect(auditQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(auditQuerySchema.safeParse({ action: "invalid action" }).success).toBe(false);
  });
});

describe("audit cursor", () => {
  it("round trips", () => {
    const value = { createdAt: "2026-10-07T00:00:00.123456Z", id: "123e4567-e89b-42d3-a456-426614174000" };
    expect(decodeAuditCursor(encodeAuditCursor(value))).toEqual(value);
  });
  it("rejects garbage", () => {
    for (const value of ["garbage", "!!!", "", "e30"]) expect(() => decodeAuditCursor(value)).toThrow("Invalid audit cursor");
  });
});

describe("last active super admin", () => {
  const staff = [
    { id: "1", role: "super_admin" as const, status: "active" as const },
    { id: "2", role: "admin" as const, status: "active" as const },
  ];
  it("rejects disabling or demoting the sole active super admin", () => {
    expect(wouldRemoveLastSuperAdmin(staff, "1", { status: "disabled" })).toBe(true);
    expect(wouldRemoveLastSuperAdmin(staff, "1", { role: "admin" })).toBe(true);
  });
  it("permits changes that retain an active super admin", () => {
    expect(wouldRemoveLastSuperAdmin(staff, "1", { name: "New" })).toBe(false);
    expect(wouldRemoveLastSuperAdmin([...staff, { id: "3", role: "super_admin", status: "active" }], "1", { status: "disabled" })).toBe(false);
  });
});
