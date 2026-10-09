"use client";

import React from "react";
import { cn } from "cn";

export interface ToggleChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  pressed: boolean;
  onPressedChange?: (pressed: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  size?: "sm" | "md";
}

export const ToggleChip: React.FC<ToggleChipProps> = ({
  pressed,
  onPressedChange,
  icon: Icon,
  children,
  size = "md",
  className,
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      onPressedChange?.(!pressed);
    }
  };

  return (
    <button
      type="button"
      role="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] border-2 font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-140 motion-reduce:transition-none motion-reduce:transform-none select-none cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft focus-visible:ring-offset-2",
        "active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        size === "md"
          ? "min-h-[44px] px-3.5 py-2 text-sm"
          : "min-h-[44px] px-3 py-2 text-xs",
        pressed
          ? "bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border-brand/40 dark:border-brand-soft/40 font-bold shadow-2xs"
          : "bg-white dark:bg-zinc-900 text-charcoal dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:border-brand/40 dark:hover:border-brand-soft/40 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-2xs",
        className,
      )}
      {...props}
    >
      {Icon && (
        <Icon
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-140 motion-reduce:transition-none",
            pressed
              ? "text-brand dark:text-brand-soft scale-110"
              : "text-ash dark:text-zinc-400 scale-100",
          )}
        />
      )}
      <span className="inline-flex items-center gap-1.5 truncate">{children}</span>
      {pressed && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-brand dark:bg-brand-soft shrink-0 animate-in zoom-in-50 duration-140 motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
