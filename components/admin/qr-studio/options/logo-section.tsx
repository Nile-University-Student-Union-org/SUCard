"use client";

import React from "react";
import Image from "next/image";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { ColorInput } from "./color-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";
import { cn } from "cn";

export interface LogoSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

export const LogoSection: React.FC<LogoSectionProps> = ({ config, onChange }) => {
  const logo = config.logo;

  const handleLogoTypeChange = (type: "none" | "nusu") => {
    onChange((prev) => ({
      ...prev,
      encoding: {
        ...prev.encoding,
        ecLevel: type === "none" ? prev.encoding.ecLevel : "H",
      },
      logo: {
        ...prev.logo,
        type,
        sizePercent: type === "none" ? 0 : prev.logo.sizePercent || 16,
        padding: type === "none" ? 0 : prev.logo.padding || 1,
        legacySignature: false,
      },
    }));
  };

  const handleSizePercentChange = (sizePercent: number) => {
    onChange((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        sizePercent: Math.max(0, Math.min(25, sizePercent)),
        legacySignature: false,
      },
    }));
  };

  const handlePaddingChange = (padding: number) => {
    onChange((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        padding: Math.max(0, Math.min(5, padding)),
        legacySignature: false,
      },
    }));
  };

  const handlePlateChange = (plate: "none" | "circle" | "rounded-square") => {
    onChange((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        plate,
        legacySignature: false,
      },
    }));
  };

  const handlePlateColorChange = (plateColor: string) => {
    onChange((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        plateColor,
        legacySignature: false,
      },
    }));
  };

  const handleClearModeChange = (clear: "square" | "plate") => {
    onChange((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        clear,
        legacySignature: false,
      },
    }));
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Logo Selector */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Center Brand Asset
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleLogoTypeChange("none")}
            className={cn(
              "p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer",
              logo.type === "none"
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            <span>No Logo</span>
          </button>
          <button
            type="button"
            onClick={() => handleLogoTypeChange("nusu")}
            className={cn(
              "p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer",
              logo.type === "nusu"
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            <Image
              src="/brand/su-icon-white@hd.png"
              alt="NUSU"
              width={16}
              height={16}
              className={cn(
                "size-4 object-contain",
                logo.type === "none" && "opacity-70 invert dark:invert-0"
              )}
            />
            <span>NUSU Brand Icon</span>
          </button>
        </div>
      </div>

      {logo.type === "nusu" && (
        <>
          {/* Size % Slider */}
          <div className="space-y-1">
            <Slider
              label="Logo Size (% of QR Width)"
              showValue
              valueFormatter={(v) => `${v}% (Max 25%)`}
              min={5}
              max={25}
              step={1}
              value={logo.sizePercent}
              onChange={(val) => handleSizePercentChange(val)}
              ticks={[
                { value: 5, label: "5% (Subtle)" },
                { value: 16, label: "16% (Balanced)" },
                { value: 25, label: "25% (Hard Maximum)" },
              ]}
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <Info className="size-3 text-brand shrink-0" />
              <span>Hard capped at 25% to guarantee camera scannability within QR Reed-Solomon recovery capacity.</span>
            </p>
          </div>

          {/* Padding Slider */}
          <Slider
            label="Logo Module Margin (Padding)"
            showValue
            valueFormatter={(v) => `${v} modules`}
            min={0}
            max={5}
            step={0.5}
            value={logo.padding}
            onChange={(val) => handlePaddingChange(val)}
          />

          {/* Background Plate Shape */}
          <div className="space-y-2">
            <label className="font-bold text-foreground">
              Background Plate Shape
            </label>
            <SegmentedControl
              options={[
                { value: "none", label: "None" },
                { value: "circle", label: "Circle" },
                { value: "rounded-square", label: "Rounded" },
              ]}
              value={logo.plate}
              onChange={(val) =>
                handlePlateChange(val as "none" | "circle" | "rounded-square")
              }
              ariaLabel="Background plate"
              fullWidth
              size="sm"
            />
          </div>

          {/* Plate Color */}
          {logo.plate !== "none" && (
            <ColorInput
              label="Plate Background Color"
              value={logo.plateColor}
              onChange={handlePlateColorChange}
            />
          )}

          {/* Clear Modules Area Mode */}
          <div className="space-y-2">
            <label className="font-bold text-foreground">
              Clear Module Behind Logo
            </label>
            <SegmentedControl
              options={[
                { value: "square", label: "Square Zone" },
                { value: "plate", label: "Match Plate" },
              ]}
              value={logo.clear}
              onChange={(val) =>
                handleClearModeChange(val as "square" | "plate")
              }
              ariaLabel="Clear area"
              fullWidth
              size="sm"
            />
          </div>
        </>
      )}
    </div>
  );
};
