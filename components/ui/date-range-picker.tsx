"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { DatePicker } from "@/components/ui/date-picker";
import {
  getDatePresets,
  type DatePresetKey,
} from "@/components/ui/analytics-format";
import { cn } from "@/lib/utils";

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
  const [prevFrom, setPrevFrom] = useState(from);
  const [prevTo, setPrevTo] = useState(to);

  if (from !== prevFrom) {
    setPrevFrom(from);
    setCustomFrom(from || "");
  }
  if (to !== prevTo) {
    setPrevTo(to);
    setCustomTo(to || "");
  }

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
    <div className={cn("space-y-3 font-sans", className)}>
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

      {/* Custom Date Inputs Panel */}
      {isCustomOpen && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-col sm:flex-row sm:items-end gap-3 p-3.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs animate-in fade-in-0 duration-150 motion-reduce:animate-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
            <div className="flex-1 min-w-[130px]">
              <DatePicker
                id="custom-from"
                label="From"
                value={customFrom}
                maxDate={customTo || undefined}
                onChange={(val) => setCustomFrom(val)}
                placeholder="Start date"
                clearable={false}
              />
            </div>
            <span className="hidden sm:inline-block text-muted-foreground self-end pb-3 shrink-0 font-bold">
              &rarr;
            </span>
            <div className="flex-1 min-w-[130px]">
              <DatePicker
                id="custom-to"
                label="To"
                value={customTo}
                minDate={customFrom || undefined}
                onChange={(val) => setCustomTo(val)}
                placeholder="End date"
                clearable={false}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="self-stretch sm:self-end normal-case font-bold h-11 min-h-[44px] px-5 shrink-0"
          >
            Apply
          </Button>
        </form>
      )}
    </div>
  );
}
