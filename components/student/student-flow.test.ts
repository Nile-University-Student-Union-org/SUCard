import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { StudentCardView } from "./student-card-view";
import { SwitchToPhysicalModal } from "./switch-to-physical-modal";
import { CardScanner } from "./card-scanner";

describe("Student Flow and Card UI contracts", () => {
  it("exports all expected components", () => {
    expect(typeof StudentCardView).toBe("function");
    expect(typeof SwitchToPhysicalModal).toBe("function");
    expect(typeof CardScanner).toBe("function");
  });

  it("verifies SwitchToPhysicalModal contracts and static properties", () => {
    const filePath = path.resolve(__dirname, "./switch-to-physical-modal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Endpoint contract: POST /api/student/flow with { cardFlow: "physical" }
    expect(content).toContain("/api/student/flow");
    expect(content).toContain('cardFlow: "physical"');

    // Explains that digital pass is voided immediately
    expect(content).toMatch(/Digital pass will be voided immediately/i);
    expect(content).toMatch(/Google Wallet pass/i);

    // Shows office location and hours
    expect(content).toContain("office.location");
    expect(content).toContain("weekSummary");
    expect(content).toContain("officeStatus");

    // Handles 409 and errors gracefully
    expect(content).toContain("res.status === 409");

    // No sparkles icon
    const forbiddenSparklePattern = new RegExp(["Spark", "les"].join(""), "i");
    expect(content).not.toMatch(forbiddenSparklePattern);
  });

  it("verifies StudentCardView contains quiet switch action and pickup state", () => {
    const filePath = path.resolve(__dirname, "./student-card-view.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Quiet secondary action for digital cards
    expect(content).toMatch(/Switch to physical card/i);

    // Clear pickup state when flow is physical and card is null
    expect(content).toMatch(/Head to the SU room to collect your card/i);
    expect(content).toMatch(/I have my card/i);

    // Integrates SwitchToPhysicalModal and CardScanner
    expect(content).toContain("SwitchToPhysicalModal");
    expect(content).toContain("CardScanner");

    // No sparkles icon
    const forbiddenSparklePattern = new RegExp(["Spark", "les"].join(""), "i");
    expect(content).not.toMatch(forbiddenSparklePattern);
  });

  it("verifies CardScanner supports camera, inline errors, and manual fallback", () => {
    const filePath = path.resolve(__dirname, "./card-scanner.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Endpoint contract: POST /api/student/card/claim with { qr }
    expect(content).toContain("/api/student/card/claim");

    // Error codes coverage
    expect(content).toContain("not_su_card");
    expect(content).toContain("already_linked");
    expect(content).toContain("cancelled");
    expect(content).toContain("already_has_card");
    expect(content).toContain("rate_limited");
    expect(content).toContain("invalid_qr");

    // Manual fallback and desk assistance explanation
    expect(content).toMatch(/Enter card code manually|Enter code/i);
    expect(content).toMatch(/SU admin|SU room desk|desk/i);

    // 44px min tap targets
    expect(content).toMatch(/min-h-\[44px\]/);

    // No sparkles icon
    const forbiddenSparklePattern = new RegExp(["Spark", "les"].join(""), "i");
    expect(content).not.toMatch(forbiddenSparklePattern);
  });
});
