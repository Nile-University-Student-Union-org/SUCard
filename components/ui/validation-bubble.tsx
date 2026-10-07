"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const validationBubbleVariants = cva(
  "relative z-30 inline-flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-semibold shadow-xl border backdrop-blur-md select-none transition-all duration-200 animate-in fade-in-0 zoom-in-95",
  {
    variants: {
      variant: {
        warning:
          "bg-slate-900/95 dark:bg-zinc-800/95 text-white border-amber-500/40 shadow-amber-500/10 dark:shadow-black/40",
        error:
          "bg-slate-900/95 dark:bg-zinc-800/95 text-white border-rose-500/40 shadow-rose-500/10 dark:shadow-black/40",
        info:
          "bg-slate-900/95 dark:bg-zinc-800/95 text-white border-sky-500/40 shadow-sky-500/10 dark:shadow-black/40",
        success:
          "bg-slate-900/95 dark:bg-zinc-800/95 text-white border-emerald-500/40 shadow-emerald-500/10 dark:shadow-black/40",
      },
      placement: {
        "bottom-left": "mt-1.5",
        "bottom-center": "mt-1.5",
        "bottom-right": "mt-1.5",
        "top-left": "mb-1.5",
        "top-center": "mb-1.5",
        "top-right": "mb-1.5",
      },
    },
    defaultVariants: {
      variant: "warning",
      placement: "bottom-left",
    },
  }
);

export interface ValidationBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof validationBubbleVariants> {
  message?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export const ValidationBubble: React.FC<ValidationBubbleProps> = ({
  message,
  children,
  className,
  variant = "warning",
  placement = "bottom-left",
  icon,
  onDismiss,
  dismissible = false,
  ...props
}) => {
  const content = message || children;
  if (!content) return null;

  const renderBeak = () => {
    switch (placement) {
      case "bottom-left":
        return (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-900 dark:bg-zinc-800 rotate-45 border-t border-l border-amber-500/40 dark:border-amber-500/40 rounded-tl-[2px]"
          />
        );
      case "bottom-center":
        return (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-zinc-800 rotate-45 border-t border-l border-amber-500/40 dark:border-amber-500/40 rounded-tl-[2px]"
          />
        );
      case "bottom-right":
        return (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-900 dark:bg-zinc-800 rotate-45 border-t border-l border-amber-500/40 dark:border-amber-500/40 rounded-tl-[2px]"
          />
        );
      case "top-left":
        return (
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-4 w-3 h-3 bg-slate-900 dark:bg-zinc-800 rotate-45 border-b border-r border-amber-500/40 dark:border-amber-500/40 rounded-br-[2px]"
          />
        );
      case "top-center":
        return (
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-zinc-800 rotate-45 border-b border-r border-amber-500/40 dark:border-amber-500/40 rounded-br-[2px]"
          />
        );
      case "top-right":
        return (
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 right-4 w-3 h-3 bg-slate-900 dark:bg-zinc-800 rotate-45 border-b border-r border-amber-500/40 dark:border-amber-500/40 rounded-br-[2px]"
          />
        );
      default:
        return null;
    }
  };

  const renderIcon = () => {
    if (icon !== undefined) return icon;

    switch (variant) {
      case "warning":
        return (
          <div className="w-5 h-5 rounded-[6px] bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm font-black text-xs">
            !
          </div>
        );
      case "error":
        return (
          <div className="w-5 h-5 rounded-[6px] bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm font-black text-xs">
            !
          </div>
        );
      case "info":
        return (
          <div className="w-5 h-5 rounded-[6px] bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-sm font-black text-xs">
            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case "success":
        return (
          <div className="w-5 h-5 rounded-[6px] bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm font-black text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(validationBubbleVariants({ variant, placement }), className)}
      {...props}
    >
      {renderBeak()}
      {renderIcon()}
      <span className="text-xs font-semibold leading-tight text-slate-100 dark:text-zinc-100">
        {content}
      </span>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss validation message"
          className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
