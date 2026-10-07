"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 font-bold select-none transition-all duration-150",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-white shadow-xs",
        brand:
          "bg-brand text-white shadow-xs",
        secondary:
          "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700",
        accent:
          "bg-macaw-blue text-white shadow-xs",
        outline:
          "border-2 border-brand/30 text-brand dark:text-brand-soft bg-brand/5 dark:bg-brand/15",
        success:
          "bg-emerald-700 text-white dark:bg-emerald-700 shadow-xs",
        warning:
          "bg-amber-500 text-midnight dark:bg-amber-500 shadow-xs",
        destructive:
          "bg-rose-700 text-white dark:bg-rose-700 shadow-xs",
        ghost:
          "bg-slate-100 dark:bg-zinc-800 text-charcoal dark:text-zinc-300 border border-slate-200 dark:border-zinc-700",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px] tracking-wider uppercase",
        md: "px-2.5 py-1 text-xs tracking-wider uppercase",
        lg: "px-3.5 py-1.5 text-sm tracking-wide uppercase",
      },
      shape: {
        rounded: "rounded-[8px]",
        pill: "rounded-full",
      },
      interactive: {
        true: "min-h-[44px] min-w-[44px] cursor-pointer hover:scale-105 active:scale-95",
        false: "",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "md",
      shape: "rounded",
      interactive: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  shape,
  interactive,
  icon,
  pulse = false,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size, shape, interactive }), className)}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </span>
  );
};
