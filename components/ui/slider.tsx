"use client";

import React, { forwardRef, useId, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface SliderTick {
  value: number;
  label: string;
}

export interface SliderProps {
  label?: React.ReactNode;
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  ticks?: SliderTick[];
  helperText?: string;
  error?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
  name?: string;
  showBubble?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      showValue = false,
      valueFormatter = (val) => String(val),
      ticks,
      helperText,
      error,
      className,
      id,
      ariaLabel,
      name,
      showBubble = false,
    },
    ref
  ) => {
    const generatedId = useId();
    const sliderId = id || generatedId;
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const safeMin = Number(min);
    const safeMax = Number(max) > safeMin ? Number(max) : safeMin + 1;
    const safeValue = Math.min(safeMax, Math.max(safeMin, Number(value) || 0));
    const percentage = Math.max(
      0,
      Math.min(100, ((safeValue - safeMin) / (safeMax - safeMin)) * 100)
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextVal = parseFloat(e.target.value);
        if (!isNaN(nextVal)) {
          onChange?.(nextVal);
        }
      },
      [onChange]
    );

    return (
      <div className={cn("w-full space-y-2 text-left select-none font-sans", className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={sliderId}
                className="text-xs font-bold text-slate-700 dark:text-zinc-300 block cursor-pointer truncate"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span className="font-mono text-xs font-bold text-charcoal dark:text-white shrink-0">
                {valueFormatter(safeValue)}
              </span>
            )}
          </div>
        )}

        {/* Track and Slider container */}
        <div className="relative flex items-center w-full min-h-[44px] touch-none">
          <div
            ref={trackRef}
            className={cn(
              "relative w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden transition-colors",
              disabled && "opacity-50"
            )}
          >
            {/* Filled active track */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-brand dark:bg-brand-soft rounded-full transition-[width] duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Visual Custom Thumb */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-75",
              "size-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-brand dark:border-brand-soft shadow-md",
              isDragging && "scale-110 ring-4 ring-brand/20 dark:ring-brand-soft/20",
              disabled && "opacity-50 border-slate-400 dark:border-zinc-600"
            )}
            style={{ left: `${percentage}%` }}
          >
            {/* Optional Floating Value Bubble */}
            {showBubble && isDragging && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-charcoal dark:bg-zinc-800 text-white text-[10px] font-mono font-bold whitespace-nowrap shadow-md animate-in fade-in-0 zoom-in-95">
                {valueFormatter(safeValue)}
              </div>
            )}
          </div>

          {/* Accessible native input overlay */}
          <input
            ref={ref}
            id={sliderId}
            name={name}
            type="range"
            min={safeMin}
            max={safeMax}
            step={step}
            value={safeValue}
            onChange={handleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onFocus={() => setIsDragging(true)}
            onBlur={() => setIsDragging(false)}
            disabled={disabled}
            aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
            aria-valuemin={safeMin}
            aria-valuemax={safeMax}
            aria-valuenow={safeValue}
            aria-valuetext={valueFormatter(safeValue)}
            className={cn(
              "absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed",
              "focus-visible:outline-none"
            )}
          />
        </div>

        {/* Optional Ticks / Scale labels */}
        {ticks && ticks.length > 0 && (
          <div className="flex justify-between items-center text-[10px] font-mono text-ash dark:text-zinc-400 px-0.5">
            {ticks.map((tick, idx) => (
              <span
                key={idx}
                className={cn(
                  "cursor-pointer hover:text-foreground transition-colors",
                  tick.value === safeValue && "font-bold text-brand dark:text-brand-soft"
                )}
                onClick={() => !disabled && onChange?.(tick.value)}
              >
                {tick.label}
              </span>
            ))}
          </div>
        )}

        {error ? (
          <p className="text-xs font-bold text-destructive flex items-center gap-1 animate-in fade-in-0 duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs font-medium text-ash dark:text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Slider.displayName = "Slider";
