import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
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

  it("enforces slim closed navbar architecture with zero-height collapsed dropdown and 44px tap targets", () => {
    const filePath = path.resolve(__dirname, "./student-nav.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Collapsed dropdown must use min-h-0 overflow-hidden wrapper so 0fr track collapses to exactly 0px
    expect(content).toMatch(/grid-rows-\[0fr\]/);
    expect(content).toMatch(/grid-rows-\[1fr\]/);
    expect(content).toMatch(/<div className="min-h-0 overflow-hidden">/);

    // Tap targets: 44px touch targets on brand link, theme toggle and mobile toggle
    expect(content).toMatch(/size-11 min-h-\[44px\] min-w-\[44px\]/);
    expect(content).toMatch(/min-h-\[44px\]/);

    // Equal padding and vertical centering
    expect(content).toMatch(/flex items-center justify-between gap-2\.5 sm:gap-4 p-1\.5 sm:p-2/);

    // No sparkles icon
    const forbiddenSparklePattern = new RegExp(["Spark", "les"].join(""), "i");
    expect(content).not.toMatch(forbiddenSparklePattern);
  });
});
