"use client";

import React, { useState, useMemo } from "react";
import { cn } from "cn";

export interface BarChartItem {
  id?: string;
  label: string;
  value: number;
  subLabel?: string;
  color?: string;
}

export interface BarChartProps {
  data: BarChartItem[];
  orientation?: "vertical" | "horizontal";
  height?: number;
  barColor?: string;
  valueLabel?: string;
  valueFormatter?: (val: number) => string;
  emptyMessage?: string;
  title?: string;
  description?: string;
  className?: string;
  ariaLabel?: string;
  maxItems?: number;
}

export function BarChart({
  data,
  orientation = "horizontal",
  height,
  barColor = "#0F548D",
  valueLabel = "Redemptions",
  valueFormatter = (val) => new Intl.NumberFormat("en-GB").format(val),
  emptyMessage = "No breakdown available for this selection.",
  title,
  description,
  className,
  ariaLabel = "Bar chart breakdown",
  maxItems = 10,
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const displayData = useMemo(() => {
    if (!data) return [];
    return data.slice(0, maxItems);
  }, [data, maxItems]);

  const maxValue = useMemo(() => {
    if (!displayData.length) return 0;
    return Math.max(...displayData.map((d) => d.value), 0);
  }, [displayData]);

  const totalValue = useMemo(() => {
    return displayData.reduce((acc, curr) => acc + curr.value, 0);
  }, [displayData]);

  const hasData = displayData.length > 0 && maxValue > 0;

  if (!hasData) {
    return (
      <div className={cn("w-full space-y-2", className)}>
        {title && (
          <h3 className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground min-h-[140px]">
          <p className="font-semibold">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {title && (
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Accessible Table for Screen Readers */}
      <table className="sr-only">
        <caption>{title || ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">{valueLabel}</th>
            <th scope="col">Share (%)</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((item, idx) => {
            const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
            return (
              <tr key={idx}>
                <td>{item.label}</td>
                <td>{item.value}</td>
                <td>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Horizontal Bar List View (clean, readable on mobile & desktop) */}
      {orientation === "horizontal" && (
        <div className="space-y-2.5" role="list" aria-label={ariaLabel}>
          {displayData.map((item, idx) => {
            const pct = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 2) : 0;
            const share = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
            const isHovered = hoveredIdx === idx;
            const activeColor = item.color || barColor;

            return (
              <div
                key={item.id || idx}
                className="group relative space-y-1 cursor-default rounded-lg p-1 transition-colors hover:bg-muted/30"
                onPointerEnter={() => setHoveredIdx(idx)}
                onPointerLeave={() => setHoveredIdx(null)}
                role="listitem"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-foreground truncate block">
                      {item.label}
                    </span>
                    {item.subLabel && (
                      <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                        ({item.subLabel})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className="font-bold text-foreground">
                      {valueFormatter(item.value)}
                    </span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                      {share}%
                    </span>
                  </div>
                </div>

                {/* Bar Track & Fill */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none",
                      isHovered ? "brightness-125" : ""
                    )}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: activeColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vertical Bars View (useful for compact histograms) */}
      {orientation === "vertical" && (
        <div
          className="flex items-end gap-2 pt-4 px-2"
          style={{ height: height || 180 }}
          role="img"
          aria-label={ariaLabel}
        >
          {displayData.map((item, idx) => {
            const heightPct = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 4) : 0;
            const isHovered = hoveredIdx === idx;
            const activeColor = item.color || barColor;

            return (
              <div
                key={item.id || idx}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-default relative"
                onPointerEnter={() => setHoveredIdx(idx)}
                onPointerLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-7 z-20 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 pointer-events-none">
                    {valueFormatter(item.value)}
                  </div>
                )}

                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-zinc-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-300 motion-reduce:transition-none",
                      isHovered ? "brightness-125" : ""
                    )}
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: activeColor,
                    }}
                  />
                </div>

                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[48px] text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
