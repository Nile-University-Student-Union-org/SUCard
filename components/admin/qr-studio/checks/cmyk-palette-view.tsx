"use client";

import React, { useMemo } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { rgbToCmyk } from "@/lib/qr-style/cmyk";
import { Printer } from "lucide-react";

interface ColorItem {
  hex: string;
  label: string;
  cmyk: { c: number; m: number; y: number; k: number };
}

export const CmykPaletteView: React.FC<{ config: QrStyleConfig }> = ({ config }) => {
  const colorItems = useMemo(() => {
    const items: { hex: string; label: string }[] = [];

    // Modules
    if (config.modules.paint.type === "solid") {
      items.push({ hex: config.modules.paint.color, label: "Data Dots" });
    } else {
      config.modules.paint.stops.forEach((stop, i) => {
        items.push({ hex: stop.color, label: `Dot Gradient Stop ${i + 1}` });
      });
    }

    // Background
    if (config.background.type === "solid") {
      items.push({ hex: config.background.color, label: "Background" });
    }

    // Eyes
    items.push({ hex: config.eyes.topLeft.frameColor, label: "Eye Frame (TL)" });
    items.push({ hex: config.eyes.topLeft.pupilColor, label: "Eye Pupil (TL)" });
    if (config.eyes.topRight.frameColor !== config.eyes.topLeft.frameColor) {
      items.push({ hex: config.eyes.topRight.frameColor, label: "Eye Frame (TR)" });
    }
    if (config.eyes.topRight.pupilColor !== config.eyes.topLeft.pupilColor) {
      items.push({ hex: config.eyes.topRight.pupilColor, label: "Eye Pupil (TR)" });
    }
    if (config.eyes.bottomLeft.frameColor !== config.eyes.topLeft.frameColor) {
      items.push({ hex: config.eyes.bottomLeft.frameColor, label: "Eye Frame (BL)" });
    }
    if (config.eyes.bottomLeft.pupilColor !== config.eyes.topLeft.pupilColor) {
      items.push({ hex: config.eyes.bottomLeft.pupilColor, label: "Eye Pupil (BL)" });
    }

    // Logo Plate
    if (config.logo.type === "nusu" && config.logo.plate !== "none") {
      items.push({ hex: config.logo.plateColor, label: "Logo Plate" });
    }

    // Frame & Label
    if (config.frame.shape !== "none") {
      items.push({ hex: config.frame.color, label: "Outer Frame" });
    }
    if (config.frame.label) {
      items.push({ hex: config.frame.labelColor, label: "Frame Label" });
      if (config.frame.badgeColor) {
        items.push({ hex: config.frame.badgeColor, label: "Label Badge" });
      }
    }

    // Deduplicate by uppercase hex, keeping label
    const seen = new Set<string>();
    const unique: ColorItem[] = [];
    for (const item of items) {
      const normHex = item.hex.toUpperCase();
      if (!seen.has(normHex)) {
        seen.add(normHex);
        unique.push({
          hex: normHex,
          label: item.label,
          cmyk: rgbToCmyk(normHex),
        });
      }
    }
    return unique;
  }, [config]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-xs">
        <Printer className="size-3.5 text-brand" />
        <span>Print Shop CMYK Values (Approximate)</span>
      </div>

      <div className="space-y-2">
        {colorItems.map((item) => (
          <div
            key={item.hex}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="size-5 rounded-md border border-black/20 shrink-0 shadow-2xs"
                style={{ backgroundColor: item.hex }}
              />
              <div className="min-w-0">
                <p className="font-bold text-charcoal dark:text-zinc-100 truncate">
                  {item.label}
                </p>
                <p className="font-mono text-[10px] text-ash dark:text-zinc-400">
                  {item.hex}
                </p>
              </div>
            </div>

            <div className="font-mono font-bold text-[11px] text-right text-foreground shrink-0 pl-2">
              <span className="text-cyan-600 dark:text-cyan-400">C{item.cmyk.c}</span>{" "}
              <span className="text-magenta-600 dark:text-pink-400">M{item.cmyk.m}</span>{" "}
              <span className="text-yellow-600 dark:text-yellow-400">Y{item.cmyk.y}</span>{" "}
              <span className="text-slate-800 dark:text-zinc-300">K{item.cmyk.k}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
