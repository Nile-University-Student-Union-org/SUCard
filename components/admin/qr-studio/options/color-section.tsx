"use client";

import React from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { ColorInput } from "./color-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

export interface ColorSectionProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
}

export const ColorSection: React.FC<ColorSectionProps> = ({ config, onChange }) => {
  const paint = config.modules.paint;

  const handlePaintTypeChange = (type: "solid" | "linear" | "radial") => {
    onChange((prev) => {
      if (type === "solid") {
        const currentColor =
          prev.modules.paint.type === "solid"
            ? prev.modules.paint.color
            : prev.modules.paint.stops[0]?.color ?? "#0F3056";
        return {
          ...prev,
          modules: {
            ...prev.modules,
            paint: { type: "solid", color: currentColor },
          },
        };
      } else if (type === "linear") {
        const stops =
          prev.modules.paint.type !== "solid"
            ? prev.modules.paint.stops
            : [
                { offset: 0, color: prev.modules.paint.color },
                { offset: 1, color: "#018BCE" },
              ];
        return {
          ...prev,
          modules: {
            ...prev.modules,
            paint: { type: "linear", angle: 45, stops },
          },
        };
      } else {
        const stops =
          prev.modules.paint.type !== "solid"
            ? prev.modules.paint.stops
            : [
                { offset: 0, color: prev.modules.paint.color },
                { offset: 1, color: "#018BCE" },
              ];
        return {
          ...prev,
          modules: {
            ...prev.modules,
            paint: { type: "radial", stops },
          },
        };
      }
    });
  };

  const handleSolidColorChange = (color: string) => {
    onChange((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        paint: { type: "solid", color },
      },
    }));
  };

  const handleAngleChange = (angle: number) => {
    if (paint.type !== "linear") return;
    onChange((prev) => {
      if (prev.modules.paint.type !== "linear") return prev;
      return {
        ...prev,
        modules: {
          ...prev.modules,
          paint: { ...prev.modules.paint, angle },
        },
      };
    });
  };

  const handleStopColorChange = (index: number, color: string) => {
    onChange((prev) => {
      if (prev.modules.paint.type === "solid") return prev;
      const stops = [...prev.modules.paint.stops];
      stops[index] = { ...stops[index], color };
      return {
        ...prev,
        modules: {
          ...prev.modules,
          paint: { ...prev.modules.paint, stops },
        },
      };
    });
  };

  const handleStopOffsetChange = (index: number, offset: number) => {
    onChange((prev) => {
      if (prev.modules.paint.type === "solid") return prev;
      const stops = [...prev.modules.paint.stops];
      stops[index] = { ...stops[index], offset };
      return {
        ...prev,
        modules: {
          ...prev.modules,
          paint: { ...prev.modules.paint, stops },
        },
      };
    });
  };

  const addGradientStop = () => {
    onChange((prev) => {
      if (prev.modules.paint.type === "solid" || prev.modules.paint.stops.length >= 5)
        return prev;
      const stops = [...prev.modules.paint.stops];
      const count = stops.length;
      // Insert new stop evenly distributed
      const newStops = [
        { offset: 0, color: stops[0].color },
        ...Array.from({ length: count - 1 }, (_, i) => ({
          offset: Number(((i + 1) / count).toFixed(2)),
          color: stops[Math.min(i + 1, count - 1)].color,
        })),
        { offset: 1, color: stops[count - 1].color },
      ];
      return {
        ...prev,
        modules: {
          ...prev.modules,
          paint: { ...prev.modules.paint, stops: newStops },
        },
      };
    });
  };

  const removeGradientStop = (index: number) => {
    onChange((prev) => {
      if (prev.modules.paint.type === "solid" || prev.modules.paint.stops.length <= 2)
        return prev;
      const stops = prev.modules.paint.stops.filter((_, i) => i !== index);
      stops[0] = { ...stops[0], offset: 0 };
      stops[stops.length - 1] = { ...stops[stops.length - 1], offset: 1 };
      return {
        ...prev,
        modules: {
          ...prev.modules,
          paint: { ...prev.modules.paint, stops },
        },
      };
    });
  };

  const handleBackgroundTypeChange = (type: "solid" | "transparent") => {
    onChange((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        type,
      },
    }));
  };

  const handleBackgroundColorChange = (color: string) => {
    onChange((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        color,
      },
    }));
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Foreground / Paint Mode */}
      <div className="space-y-2">
        <label className="font-bold text-foreground">
          Module Paint Style
        </label>
        <SegmentedControl
          options={[
            { value: "solid", label: "Solid Color" },
            { value: "linear", label: "Linear Gradient" },
            { value: "radial", label: "Radial Gradient" },
          ]}
          value={paint.type}
          onChange={(val) => handlePaintTypeChange(val as "solid" | "linear" | "radial")}
          ariaLabel="Paint style"
          fullWidth
          size="sm"
        />
      </div>

      {/* Paint Details */}
      {paint.type === "solid" ? (
        <ColorInput
          label="Foreground Color"
          value={paint.color}
          onChange={handleSolidColorChange}
        />
      ) : (
        <div className="space-y-4 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
          {/* Gradient Angle (if linear) */}
          {paint.type === "linear" && (
            <Slider
              label="Gradient Angle"
              showValue
              valueFormatter={(v) => `${v}°`}
              min={0}
              max={360}
              step={5}
              value={paint.angle}
              onChange={(val) => handleAngleChange(val)}
            />
          )}

          {/* Gradient Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground">
                Gradient Stops ({paint.stops.length}/5)
              </label>
              {paint.stops.length < 5 && (
                <Button
                  variant="surface"
                  size="sm"
                  onClick={addGradientStop}
                  className="h-7 px-2 text-[11px] font-bold normal-case rounded-lg"
                >
                  <Plus className="size-3 mr-1" />
                  Add Stop
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {paint.stops.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                >
                  <span className="font-mono text-[11px] font-bold text-ash w-6">
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <ColorInput
                      value={s.color}
                      onChange={(hex) => handleStopColorChange(idx, hex)}
                    />
                  </div>
                  {idx > 0 && idx < paint.stops.length - 1 && (
                    <div className="w-16">
                      <Input
                        type="number"
                        min={0.01}
                        max={0.99}
                        step={0.05}
                        value={s.offset}
                        onChange={(e) =>
                          handleStopOffsetChange(idx, parseFloat(e.target.value))
                        }
                        className="font-mono text-center text-xs font-bold px-1"
                        aria-label={`Stop #${idx + 1} offset`}
                      />
                    </div>
                  )}
                  {paint.stops.length > 2 && idx > 0 && idx < paint.stops.length - 1 && (
                    <button
                      type="button"
                      onClick={() => removeGradientStop(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Remove stop"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Background Options */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <label className="font-bold text-foreground">
          QR Background
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleBackgroundTypeChange("solid")}
            className={cn(
              "h-9 rounded-xl border text-xs font-bold cursor-pointer",
              config.background.type === "solid"
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            Solid Color
          </button>
          <button
            type="button"
            onClick={() => handleBackgroundTypeChange("transparent")}
            className={cn(
              "h-9 rounded-xl border text-xs font-bold cursor-pointer",
              config.background.type === "transparent"
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
            )}
          >
            Transparent
          </button>
        </div>

        {config.background.type === "solid" && (
          <ColorInput
            label="Background Color"
            value={config.background.color}
            onChange={handleBackgroundColorChange}
          />
        )}
      </div>
    </div>
  );
};
