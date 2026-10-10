"use client";

import React from "react";
import { cn } from "cn";

import { Loader2 } from "lucide-react";

export interface StatusStateProps {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "brand" | "warning" | "destructive" | "success" | "loading";
  layout?: "default" | "panel";
  className?: string;
  isLoading?: boolean;
}

const variantIconStyles = {
  default: "bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-slate-200 dark:border-zinc-700",
  brand: "bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border-brand/20 dark:border-brand-soft/30",
  warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  destructive: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
  success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  loading: "bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border-brand/20 dark:border-brand-soft/30",
};

const variantEyebrowStyles = {
  default: "text-muted-foreground",
  brand: "text-brand dark:text-brand-soft",
  warning: "text-amber-700 dark:text-amber-400",
  destructive: "text-rose-700 dark:text-rose-400",
  success: "text-emerald-700 dark:text-emerald-400",
  loading: "text-brand dark:text-brand-soft",
};

export const StatusState: React.FC<StatusStateProps> = ({
  icon,
  eyebrow,
  title,
  description,
  actions,
  children,
  variant = "default",
  layout = "default",
  className,
  isLoading = false,
}) => {
  const isBusy = isLoading || variant === "loading";
  const defaultIcon = isBusy ? (
    <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-brand dark:text-brand-soft" />
  ) : null;
  const content = (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      aria-live="polite"
      aria-busy={isBusy}
      className={cn(
        "w-full min-w-0 max-w-md [overflow-wrap:anywhere] text-center space-y-6 mx-auto",
        layout === "default" && className
      )}
    >
      {/* Icon Slot */}
      {(icon || defaultIcon) && (
        <div
          className={cn(
            "inline-flex items-center justify-center w-14 h-14 rounded-2xl border shadow-xs transition-transform",
            variantIconStyles[variant]
          )}
        >
          {icon || defaultIcon}
        </div>
      )}

      {/* Headline & Description */}
      <div className="space-y-2">
        {eyebrow && (
          <p
            className={cn(
              "text-xs font-semibold normal-case tracking-normal",
              variantEyebrowStyles[variant]
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="font-sans font-semibold text-xl sm:text-2xl text-charcoal dark:text-white tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Body Content & Action Buttons */}
      {actions ? (
        <>
          {children && <div className="w-full">{children}</div>}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 pt-2">
            {actions}
          </div>
        </>
      ) : (
        children && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 pt-2">
            {children}
          </div>
        )
      )}
    </div>
  );

  if (layout === "panel") {
    return (
      <div
        className={cn(
          "w-full flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-3xl border-2 border-dashed border-border bg-card shadow-2xs min-h-[300px] sm:min-h-[380px]",
          className
        )}
      >
        {content}
      </div>
    );
  }

  return content;
};
