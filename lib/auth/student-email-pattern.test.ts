import { describe, expect, it } from "vitest";
import { DEFAULT_STUDENT_EMAIL_PATTERN, isSafeStudentEmailPattern, matchesStudentEmail } from "@/lib/student/rules";

describe("student email pattern boundary", () => {
  it("accepts the default and rejects expensive expressions", () => {
    expect(isSafeStudentEmailPattern(DEFAULT_STUDENT_EMAIL_PATTERN)).toBe(true);
    expect(matchesStudentEmail("a.smith2026@nu.edu.eg")).toBe(true);
    expect(isSafeStudentEmailPattern("^(a+)+@nu\\.edu\\.eg$")).toBe(false);
    expect(isSafeStudentEmailPattern("^a?a?a?@nu\\.edu\\.eg$")).toBe(false);
    expect(matchesStudentEmail("a".repeat(300) + "!", "^(a+)+$")).toBe(false);
  });
});
