"use client";

import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    box: "w-4 h-4 rounded-[4px]",
    icon: "w-3 h-3 stroke-[3]",
    text: "text-xs",
  },
  md: {
    box: "w-5 h-5 rounded-[6px]",
    icon: "w-3.5 h-3.5 stroke-[3]",
    text: "text-sm",
  },
  lg: {
    box: "w-6 h-6 rounded-[8px]",
    icon: "w-4 h-4 stroke-[3]",
    text: "text-base",
  },
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      indeterminate = false,
      disabled = false,
      label,
      description,
      error,
      size = "md",
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );
    // Uncontrolled use (e.g. react-hook-form `register`) passes no `checked`, so mirror the input here.
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
    const generatedId = id || (label ? `checkbox-${String(label).slice(0, 20).toLowerCase().replace(/\s+/g, "-")}` : undefined);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const isChecked = checked ?? uncontrolledChecked;
    const currentSize = sizeClasses[size];

    return (
      <div className="flex flex-col text-left">
        <label
          htmlFor={generatedId}
          className={cn(
            "group inline-flex items-center gap-3 min-w-[44px] min-h-[44px] cursor-pointer select-none py-1.5",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Native Screen-Reader Accessible Hidden Checkbox */}
            <input
              id={generatedId}
              ref={setRefs}
              type="checkbox"
              checked={checked}
              defaultChecked={defaultChecked}
              disabled={disabled}
              className="peer sr-only"
              {...props}
              onChange={(e) => {
                setUncontrolledChecked(e.target.checked);
                onCheckedChange?.(e.target.checked);
                onChange?.(e);
              }}
            />

            {/* Custom Visual Checkbox Box */}
            <div
              className={cn(
                "flex items-center justify-center border-2 transition-all duration-150 active:scale-90 group-hover:border-brand/70",
                currentSize.box,
                isChecked || indeterminate
                  ? "bg-brand border-brand dark:bg-brand dark:border-brand text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-brand dark:peer-focus-visible:ring-brand-soft peer-focus-visible:border-brand",
                error && "border-destructive text-destructive",
                disabled && "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-800"
              )}
            >
              {indeterminate ? (
                <Minus className={cn(currentSize.icon, "animate-in zoom-in-75 duration-100")} />
              ) : isChecked ? (
                <Check className={cn(currentSize.icon, "animate-in zoom-in-75 duration-100")} />
              ) : null}
            </div>
          </div>

          {(label || description) && (
            <div className="min-w-0 flex flex-col [overflow-wrap:anywhere]">
              {label && (
                <span
                  className={cn(
                    "font-bold text-charcoal dark:text-zinc-200 leading-tight",
                    currentSize.text
                  )}
                >
                  {label}
                </span>
              )}
              {description && (
                <span className="text-xs text-ash dark:text-zinc-400 font-medium mt-0.5">
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {error && (
          <span className="text-xs font-bold text-destructive mt-1 animate-in fade-in-0 duration-150">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
