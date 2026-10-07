"use client";

import React from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { cn } from "cn";

export interface DotsSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

const DOT_SHAPES: {
  id: QrStyleConfig["modules"]["shape"];
  name: string;
  renderSwatch: () => React.ReactNode;
}[] = [
  {
    id: "circle",
    name: "Circle",
    renderSwatch: () => <div className="size-4 rounded-full bg-current" />,
  },
  {
    id: "rounded",
    name: "Rounded",
    renderSwatch: () => <div className="size-4 rounded-md bg-current" />,
  },
  {
    id: "square",
    name: "Square",
    renderSwatch: () => <div className="size-4 rounded-none bg-current" />,
  },
  {
    id: "diamond",
    name: "Diamond",
    renderSwatch: () => (
      <div className="size-3.5 rotate-45 bg-current my-0.5 mx-auto" />
    ),
  },
  {
    id: "vertical-bars",
    name: "V-Bars",
    renderSwatch: () => (
      <div className="w-2.5 h-4 rounded-full bg-current mx-auto" />
    ),
  },
  {
    id: "horizontal-bars",
    name: "H-Bars",
    renderSwatch: () => (
      <div className="w-4 h-2.5 rounded-full bg-current my-auto" />
    ),
  },
  {
    id: "classy",
    name: "Classy",
    renderSwatch: () => (
      <div className="size-4 rounded-tl-xl rounded-br-none bg-current" />
    ),
  },
];

export const DotsSection: React.FC<DotsSectionProps> = ({ config, onChange }) => {
  const handleShapeChange = (shape: QrStyleConfig["modules"]["shape"]) => {
    onChange((prev) => ({
      ...prev,
      modules: { ...prev.modules, shape },
    }));
  };

  const handleScaleChange = (scale: number) => {
    onChange((prev) => ({
      ...prev,
      modules: { ...prev.modules, scale: Math.max(0.5, Math.min(1, scale)) },
    }));
  };

  const handleRadiusChange = (radius: number) => {
    onChange((prev) => ({
      ...prev,
      modules: { ...prev.modules, radius: Math.max(0, Math.min(0.5, radius)) },
    }));
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Module Shape Picker */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Module (Dot) Shape
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DOT_SHAPES.map((shape) => {
            const isSelected = config.modules.shape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => handleShapeChange(shape.id)}
                className={cn(
                  "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-brand text-white border-brand shadow-sm font-bold"
                    : "bg-white dark:bg-zinc-800 text-charcoal dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:border-brand/40"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center size-6",
                    isSelected ? "text-white" : "text-brand dark:text-brand-soft"
                  )}
                >
                  {shape.renderSwatch()}
                </div>
                <span className="text-[11px] truncate w-full text-center">
                  {shape.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module Scale Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-foreground">
            Module Scale (Dot Gap)
          </label>
          <span className="font-mono font-bold text-foreground">
            {Math.round(config.modules.scale * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.0}
          step={0.02}
          value={config.modules.scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          className="w-full accent-brand h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>50% (Open)</span>
          <span>84% (NUSU Default)</span>
          <span>100% (Solid)</span>
        </div>
      </div>

      {/* Corner Radius Slider (when rounded shape is active) */}
      {config.modules.shape === "rounded" && (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="font-bold text-foreground">
              Corner Curvature Radius
            </label>
            <span className="font-mono font-bold text-foreground">
              {config.modules.radius.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.5}
            step={0.05}
            value={config.modules.radius}
            onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
            className="w-full accent-brand h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
