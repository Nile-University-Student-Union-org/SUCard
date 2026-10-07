import { describe, expect, it } from "vitest";
import { ScanValidPanel } from "./scan-valid-panel";
import { ScanSuccessPanel } from "./scan-success-panel";
import { ScanInvalidPanel } from "./scan-invalid-panel";

describe("Scanner Panels Contract", () => {
  it("exports ScanValidPanel as a valid React component function", () => {
    expect(typeof ScanValidPanel).toBe("function");
  });

  it("exports ScanSuccessPanel as a valid React component function", () => {
    expect(typeof ScanSuccessPanel).toBe("function");
  });

  it("exports ScanInvalidPanel as a valid React component function", () => {
    expect(typeof ScanInvalidPanel).toBe("function");
  });
});
