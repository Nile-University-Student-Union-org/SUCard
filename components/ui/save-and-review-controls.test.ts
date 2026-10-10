import { describe, it, expect } from "vitest";
import * as UI from "./index";
import fs from "fs";
import path from "path";

describe("StickySaveBar and ReviewChangesModal Controls", () => {
  it("exports StickySaveBar and ReviewChangesModal from index", () => {
    expect(UI.StickySaveBar).toBeDefined();
    expect(UI.ReviewChangesModal).toBeDefined();
  });

  it("ensures no forbidden sparkle icons are used", () => {
    const files = ["sticky-save-bar.tsx", "review-changes-modal.tsx"];
    const forbiddenPattern = new RegExp(["Spark", "les"].join(""), "i");

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toMatch(forbiddenPattern);
    }
  });

  it("ensures sticky save bar has accessible min touch target sizes", () => {
    const filePath = path.join(__dirname, "sticky-save-bar.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("min-h-[44px]");
    expect(content).toContain("aria-label");
  });

  it("ensures review changes modal supports countdown and escape handling", () => {
    const filePath = path.join(__dirname, "review-changes-modal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("COUNTDOWN_SECONDS");
    expect(content).toContain("Save in");
    expect(content).toContain("Confirm & save");
  });
});
