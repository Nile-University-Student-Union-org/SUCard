"use client";

import React, { forwardRef, useId, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ValidationBubble, type ValidationBubbleProps } from "./validation-bubble";

const inputVariants = cva(
  "w-full min-w-0 rounded-[12px] text-sm font-medium text-charcoal dark:text-white placeholder:text-ash dark:placeholder:text-zinc-400 transition-[border-color,box-shadow,background-color,ring-color] duration-140 ease-out motion-reduce:transition-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-text",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand-soft/20 shadow-xs",
        filled:
          "bg-slate-100/80 dark:bg-zinc-800/80 border-2 border-slate-300 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20",
        tactile:
          "bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 shadow-[0_2px_0_0_rgb(0_0_0/0.06)] dark:shadow-none focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20 active:translate-y-[1px]",
      },
      inputSize: {
        sm: "min-h-[44px] px-3.5 py-2 text-xs",
        md: "min-h-[44px] px-4 py-2.5 text-sm",
        lg: "min-h-[50px] px-5 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  error?: string;
  validationBubble?: React.ReactNode;
  validationBubblePlacement?: ValidationBubbleProps["placement"];
  validationBubbleVariant?: ValidationBubbleProps["variant"];
  onDismissValidationBubble?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      variant,
      inputSize,
      label,
      helperText,
      error,
      validationBubble,
      validationBubblePlacement = "bottom-left",
      validationBubbleVariant = "warning",
      onDismissValidationBubble,
      leftIcon,
      rightIcon,
      rightElement,
      clearable = false,
      onClear,
      showPasswordToggle = false,
      disabled,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const [hasToggled, setHasToggled] = useState(false);

    const isPasswordType = type === "password" && showPasswordToggle;
    const computedType = isPasswordType ? (showPassword ? "text" : "password") : type;

    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const hasError = !!error || !!validationBubble;
    const rightActionCount =
      Number(clearable && hasValue && !disabled) +
      Number(isPasswordType && !disabled) +
      Number(!!rightElement) +
      Number(!!error || !!rightIcon);

    return (
      <div className="w-full min-w-0 space-y-1.5 text-left relative">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-ash dark:text-zinc-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={computedType}
            disabled={disabled}
            value={value}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              inputVariants({ variant, inputSize }),
              leftIcon && "pl-11",
              rightElement ? "pr-24" : rightActionCount === 1 ? "pr-14" : rightActionCount > 1 ? "pr-28" : undefined,
              hasError &&
                "border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive",
              // Alternate animation names so each toggle restarts the reveal.
              isPasswordType && hasToggled && (showPassword ? "motion-safe:animate-[pw-reveal-a_260ms_cubic-bezier(0.16,1,0.3,1)]" : "motion-safe:animate-[pw-reveal-b_260ms_cubic-bezier(0.16,1,0.3,1)]"),
              className
            )}
            {...props}
          />

          {/* Right Action Icons */}
          <div className="absolute right-1 flex items-center gap-1 text-ash dark:text-zinc-400">
            {clearable && hasValue && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClear}
                aria-label="Clear input"
                className="rounded-xl text-ash dark:text-zinc-400 min-h-[44px] min-w-[44px] h-11 w-11"
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {isPasswordType && !disabled && (
              <button
                type="button"
                // Keep focus and caret in the field while toggling.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { setShowPassword(!showPassword); setHasToggled(true); }}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="group/eye grid place-items-center size-11 rounded-full text-ash dark:text-zinc-400 outline-none transition-[color,transform] duration-200 ease-out hover:text-foreground active:scale-90 focus-visible:text-foreground"
              >
                <span className="grid place-items-center size-8 rounded-full transition-colors duration-200 group-hover/eye:bg-slate-100 dark:group-hover/eye:bg-zinc-800 group-focus-visible/eye:ring-2 group-focus-visible/eye:ring-ring/40">
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle
                      cx="12" cy="12" r="3"
                      className={cn("origin-center [transform-box:fill-box] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none", showPassword ? "scale-100" : "scale-50")}
                    />
                    {/* Slash draws in when the password is hidden. */}
                    <path
                      d="m3 3 18 18"
                      pathLength={1}
                      strokeDasharray="1"
                      className={cn("transition-[stroke-dashoffset] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none", showPassword ? "[stroke-dashoffset:1]" : "[stroke-dashoffset:0]")}
                    />
                  </svg>
                </span>
              </button>
            )}

            {rightElement}
            {error && !validationBubble ? (
              <AlertCircle className="w-4 h-4 text-destructive mr-2" />
            ) : (
              rightIcon
            )}
          </div>
        </div>

        {/* Custom Validation Bubble */}
        {validationBubble && (
          <div className="pt-0.5">
            <ValidationBubble
              message={validationBubble}
              placement={validationBubblePlacement}
              variant={validationBubbleVariant}
              onDismiss={onDismissValidationBubble}
              dismissible={!!onDismissValidationBubble}
            />
          </div>
        )}

        {/* Standard Inline Error Message */}
        {error && !validationBubble ? (
          <p
            id={`${inputId}-error`}
            className="text-xs font-bold text-destructive flex items-center gap-1 animate-in fade-in-0 duration-150"
          >
            <span>{error}</span>
          </p>
        ) : helperText && !validationBubble ? (
          <p
            id={`${inputId}-helper`}
            className="text-xs font-medium text-ash dark:text-zinc-400"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
