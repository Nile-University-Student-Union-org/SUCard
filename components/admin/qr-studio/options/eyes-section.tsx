"use client";

import React, { useState } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { ColorInput } from "./color-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "cn";

export interface EyesSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

type EyeKey = "topLeft" | "topRight" | "bottomLeft";

const FRAME_SHAPES = [
  { id: "rounded", name: "Rounded" },
  { id: "square", name: "Square" },
  { id: "circle", name: "Circle" },
  { id: "leaf", name: "Leaf" },
  { id: "cushion", name: "Cushion" },
] as const;

const PUPIL_SHAPES = [
  { id: "rounded", name: "Rounded" },
  { id: "square", name: "Square" },
  { id: "circle", name: "Circle" },
  { id: "diamond", name: "Diamond" },
  { id: "leaf", name: "Leaf" },
] as const;

export const EyesSection: React.FC<EyesSectionProps> = ({ config, onChange }) => {
  const [sameForAll, setSameForAll] = useState(true);
  const [activeEye, setActiveEye] = useState<EyeKey>("topLeft");

  const currentEye = config.eyes[activeEye];

  const updateEye = (
    updater: (
      prevEye: QrStyleConfig["eyes"]["topLeft"]
    ) => QrStyleConfig["eyes"]["topLeft"]
  ) => {
    onChange((prev) => {
      if (sameForAll) {
        const updated = updater(prev.eyes.topLeft);
        return {
          ...prev,
          eyes: {
            topLeft: updated,
            topRight: updated,
            bottomLeft: updated,
          },
        };
      } else {
        return {
          ...prev,
          eyes: {
            ...prev.eyes,
            [activeEye]: updater(prev.eyes[activeEye]),
          },
        };
      }
    });
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Same for All Eyes Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
        <div>
          <label className="font-bold text-foreground block">
            Link All 3 Finder Eyes
          </label>
          <p className="text-[11px] text-muted-foreground">
            Apply identical geometry and colors to all corners
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sameForAll}
          onClick={() => setSameForAll(!sameForAll)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            sameForAll ? "bg-brand" : "bg-slate-300 dark:bg-zinc-700"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
              sameForAll ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Per-Eye Tabs (when unlinked) */}
      {!sameForAll && (
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
          {(
            [
              { id: "topLeft", label: "Top-Left" },
              { id: "topRight", label: "Top-Right" },
              { id: "bottomLeft", label: "Bottom-Left" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEye(tab.id)}
              className={cn(
                "py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer",
                activeEye === tab.id
                  ? "bg-white dark:bg-zinc-900 text-brand dark:text-brand-soft shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Frame Shape */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Outer Frame Shape
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {FRAME_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() =>
                updateEye((eye) => ({ ...eye, frameShape: shape.id }))
              }
              className={cn(
                "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                currentEye.frameShape === shape.id
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
              )}
            >
              {shape.name}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Radius (when rounded) */}
      {currentEye.frameShape === "rounded" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-foreground">
              Frame Corner Radius
            </label>
            <span className="font-mono font-bold text-foreground">
              {currentEye.frameRadius.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={3.5}
            step={0.1}
            value={currentEye.frameRadius}
            onChange={(e) =>
              updateEye((eye) => ({
                ...eye,
                frameRadius: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-brand h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* Frame Color */}
      <ColorInput
        label="Outer Frame Color"
        value={currentEye.frameColor}
        onChange={(color) => updateEye((eye) => ({ ...eye, frameColor: color }))}
      />

      {/* Inner Pupil Shape */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <label className="font-bold text-foreground">
          Inner Pupil Shape
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {PUPIL_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() =>
                updateEye((eye) => ({ ...eye, pupilShape: shape.id }))
              }
              className={cn(
                "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                currentEye.pupilShape === shape.id
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
              )}
            >
              {shape.name}
            </button>
          ))}
        </div>
      </div>

      {/* Pupil Color */}
      <ColorInput
        label="Inner Pupil Color"
        value={currentEye.pupilColor}
        onChange={(color) => updateEye((eye) => ({ ...eye, pupilColor: color }))}
      />

      {/* Rotation */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <label className="font-bold text-foreground">
          Eye Geometry Rotation
        </label>
        <SegmentedControl
          options={[
            { value: "0", label: "0°" },
            { value: "90", label: "90°" },
            { value: "180", label: "180°" },
            { value: "270", label: "270°" },
          ]}
          value={String(currentEye.rotation)}
          onChange={(val) =>
            updateEye((eye) => ({
              ...eye,
              rotation: Number(val) as 0 | 90 | 180 | 270,
            }))
          }
          ariaLabel="Eye rotation"
          fullWidth
          size="sm"
        />
      </div>
    </div>
  );
};
