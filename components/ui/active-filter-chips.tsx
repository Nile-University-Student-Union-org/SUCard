"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { cn } from "cn";

export interface ActiveFilterItem {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface ActiveFilterChipsProps {
  filters: ActiveFilterItem[];
  onClearAll?: () => void;
  className?: string;
  label?: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onClearAll,
  className,
  label = "Active filters:",
}) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div
      aria-label="Active filters"
      className={cn("flex flex-wrap items-center gap-2 pt-1 animate-in fade-in-0 duration-200", className)}
    >
      {label && (
        <span className="text-xs font-bold text-ash dark:text-zinc-400 select-none mr-0.5">
          {label}
        </span>
      )}

      {filters.map((filter) => (
        <span
          key={filter.id}
          className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 min-h-[36px] rounded-[10px] bg-brand/10 dark:bg-brand/20 border border-brand/20 dark:border-brand-soft/30 text-xs font-bold text-brand dark:text-brand-soft shadow-2xs transition-all"
        >
          <span className="truncate max-w-[200px] sm:max-w-xs">{filter.label}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                filter.onRemove();
              }
            }}
            aria-label={`Remove filter: ${filter.label}`}
            className="p-1 min-h-[30px] min-w-[30px] rounded-md flex items-center justify-center hover:bg-brand/20 dark:hover:bg-brand/30 text-brand dark:text-brand-soft transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft active:scale-90"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </span>
      ))}

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[36px] rounded-[10px] text-xs font-bold text-ash dark:text-zinc-400 hover:text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Clear all</span>
        </button>
      )}
    </div>
  );
};
