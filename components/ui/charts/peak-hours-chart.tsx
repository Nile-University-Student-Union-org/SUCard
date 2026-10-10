"use client";

import React, { useState, useMemo } from "react";
import { cn } from "cn";
import type { PeakCount } from "@/lib/analytics/types";

export interface PeakHoursChartProps {
  peakHours: PeakCount[];
  peakDays?: PeakCount[];
  className?: string;
  title?: string;
  description?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function PeakHoursChart({
  peakHours,
  peakDays,
  className,
  title = "Peak Hours & Days",
  description = "Scan distribution across Cairo time",
}: PeakHoursChartProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Map 0..23 hours
  const hoursMap = useMemo(() => {
    const map = new Map<number, number>();
    for (let h = 0; h < 24; h++) map.set(h, 0);
    peakHours?.forEach((p) => {
      map.set(Number(p.value), Number(p.redemptions));
    });
    return Array.from(map.entries()).map(([hour, count]) => ({
      hour,
      label: formatHour(hour),
      count,
    }));
  }, [peakHours]);

  // Map 0..6 days
  const daysMap = useMemo(() => {
    if (!peakDays) return [];
    const map = new Map<number, number>();
    for (let d = 0; d < 7; d++) map.set(d, 0);
    peakDays.forEach((p) => {
      map.set(Number(p.value), Number(p.redemptions));
    });
    return Array.from(map.entries()).map(([dayIdx, count]) => ({
      dayIdx,
      name: DAY_NAMES[dayIdx] || `Day ${dayIdx}`,
      count,
    }));
  }, [peakDays]);

  const maxHourCount = useMemo(() => {
    return Math.max(...hoursMap.map((h) => h.count), 0);
  }, [hoursMap]);

  const maxDayCount = useMemo(() => {
    if (!daysMap.length) return 0;
    return Math.max(...daysMap.map((d) => d.count), 0);
  }, [daysMap]);

  const totalHourScans = useMemo(() => {
    return hoursMap.reduce((acc, h) => acc + h.count, 0);
  }, [hoursMap]);

  const hasData = totalHourScans > 0 || maxDayCount > 0;

  if (!hasData) {
    return (
      <div className={cn("space-y-2", className)}>
        {title && (
          <h3 className="font-sans font-semibold text-xs text-ash dark:text-zinc-400">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground min-h-[140px]">
          <p className="font-semibold">No peak activity recorded in this date range.</p>
        </div>
      </div>
    );
  }

  // Active university operating hours filter (focus from 8 AM to 11 PM or show full 24h)
  const displayHours = hoursMap.filter((h) => h.hour >= 7 && h.hour <= 23);

  return (
    <div className={cn("space-y-4 select-none", className)}>
      {title && (
        <div className="flex items-baseline justify-between">
          <h3 className="font-sans font-semibold text-xs text-ash dark:text-zinc-400">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Screen Reader Table */}
      <table className="sr-only">
        <caption>Hourly and Daily Peak Distribution</caption>
        <thead>
          <tr>
            <th scope="col">Hour</th>
            <th scope="col">Redemptions</th>
          </tr>
        </thead>
        <tbody>
          {hoursMap.map((h) => (
            <tr key={h.hour}>
              <td>{h.label}</td>
              <td>{h.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 24-Hour Bar Column Distribution */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-ash dark:text-zinc-400">
          Time of Day (7 AM – 11 PM Cairo)
        </p>

        <div className="flex items-end gap-1 sm:gap-1.5 h-28 pt-6 pb-2 px-1 border-b border-border">
          {displayHours.map((h) => {
            const heightPct =
              maxHourCount > 0 ? Math.max((h.count / maxHourCount) * 100, 4) : 4;
            const isPeak = h.count === maxHourCount && h.count > 0;
            const isHovered = hoveredHour === h.hour;

            return (
              <div
                key={h.hour}
                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-default"
                onPointerEnter={() => setHoveredHour(h.hour)}
                onPointerLeave={() => setHoveredHour(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-7 z-20 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 pointer-events-none">
                    {h.label}: {h.count} scans
                  </div>
                )}

                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all duration-300 motion-reduce:transition-none",
                    isPeak
                      ? "bg-brand dark:bg-brand-soft"
                      : h.count > 0
                      ? "bg-sky-500/70 hover:bg-sky-500 dark:bg-sky-400/60"
                      : "bg-slate-200/60 dark:bg-zinc-800/60",
                    isHovered ? "brightness-125 scale-y-105" : ""
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels: Key time checkpoints */}
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground px-1">
          <span>8 AM</span>
          <span>12 PM</span>
          <span>4 PM</span>
          <span>8 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* Days of Week (if available) */}
      {daysMap.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="text-[11px] font-semibold text-ash dark:text-zinc-400">
            Day of Week
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {daysMap.map((d) => {
              const isPeakDay = d.count === maxDayCount && d.count > 0;
              return (
                <div
                  key={d.dayIdx}
                  className={cn(
                    "p-2 rounded-xl border text-center transition-all",
                    isPeakDay
                      ? "bg-brand/10 border-brand/40 dark:bg-brand/20 dark:border-brand-soft/40"
                      : "bg-card border-border"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      isPeakDay ? "text-brand dark:text-brand-soft" : "text-muted-foreground"
                    )}
                  >
                    {d.name}
                  </p>
                  <p className="font-mono text-xs font-bold text-foreground mt-0.5">
                    {d.count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
