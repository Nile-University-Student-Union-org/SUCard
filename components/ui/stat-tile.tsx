"use client";

import React from "react";
import { cn } from "cn";

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  subText?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "brand" | "blue" | "orange" | "green" | "emerald" | "amber" | "rose" | "violet" | "neutral";
  badge?: React.ReactNode;
  variant?: "default" | "hero" | "compact";
  className?: string;
  children?: React.ReactNode;
}

const accentIconStyles = {
  brand: "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-soft border-brand/20",
  blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
  orange: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20",
  green: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20",
  violet: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20",
  neutral: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
};

const accentBorderTop = {
  brand: "border-t-brand dark:border-t-brand-soft",
  blue: "border-t-blue-500 dark:border-t-blue-400",
  orange: "border-t-orange-500 dark:border-t-orange-400",
  green: "border-t-emerald-500 dark:border-t-emerald-400",
  emerald: "border-t-emerald-500 dark:border-t-emerald-400",
  amber: "border-t-amber-500 dark:border-t-amber-400",
  rose: "border-t-rose-500 dark:border-t-rose-400",
  violet: "border-t-purple-500 dark:border-t-purple-400",
  neutral: "border-t-slate-300 dark:border-t-zinc-700",
};

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subText,
  icon,
  accent = "brand",
  badge,
  variant = "default",
  className,
  children,
}) => {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-[16px] border-2 border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs transition-all duration-200",
        isHero ? "p-4 sm:p-5 border-t-4" : isCompact ? "p-3 sm:p-3.5" : "p-4 sm:p-5",
        isHero && accentBorderTop[accent],
        className
      )}
    >
      {/* Top row: Label + Icon */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-bold text-ash dark:text-zinc-400 leading-snug break-words",
              isCompact ? "text-xs" : "text-xs uppercase tracking-wider"
            )}
          >
            {label}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl border p-2 shrink-0 transition-transform",
              accentIconStyles[accent],
              isCompact ? "h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5" : "h-9 w-9 sm:h-10 sm:w-10 [&>svg]:h-4.5 sm:[&>svg]:h-5 [&>svg]:w-4.5 sm:[&>svg]:w-5"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main value display */}
      <div className={cn("min-w-0 flex-1", isCompact ? "mt-1.5" : "mt-2.5")}>
        <div
          className={cn(
            "font-extrabold tracking-tight text-charcoal dark:text-white whitespace-nowrap overflow-hidden text-ellipsis",
            isHero
              ? "text-xl sm:text-2xl 2xl:text-3xl font-heading uppercase"
              : isCompact
              ? "text-base sm:text-lg font-bold"
              : "text-lg sm:text-xl font-bold"
          )}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>

        {/* Badge on its own dedicated row under the value */}
        {badge && (
          <div className="mt-1.5 flex items-center">
            {badge}
          </div>
        )}

        {subText && (
          <p className="mt-1.5 text-xs text-ash dark:text-zinc-400 leading-relaxed font-medium break-words">
            {subText}
          </p>
        )}
      </div>

      {children && <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">{children}</div>}
    </div>
  );
};
