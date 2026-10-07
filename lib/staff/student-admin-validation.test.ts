import { describe, expect, it } from "vitest";
import { studentAdminIdsSchema, universityIdSchema } from "./student-admin-validation";

describe("student admin ID validation", () => {
  it("accepts pasted IDs, trims and deduplicates them", () => {
    expect(studentAdminIdsSchema.parse({ ids: " 123456789, 987654321\n123456789 " }).ids)
      .toEqual(["123456789", "987654321"]);
  });
  it("rejects malformed and excessive IDs", () => {
    for (const ids of ["", "12345678", "12345678x", "123456789;987654321", Array.from({ length: 101 }, (_, i) => String(i).padStart(9, "0")).join(",")])
      expect(studentAdminIdsSchema.safeParse({ ids }).success).toBe(false);
    expect(universityIdSchema.safeParse("123456789").success).toBe(true);
    expect(universityIdSchema.safeParse("12345678").success).toBe(false);
  });
});
