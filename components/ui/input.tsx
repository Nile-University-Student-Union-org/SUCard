"use client";

import React, { forwardRef, useId, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ValidationBubble, type ValidationBubbleProps } from "./validation-bubble";

const inputVariants = cva(
  "w-full min-w-0 rounded-[12px] text-sm font-medium text-charcoal dark:text-white placeholder:text-ash dark:placeholder:text-zinc-400 transition-[border-color,box-shadow,background-color] duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-text",
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="rounded-xl text-ash dark:text-zinc-400 min-h-[44px] min-w-[44px] h-11 w-11"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
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
