"use client";

import React from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { Lock, Info } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { cn } from "cn";

export interface EncodingSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

export const EncodingSection: React.FC<EncodingSectionProps> = ({
  config,
  onChange,
}) => {
  const hasLogo = config.logo.type !== "none";

  const handleEcLevelChange = (level: "L" | "M" | "Q" | "H") => {
    onChange((prev) => ({
      ...prev,
      encoding: { ...prev.encoding, ecLevel: level },
    }));
  };

  const handleVersionModeChange = (mode: "auto" | "fixed") => {
    onChange((prev) => ({
      ...prev,
      encoding: {
        ...prev.encoding,
        version: mode === "auto" ? null : prev.encoding.version || 3,
      },
    }));
  };

  const handleVersionValueChange = (val: number) => {
    onChange((prev) => ({
      ...prev,
      encoding: { ...prev.encoding, version: Math.max(1, Math.min(40, val)) },
    }));
  };

  const handleMaskModeChange = (mode: "auto" | "fixed") => {
    onChange((prev) => ({
      ...prev,
      encoding: {
        ...prev.encoding,
        mask: mode === "auto" ? null : prev.encoding.mask ?? 0,
      },
    }));
  };

  const handleMaskValueChange = (val: number) => {
    onChange((prev) => ({
      ...prev,
      encoding: { ...prev.encoding, mask: Math.max(0, Math.min(7, val)) },
    }));
  };

  const handleQuietZoneChange = (qz: number) => {
    onChange((prev) => ({
      ...prev,
      encoding: { ...prev.encoding, quietZone: qz },
    }));
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Error Correction Level */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-foreground">
            Error Correction Level
          </label>
          {hasLogo && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Lock className="size-3" />
              <span>Locked to H (Logo on)</span>
            </span>
          )}
        </div>

        <SegmentedControl
          options={[
            { value: "L", label: "L (7%)", disabled: hasLogo },
            { value: "M", label: "M (15%)", disabled: hasLogo },
            { value: "Q", label: "Q (25%)", disabled: hasLogo },
            { value: "H", label: "H (30%)" },
          ]}
          value={hasLogo ? "H" : config.encoding.ecLevel}
          onChange={(val) => handleEcLevelChange(val as "L" | "M" | "Q" | "H")}
          ariaLabel="Error correction level"
          fullWidth
          size="sm"
        />

        {hasLogo && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="size-3 text-brand shrink-0" />
            <span>High error correction (H) recovers up to 30% of occluded modules when using a logo plate.</span>
          </p>
        )}
      </div>

      {/* QR Version (Density) */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          QR Version (Grid Size)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleVersionModeChange("auto")}
            className={cn(
              "h-9 rounded-xl border text-xs font-bold cursor-pointer",
              config.encoding.version === null
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            Auto (Smallest)
          </button>
          <button
            type="button"
            onClick={() => handleVersionModeChange("fixed")}
            className={cn(
              "h-9 rounded-xl border text-xs font-bold cursor-pointer",
              config.encoding.version !== null
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            Fixed Version
          </button>
        </div>

        {config.encoding.version !== null && (
          <div className="pt-2">
            <Slider
              label="Version Size"
              showValue
              valueFormatter={(v) => `v${v} (${17 + v * 4}×${17 + v * 4})`}
              min={1}
              max={40}
              step={1}
              value={config.encoding.version}
              onChange={(val) => handleVersionValueChange(val)}
            />
          </div>
        )}
      </div>

      {/* Mask Pattern */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Mask Pattern
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleMaskModeChange("auto")}
            className={cn(
              "h-9 rounded-xl border text-xs font-bold cursor-pointer",
              config.encoding.mask === null
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            Auto (Optimal)
          </button>
          <button
            type="button"
            onClick={() => handleMaskModeChange("fixed")}
            className={cn(
              "h-9 rounded-xl border text-xs font-bold cursor-pointer",
              config.encoding.mask !== null
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            Fixed Mask
          </button>
        </div>

        {config.encoding.mask !== null && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMaskValueChange(m)}
                className={cn(
                  "size-11 rounded-lg border font-mono font-bold text-xs cursor-pointer",
                  config.encoding.mask === m
                    ? "bg-brand text-white border-brand shadow-2xs"
                    : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quiet Zone Slider */}
      <Slider
        label="Quiet Zone Margin"
        showValue
        valueFormatter={(v) => `${v} modules`}
        min={0}
        max={8}
        step={1}
        value={config.encoding.quietZone}
        onChange={(val) => handleQuietZoneChange(val)}
        ticks={[
          { value: 0, label: "0 (Risky)" },
          { value: 2, label: "2 (Standard)" },
          { value: 4, label: "4 (ISO default)" },
          { value: 8, label: "8 (Wide)" },
        ]}
      />
    </div>
  );
};
