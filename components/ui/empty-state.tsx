"use client";

import React from "react";
import { cn } from "cn";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
  bordered?: boolean;
}

export function EmptyState({
  icon,
  title,
  hint,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
  bordered = true,
}: EmptyStateProps) {
  const displayHint = hint ?? description;

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "w-full flex flex-col items-center justify-center text-center select-none",
        bordered
          ? "p-6 sm:p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50"
          : "p-4 sm:p-6",
        compact ? "min-h-[180px] space-y-3" : "min-h-[260px] sm:min-h-[320px] space-y-4",
        className
      )}
    >
      {/* Branded Icon Container */}
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl border transition-transform",
          "bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border-brand/20 dark:border-brand-soft/30 shadow-xs",
          compact ? "size-10 [&>svg]:size-5" : "size-13 sm:size-14 [&>svg]:size-6 sm:[&>svg]:size-7"
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title & One-line Hint */}
      <div className={cn("space-y-1 max-w-md mx-auto", compact && "space-y-0.5")}>
        <h3
          className={cn(
            "font-sans font-semibold text-charcoal dark:text-white leading-tight tracking-normal",
            compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
          )}
        >
          {title}
        </h3>
        {displayHint && (
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto">
            {displayHint}
          </p>
        )}
      </div>

      {/* Actions Slot */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1 w-full max-w-xs sm:max-w-md">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
