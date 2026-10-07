"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationBubble, type ValidationBubbleProps } from "./validation-bubble";

const textareaVariants = cva(
  "w-full min-w-0 rounded-[12px] text-sm font-medium text-charcoal dark:text-white placeholder:text-muted-foreground transition-all duration-150 motion-reduce:transition-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-text resize-y",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand-soft/20 shadow-xs",
        filled:
          "bg-slate-100/80 dark:bg-zinc-800/80 border-2 border-slate-300 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20",
        tactile:
          "bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 shadow-[0_2px_0_0_rgb(0_0_0/0.06)] dark:shadow-none focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20 active:translate-y-[1px] motion-reduce:active:translate-none",
      },
      textareaSize: {
        sm: "p-3 text-xs min-h-[70px]",
        md: "p-3.5 text-sm min-h-[90px]",
        lg: "p-4 text-base min-h-[120px]",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "md",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  helperText?: string;
  error?: string;
  validationBubble?: React.ReactNode;
  validationBubblePlacement?: ValidationBubbleProps["placement"];
  validationBubbleVariant?: ValidationBubbleProps["variant"];
  onDismissValidationBubble?: () => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      textareaSize,
      label,
      helperText,
      error,
      validationBubble,
      validationBubblePlacement = "bottom-left",
      validationBubbleVariant = "warning",
      onDismissValidationBubble,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = !!error || !!validationBubble;

    return (
      <div className="w-full min-w-0 space-y-1.5 text-left relative">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-bold text-slate-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${textareaId}-error`
                : helperText
                ? `${textareaId}-helper`
                : undefined
            }
            className={cn(
              textareaVariants({ variant, textareaSize }),
              hasError &&
                "border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive",
              className
            )}
            {...props}
          />
        </div>

        {/* Custom Validation Bubble */}
        {validationBubble && (
          <div className="pt-0.5">
            <ValidationBubble
              message={validationBubble}
              placement={validationBubblePlacement}
              variant={validationBubbleVariant}
              onDismiss={onDismissValidationBubble}
            />
          </div>
        )}

        {/* Helper or Error Message */}
        {error ? (
          <p
            id={`${textareaId}-error`}
            className="text-xs font-bold text-destructive flex items-center gap-1.5 animate-in fade-in-0 duration-150"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-ash dark:text-zinc-400 font-medium"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
