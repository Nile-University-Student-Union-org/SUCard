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
    const studentNavPath = path.resolve(__dirname, "./student-nav.tsx");
    const appNavPath = path.resolve(__dirname, "../ui/app-nav.tsx");
    const studentContent = fs.readFileSync(studentNavPath, "utf-8");
    const appNavContent = fs.readFileSync(appNavPath, "utf-8");

    // Collapsed dropdown must use min-h-0 overflow-hidden wrapper so 0fr track collapses to exactly 0px
    expect(appNavContent).toMatch(/grid-rows-\[0fr\]/);
    expect(appNavContent).toMatch(/grid-rows-\[1fr\]/);
    expect(appNavContent).toMatch(/<div className="min-h-0 overflow-hidden">/);

    // Tap targets: 44px touch targets on brand link, theme toggle and mobile toggle
    expect(appNavContent).toMatch(/size-11 min-h-\[44px\] min-w-\[44px\]/);
    expect(appNavContent).toMatch(/min-h-\[44px\]/);

    // Equal padding and vertical centering
    expect(appNavContent).toMatch(/flex items-center justify-between gap-2\.5 sm:gap-4 p-1\.5 sm:p-2/);

    // No sparkles icon in either file
    const forbiddenSparklePattern = new RegExp(["Spark", "les"].join(""), "i");
    expect(studentContent).not.toMatch(forbiddenSparklePattern);
    expect(appNavContent).not.toMatch(forbiddenSparklePattern);
  });
});
