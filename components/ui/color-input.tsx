"use client";

import React, { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export const SU_BRAND_COLORS = [
  { name: "SU Navy", hex: "#0F3056" },
  { name: "SU Blue", hex: "#0F548D" },
  { name: "SU Sky", hex: "#018BCE" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Slate", hex: "#64748B" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Rose", hex: "#EF4444" },
];

const RECENT_COLORS_KEY = "sucard_qr_recent_colors";

export function getRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_COLORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentColor(hex: string) {
  if (typeof window === "undefined" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  try {
    const current = getRecentColors();
    const updated = [
      hex.toUpperCase(),
      ...current.filter((c) => c.toUpperCase() !== hex.toUpperCase()),
    ].slice(0, 8);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  } catch {}
}

export interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: string;
  helperText?: string;
}

export const ColorInput: React.FC<ColorInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  className,
  id,
  error,
  helperText,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return getRecentColors();
    }
    return [];
  });
  const [prevPropValue, setPrevPropValue] = useState(value);
  const [localValue, setLocalValue] = useState(value);

  if (value !== prevPropValue) {
    setPrevPropValue(value);
    setLocalValue(value);
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      onChange(raw);
      saveRecentColor(raw);
      setRecentColors(getRecentColors());
    }
  };

  const handleNativePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toUpperCase();
    setLocalValue(hex);
    onChange(hex);
    saveRecentColor(hex);
    setRecentColors(getRecentColors());
  };

  const selectColor = (hex: string) => {
    setLocalValue(hex);
    onChange(hex);
    saveRecentColor(hex);
    setRecentColors(getRecentColors());
  };

  return (
    <div className={cn("space-y-2 text-left font-sans", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-slate-700 dark:text-zinc-300 block"
        >
          {label}
        </label>
      )}

      {/* Main Color Swatch & Hex input */}
      <div className="flex items-center gap-2">
        <div className="relative size-11 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-zinc-700 shrink-0 shadow-xs cursor-pointer">
          <input
            type="color"
            value={value.slice(0, 7)}
            onChange={handleNativePicker}
            disabled={disabled}
            className="absolute -inset-2 w-16 h-16 cursor-pointer opacity-0"
            title="Pick color"
            aria-label={label ? `${label} color picker` : "Color picker"}
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: value }}
          />
        </div>

        <div className="flex-1">
          <Input
            id={inputId}
            value={localValue}
            onChange={handleHexChange}
            disabled={disabled}
            placeholder="#0F3056"
            maxLength={7}
            error={error}
            helperText={helperText}
            className="font-mono uppercase font-bold text-xs"
          />
        </div>
      </div>

      {/* SU Brand Palettes */}
      <div className="space-y-1 pt-1">
        <span className="text-xs font-semibold text-muted-foreground block">
          SU Brand Palette
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SU_BRAND_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => selectColor(c.hex)}
              disabled={disabled}
              className={cn(
                "size-6 rounded-lg border border-black/20 transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xs",
                value.toUpperCase() === c.hex.toUpperCase() &&
                  "ring-2 ring-brand ring-offset-2 ring-offset-background"
              )}
              style={{ backgroundColor: c.hex }}
              title={`${c.name} (${c.hex})`}
              aria-label={`${c.name} (${c.hex})`}
            />
          ))}
        </div>
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-xs font-semibold text-muted-foreground block">
            Recent
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => selectColor(hex)}
                disabled={disabled}
                className={cn(
                  "size-6 rounded-lg border border-black/20 transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xs",
                  value.toUpperCase() === hex.toUpperCase() &&
                    "ring-2 ring-brand ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: hex }}
                title={hex}
                aria-label={`Recent color ${hex}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
