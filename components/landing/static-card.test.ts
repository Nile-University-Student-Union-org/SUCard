import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { StaticCard } from "./static-card";

describe("StaticCard Fallback Component", () => {
  it("exports StaticCard as a valid React component function", () => {
    expect(typeof StaticCard).toBe("function");
  });

  it("uses real card artwork and 1.37:1 aspect ratio instead of old 1.585 hand-drawn card", () => {
    const staticCardPath = path.resolve(__dirname, "./static-card.tsx");
    const content = fs.readFileSync(staticCardPath, "utf-8");

    // Must use real card art
    expect(content).toMatch(/CARD_ART/);
    expect(content).toMatch(/aspect-\[1\.37\/1\]/);

    // Must not use old 1.585 ratio or gradient card background
    expect(content).not.toMatch(/1\.585/);
    expect(content).not.toMatch(/linear-gradient\(135deg,\s*#081E38/);
  });

  it("ensures no sparkle icons are used in any landing components", () => {
    const landingDir = path.resolve(__dirname);
    const files = fs
      .readdirSync(landingDir)
      .filter((f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes(".test."));

    const forbiddenPattern = new RegExp(["Spark", "les"].join(""), "i");

    for (const file of files) {
      const content = fs.readFileSync(path.join(landingDir, file), "utf-8");
      expect(content).not.toMatch(forbiddenPattern);
    }
  });
});
