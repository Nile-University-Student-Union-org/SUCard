"use client";

import React from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { ColorInput } from "./color-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export interface FrameSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

export const FrameSection: React.FC<FrameSectionProps> = ({ config, onChange }) => {
  const frame = config.frame;

  const handleShapeChange = (shape: QrStyleConfig["frame"]["shape"]) => {
    onChange((prev) => ({
      ...prev,
      frame: {
        ...prev.frame,
        shape,
        width: shape === "none" ? 0 : prev.frame.width || 1,
      },
    }));
  };

  const handleColorChange = (color: string) => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, color },
    }));
  };

  const handleWidthChange = (width: number) => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, width: Math.max(0, Math.min(4, width)) },
    }));
  };

  const handleLabelChange = (label: string) => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, label: label.slice(0, 24) },
    }));
  };

  const handleFontChange = (font: "anton" | "poppins") => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, font },
    }));
  };

  const handleLabelColorChange = (labelColor: string) => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, labelColor },
    }));
  };

  const handlePositionChange = (position: "top" | "bottom") => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, position },
    }));
  };

  const handleBadgeColorChange = (badgeColor: string | null) => {
    onChange((prev) => ({
      ...prev,
      frame: { ...prev.frame, badgeColor },
    }));
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Frame Shape */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Outer Border Frame
        </label>
        <SegmentedControl
          options={[
            { value: "none", label: "None" },
            { value: "square", label: "Square" },
            { value: "rounded", label: "Rounded" },
            { value: "pill", label: "Pill" },
          ]}
          value={frame.shape}
          onChange={(val) =>
            handleShapeChange(val as "none" | "square" | "rounded" | "pill")
          }
          ariaLabel="Frame shape"
          fullWidth
          size="sm"
        />
      </div>

      {frame.shape !== "none" && (
        <>
          {/* Frame Color */}
          <ColorInput
            label="Border Frame Color"
            value={frame.color}
            onChange={handleColorChange}
          />

          {/* Frame Width */}
          <Slider
            label="Border Stroke Width"
            showValue
            valueFormatter={(v) => `${v.toFixed(1)} px`}
            min={0.5}
            max={4}
            step={0.5}
            value={frame.width}
            onChange={(val) => handleWidthChange(val)}
          />
        </>
      )}

      {/* CTA Label */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <Input
          label="Call-to-Action Label"
          type="text"
          value={frame.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="e.g. SCAN TO REDEEM"
          maxLength={24}
          helperText={`${frame.label.length}/24 chars`}
          className="font-bold text-xs"
        />

        {frame.label.length > 0 && (
          <>
            {/* Label Font */}
            <div className="space-y-2">
              <label className="font-bold text-foreground">
                Label Typography Font
              </label>
              <SegmentedControl
                options={[
                  { value: "anton", label: "Anton (Display)" },
                  { value: "poppins", label: "Poppins (Clean)" },
                ]}
                value={frame.font}
                onChange={(val) => handleFontChange(val as "anton" | "poppins")}
                ariaLabel="Label font"
                fullWidth
                size="sm"
              />
            </div>

            {/* Label Position */}
            <div className="space-y-2">
              <label className="font-bold text-foreground">
                Label Placement
              </label>
              <SegmentedControl
                options={[
                  { value: "bottom", label: "Bottom" },
                  { value: "top", label: "Top" },
                ]}
                value={frame.position}
                onChange={(val) =>
                  handlePositionChange(val as "top" | "bottom")
                }
                ariaLabel="Label position"
                fullWidth
                size="sm"
              />
            </div>

            {/* Label Text Color */}
            <ColorInput
              label="Label Text Color"
              value={frame.labelColor}
              onChange={handleLabelColorChange}
            />

            {/* Background Badge Color */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground">
                  Label Background Badge
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleBadgeColorChange(
                      frame.badgeColor === null ? "#0F3056" : null
                    )
                  }
                  className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                >
                  {frame.badgeColor === null ? "+ Add Badge" : "Remove Badge"}
                </button>
              </div>

              {frame.badgeColor !== null && (
                <ColorInput
                  value={frame.badgeColor}
                  onChange={(color) => handleBadgeColorChange(color)}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
