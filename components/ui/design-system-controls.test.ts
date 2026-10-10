import { describe, it, expect } from "vitest";
import * as UI from "./index";
import fs from "fs";
import path from "path";

describe("Design System Form Controls", () => {
  it("exports all new shared UI form components", () => {
    expect(UI.TimePicker).toBeDefined();
    expect(UI.Slider).toBeDefined();
    expect(UI.FileDrop).toBeDefined();
    expect(UI.ColorInput).toBeDefined();
  });

  it("ensures no forbidden sparkle icons are used in new UI components", () => {
    const files = ["time-picker.tsx", "slider.tsx", "file-drop.tsx", "color-input.tsx"];
    const forbiddenPattern = new RegExp(["Spark", "les"].join(""), "i");

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toMatch(forbiddenPattern);
    }
  });
});
