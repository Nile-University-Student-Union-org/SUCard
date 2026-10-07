"use client";

import React, { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "cn";

const alertVariants = cva(
  "relative w-full rounded-[14px] border-2 p-4 text-left transition-all duration-200 select-text backdrop-blur-sm shadow-xs",
  {
    variants: {
      variant: {
        default:
          "bg-sky-50/90 dark:bg-sky-950/40 border-sky-200/90 dark:border-sky-900/60 text-sky-950 dark:text-sky-200",
        info:
          "bg-sky-50/90 dark:bg-sky-950/40 border-sky-200/90 dark:border-sky-900/60 text-sky-950 dark:text-sky-200",
        success:
          "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/90 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200",
        warning:
          "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/90 dark:border-amber-900/60 text-amber-950 dark:text-amber-200",
        destructive:
          "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/90 dark:border-rose-900/60 text-rose-950 dark:text-rose-200",
        error:
          "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/90 dark:border-rose-900/60 text-rose-950 dark:text-rose-200",
        brand:
          "bg-brand/5 dark:bg-brand/15 border-brand/25 dark:border-brand-soft/30 text-charcoal dark:text-white",
      },
      size: {
        sm: "p-3 text-xs",
        md: "p-4 text-sm",
        lg: "p-5 text-base",
      },
    },
    defaultVariants: {
      variant: "info",
      size: "md",
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
  error: AlertCircle,
  brand: ShieldCheck,
};

const iconColorMap = {
  default: "text-sky-600 dark:text-sky-400",
  info: "text-sky-600 dark:text-sky-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-rose-600 dark:text-rose-400",
  error: "text-rose-600 dark:text-rose-400",
  brand: "text-brand dark:text-brand-soft",
};

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = "info",
  size,
  title,
  description,
  icon,
  dismissible = false,
  onDismiss,
  action,
  children,
  ...props
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const currentVariant = variant || "info";
  const DefaultIcon = iconMap[currentVariant] || Info;
  const iconColor = iconColorMap[currentVariant];

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        alertVariants({ variant, size }),
        "animate-in fade-in-0 duration-200",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Leading Icon */}
        <div className={cn("shrink-0 mt-0.5", iconColor)}>
          {icon !== undefined ? icon : <DefaultIcon className="w-5 h-5" />}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0 space-y-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
          {children}
          {action && <div className="pt-2">{action}</div>}
        </div>

        {/* Close / Dismiss Button */}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className="shrink-0 -mr-1 -mt-1 w-7 h-7 rounded-[8px] flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer select-none"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h5
    className={cn("text-sm font-bold tracking-tight leading-snug", className)}
    {...props}
  >
    {children}
  </h5>
);

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn("text-xs font-medium leading-relaxed opacity-90", className)}
    {...props}
  >
    {children}
  </div>
);

export const AlertAction: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("inline-flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);
