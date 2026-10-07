"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "min-w-0 max-w-full rounded-[16px] text-foreground transition-all duration-200 motion-reduce:transition-none motion-reduce:transform-none",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-zinc-900 border-2 border-slate-200/90 dark:border-zinc-800 shadow-sm",
        flat:
          "bg-slate-50/60 dark:bg-zinc-800/40 border-2 border-slate-200 dark:border-zinc-800",
        interactive:
          "bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-brand/50 dark:hover:border-brand-soft/50 active:translate-y-0 active:scale-[0.99] cursor-pointer select-none motion-reduce:hover:translate-none motion-reduce:active:scale-100",
        elevated:
          "bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-md",
        muted:
          "bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-5 sm:p-6",
        lg: "p-6 sm:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-5 sm:p-6 flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg sm:text-xl text-charcoal dark:text-white uppercase tracking-wider leading-tight [overflow-wrap:anywhere]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed [overflow-wrap:anywhere]",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 sm:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-5 sm:p-6 pt-0 flex flex-wrap items-center justify-between gap-3",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
