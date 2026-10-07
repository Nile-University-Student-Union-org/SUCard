"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
}: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelId = ariaLabelledby ?? `${inputId}-label`;
  const descriptionId = ariaDescribedby ?? `${inputId}-description`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-[44px] cursor-pointer items-center justify-between gap-4 select-none",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span className="min-w-0 flex flex-col gap-0.5 [overflow-wrap:anywhere]">
        {label && (
          <span id={labelId} className="text-sm font-bold text-foreground">
            {label}
          </span>
        )}
        {description && (
          <span id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby ?? (label ? labelId : undefined)}
        aria-describedby={ariaDescribedby ?? (description ? descriptionId : undefined)}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border-2 border-slate-300 dark:border-zinc-700 bg-muted transition-colors motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-brand dark:peer-focus-visible:ring-brand-soft peer-focus-visible:ring-offset-2",
          checked && "bg-brand border-brand"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
            checked && "translate-x-5"
          )}
        />
      </span>
    </label>
  );
}
