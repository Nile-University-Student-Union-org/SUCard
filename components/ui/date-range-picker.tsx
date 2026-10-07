"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import {
  getDatePresets,
  type DatePresetKey,
} from "@/components/ui/analytics-format";
import { cn } from "cn";

export interface DateRangePickerProps {
  from?: string;
  to?: string;
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
  showCustomInputs?: boolean;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
}: DateRangePickerProps) {
  const presets = getDatePresets();

  // Determine active preset based on current from/to
  const getActivePreset = (): DatePresetKey => {
    if (!from || !to) return "last_30_days";
    for (const preset of presets) {
      const pRange = preset.getFromTo();
      if (pRange.from === from && pRange.to === to) {
        return preset.key;
      }
    }
    return "custom";
  };

  const activePreset = getActivePreset();
  const [isCustomOpen, setIsCustomOpen] = useState(activePreset === "custom");
  const [customFrom, setCustomFrom] = useState(from || "");
  const [customTo, setCustomTo] = useState(to || "");

  const handleSelectPreset = (key: DatePresetKey) => {
    if (key === "custom") {
      setIsCustomOpen(true);
      return;
    }
    setIsCustomOpen(false);
    const preset = presets.find((p) => p.key === key);
    if (preset) {
      const range = preset.getFromTo();
      onChange(range);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrom && customTo && customFrom <= customTo) {
      onChange({ from: customFrom, to: customTo });
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Preset Chips Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {presets.map((preset) => {
          const isSelected = activePreset === preset.key && !isCustomOpen;
          return (
            <ToggleChip
              key={preset.key}
              pressed={isSelected}
              onPressedChange={() => handleSelectPreset(preset.key)}
              size="sm"
            >
              <span>{preset.label}</span>
            </ToggleChip>
          );
        })}

        <ToggleChip
          pressed={activePreset === "custom" || isCustomOpen}
          onPressedChange={() => setIsCustomOpen(!isCustomOpen)}
          size="sm"
          icon={CalendarIcon}
        >
          <span>Custom</span>
        </ToggleChip>
      </div>

      {/* Custom Date Inputs Dropdown/Panel */}
      {isCustomOpen && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs animate-in fade-in-0 duration-150"
        >
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="flex-1">
              <label htmlFor="custom-from" className="block text-[10px] font-bold uppercase text-ash dark:text-zinc-400 mb-1">
                From
              </label>
              <input
                id="custom-from"
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>
            <span className="text-muted-foreground self-end pb-2.5">&rarr;</span>
            <div className="flex-1">
              <label htmlFor="custom-to" className="block text-[10px] font-bold uppercase text-ash dark:text-zinc-400 mb-1">
                To
              </label>
              <input
                id="custom-to"
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="self-end normal-case font-bold h-10 min-h-[40px] px-4 shrink-0"
          >
            Apply
          </Button>
        </form>
      )}
    </div>
  );
}
