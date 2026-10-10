"use client";

import React, { useEffect } from "react";
import { RotateCcw, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface StickySaveBarProps {
  isDirty: boolean;
  changeCount?: number;
  label?: string;
  onDiscard: () => void;
  onReview: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  discardText?: string;
  reviewText?: string;
  warnOnLeave?: boolean;
  className?: string;
}

export function StickySaveBar({
  isDirty,
  changeCount = 1,
  label,
  onDiscard,
  onReview,
  isSaving = false,
  disabled = false,
  discardText = "Discard",
  reviewText = "Review & save",
  warnOnLeave = true,
  className,
}: StickySaveBarProps) {
  // Warn user before navigating away with unsaved changes
  useEffect(() => {
    if (!isDirty || !warnOnLeave) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, warnOnLeave]);

  const displayCount = Math.max(1, changeCount);
  const displayLabel =
    label ??
    `${displayCount} unsaved change${displayCount === 1 ? "" : "s"}`;

  return (
    <div
      aria-hidden={!isDirty}
      role="region"
      aria-label="Unsaved changes bar"
      className={cn(
        "sticky bottom-3 sm:bottom-4 z-30 w-full transition-all duration-200 ease-out",
        "motion-reduce:translate-y-0 motion-reduce:transition-opacity",
        isDirty
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-6 pointer-events-none select-none",
        className
      )}
    >
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-2 border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl text-foreground flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-safe sm:pb-4">
        {/* Unsaved status badge / text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="size-4 shrink-0" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-foreground truncate">
              {displayLabel}
            </p>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Review your updates before applying them live.
            </p>
          </div>
        </div>

        {/* Actions: Discard & Review */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="surface"
            size="sm"
            onClick={onDiscard}
            disabled={disabled || isSaving || !isDirty}
            className="w-full sm:w-auto font-semibold text-xs normal-case min-h-[44px] px-3.5 justify-center"
          >
            <RotateCcw className="size-3.5 mr-1.5 shrink-0 text-muted-foreground" />
            <span>{discardText}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onReview}
            disabled={disabled || isSaving || !isDirty}
            loading={isSaving}
            loadingText="Saving…"
            className="w-full sm:w-auto font-bold text-xs normal-case min-h-[44px] px-4 justify-center"
          >
            <span>{reviewText}</span>
            <ArrowRight className="size-3.5 ml-1.5 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}
