"use client";

import React from "react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatItem {
  label: string;
  value: React.ReactNode;
  subText?: React.ReactNode;
  badge?: React.ReactNode;
  /** Special hint to display when the value is 0 (or "0") */
  zeroHint?: string;
}

export interface StatStripProps {
  items: StatItem[];
  className?: string;
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  "aria-label"?: string;
}

function isZeroValue(val: React.ReactNode): boolean {
  if (val === 0 || val === "0" || val === 0.0) return true;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "0" || trimmed === "EGP 0.00" || trimmed === "0%" || trimmed === "0.0%";
  }
  return false;
}

export function StatStrip({
  items,
  className,
  isLoading = false,
  columns = 4,
  "aria-label": ariaLabel = "Summary metrics",
}: StatStripProps) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns];

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-slate-100 sm:divide-y-0 sm:divide-x sm:divide-slate-200/80 dark:divide-zinc-800/80 shadow-xs",
          colClass,
          className
        )}
        aria-busy="true"
        aria-label="Loading statistics"
      >
        {Array.from({ length: items.length || 4 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 sm:divide-y-0 sm:divide-x sm:divide-slate-200/80 dark:divide-zinc-800/80 shadow-xs",
        colClass,
        className
      )}
      role="region"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const isZero = isZeroValue(item.value);
        return (
          <div
            key={index}
            className="p-4 sm:p-5 flex flex-col justify-between min-w-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-800/30"
          >
            {/* Top row: Label & optional badge */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-[11px] font-semibold text-ash dark:text-zinc-400 truncate">
                {item.label}
              </span>
              {item.badge && <div className="shrink-0">{item.badge}</div>}
            </div>

            {/* Main Value */}
            <div className="mt-2 min-w-0">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal dark:text-white tabular-nums truncate">
                {item.value}
              </div>

              {/* Subtext or contextual zero hint */}
              {(item.zeroHint && isZero) ? (
                <p className="mt-1 text-xs text-muted-foreground/80 font-normal leading-relaxed truncate">
                  {item.zeroHint}
                </p>
              ) : item.subText ? (
                <p className="mt-1 text-xs text-ash dark:text-zinc-400 font-normal leading-relaxed truncate">
                  {item.subText}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
