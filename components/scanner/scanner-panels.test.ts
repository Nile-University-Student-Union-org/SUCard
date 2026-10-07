import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ScanValidPanel } from "./scan-valid-panel";
import { ScanSuccessPanel } from "./scan-success-panel";
import { ScanInvalidPanel } from "./scan-invalid-panel";
import { ScannerHeader } from "./scanner-header";
import { ScannerTodayTab } from "./scanner-today-tab";
import { ScannerViewfinder } from "./scanner-viewfinder";
import { ScannerManager } from "./scanner-manager";

describe("Scanner Panels Contract and Exports", () => {
  it("exports ScanValidPanel as a valid React component function", () => {
    expect(typeof ScanValidPanel).toBe("function");
  });

  it("exports ScanSuccessPanel as a valid React component function", () => {
    expect(typeof ScanSuccessPanel).toBe("function");
  });

  it("exports ScanInvalidPanel as a valid React component function", () => {
    expect(typeof ScanInvalidPanel).toBe("function");
  });

  it("exports ScannerHeader as a valid React component function", () => {
    expect(typeof ScannerHeader).toBe("function");
  });

  it("exports ScannerTodayTab as a valid React component function", () => {
    expect(typeof ScannerTodayTab).toBe("function");
  });

  it("exports ScannerViewfinder as a valid React component function", () => {
    expect(typeof ScannerViewfinder).toBe("function");
  });

  it("exports ScannerManager as a valid React component function", () => {
    expect(typeof ScannerManager).toBe("function");
  });
});

describe("Design System & Rule Compliance for Scanner Components", () => {
  it("ensures no scanner component imports or uses forbidden sparkle icons", () => {
    const scannerDir = path.resolve(__dirname);
    const files = fs
      .readdirSync(scannerDir)
      .filter((f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test."));

    const forbiddenPattern = new RegExp(["Spark", "les"].join(""), "i");

    for (const file of files) {
      const content = fs.readFileSync(path.join(scannerDir, file), "utf-8");
      expect(content).not.toMatch(forbiddenPattern);
    }
  });

  it("ensures pinch-zoom is enabled in scanner viewport configuration", () => {
    const layoutPath = path.resolve(__dirname, "../../app/(scanner)/layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    expect(layoutContent).not.toMatch(/userScalable:\s*false/);
    expect(layoutContent).not.toMatch(/maximumScale:\s*1/);
  });

  it("ensures offline status in header includes accessible visible text", () => {
    const headerPath = path.resolve(__dirname, "./scanner-header.tsx");
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    // Must not hide Offline text on small screens (hidden xs:inline)
    expect(headerContent).not.toMatch(/hidden\s+xs:inline/);
    expect(headerContent).toMatch(/Offline/);
  });

  it("ensures today tab does not show misleading 0 / EGP 0.00 when data fetch fails", () => {
    const todayPath = path.resolve(__dirname, "./scanner-today-tab.tsx");
    const todayContent = fs.readFileSync(todayPath, "utf-8");

    // Must have explicit unavailable / error handling for KPI values
    expect(todayContent).toMatch(/isErrorWithoutData/);
    expect(todayContent).toMatch(/Unavailable/);
  });
});
