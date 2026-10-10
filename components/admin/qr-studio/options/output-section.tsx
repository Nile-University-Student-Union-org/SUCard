"use client";

import React from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";

export interface OutputSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({ config, onChange }) => {
  const output = config.output;

  const handlePrintSizeChange = (printSizeMm: number) => {
    onChange((prev) => ({
      ...prev,
      output: {
        ...prev.output,
        printSizeMm: Math.max(5, Math.min(200, printSizeMm)),
      },
    }));
  };

  const handleDpiChange = (dpi: number) => {
    onChange((prev) => ({
      ...prev,
      output: {
        ...prev.output,
        dpi: Math.max(300, Math.min(1200, dpi)),
      },
    }));
  };

  const rasterPx = Math.round((output.printSizeMm / 25.4) * output.dpi);

  return (
    <div className="space-y-5 text-xs">
      {/* Print Size mm Slider */}
      <Slider
        label="Target Print Size"
        showValue
        valueFormatter={(v) => `${v} mm (${(v / 25.4).toFixed(2)} in)`}
        min={10}
        max={100}
        step={1}
        value={output.printSizeMm}
        onChange={(val) => handlePrintSizeChange(val)}
        ticks={[
          { value: 15, label: "15 mm (Minimum)" },
          { value: 25, label: "25 mm (NUSU Card Standard)" },
          { value: 50, label: "50 mm (Poster)" },
        ]}
      />

      {/* Raster DPI */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Print Resolution (DPI)
        </label>
        <SegmentedControl
          options={[
            { value: "300", label: "300 DPI (Standard)" },
            { value: "600", label: "600 DPI (High-Res)" },
            { value: "1200", label: "1200 DPI (Ultra)" },
          ]}
          value={String(output.dpi)}
          onChange={(val) => handleDpiChange(Number(val))}
          ariaLabel="Resolution DPI"
          fullWidth
          size="sm"
        />
      </div>

      {/* Raster Specs Box */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Raster Resolution:</span>
          <span className="font-bold text-foreground">
            {rasterPx} &times; {rasterPx} px
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CR80 Height Share:</span>
          <span className="font-bold text-foreground">
            {((output.printSizeMm / 54) * 100).toFixed(1)}% of card height
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Info className="size-3.5 text-brand shrink-0" />
        <span>Vector SVG files remain infinite resolution at any physical size. PNG raster downloads render at the selected DPI.</span>
      </p>
    </div>
  );
};
