import { describe, expect, it } from "vitest";
import { StudentNav, StudentDesktopNav, StudentMobileBottomNav } from "./student-nav";

describe("StudentNav exports and contracts", () => {
  it("exports StudentNav component function", () => {
    expect(typeof StudentNav).toBe("function");
  });

  it("exports backward-compatible StudentDesktopNav and StudentMobileBottomNav", () => {
    expect(typeof StudentDesktopNav).toBe("function");
    expect(typeof StudentMobileBottomNav).toBe("function");
    expect(StudentDesktopNav()).toBeNull();
    expect(StudentMobileBottomNav()).toBeNull();
  });
});
