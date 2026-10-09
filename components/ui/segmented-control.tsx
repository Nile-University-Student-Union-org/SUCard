"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "cn";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

export interface SegmentedControlOption<Value extends string = string> {
  value: Value;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<Value extends string = string> {
  options: SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  ariaLabel: string;
  size?: "md" | "sm";
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<Id extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fullWidth,
  size = "md",
  className,
}: SegmentedControlProps<Id>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicator = useSlidingIndicator({
    containerRef: groupRef,
    selectedSelector: '[aria-checked="true"]',
    value,
    items: options,
    size,
    fullWidth,
  });
  const enabledOptions = options.filter((option) => !option.disabled);
  const focusableValue =
    enabledOptions.find((option) => option.value === value)?.value ??
    enabledOptions[0]?.value;

  useEffect(() => {
    const selectedOption = groupRef.current?.querySelector<HTMLElement>(
      '[aria-checked="true"]',
    );
    selectedOption?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [value, groupRef]);

  function navigateOptions(event: KeyboardEvent<HTMLButtonElement>, id: Id) {
    if (!enabledOptions.length) return;
    const rtl =
      (event.currentTarget.closest("[dir]")?.getAttribute("dir") ??
        document.dir) === "rtl";
    const currentIndex = enabledOptions.findIndex(
      (option) => option.value === id,
    );
    let nextIndex: number;
    switch (event.key) {
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = enabledOptions.length - 1;
        break;
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % enabledOptions.length;
        break;
      case "ArrowUp":
        nextIndex =
          (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
        break;
      case "ArrowRight":
        nextIndex =
          (currentIndex + (rtl ? -1 : 1) + enabledOptions.length) %
          enabledOptions.length;
        break;
      case "ArrowLeft":
        nextIndex =
          (currentIndex + (rtl ? 1 : -1) + enabledOptions.length) %
          enabledOptions.length;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextOption = enabledOptions[nextIndex];
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [
        options.findIndex((option) => option.value === nextOption.value)
      ]?.focus({ preventScroll: true });
    onChange(nextOption.value);
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex max-w-full min-w-0 gap-1 overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900",
        fullWidth && "w-full",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 rounded-xl bg-brand shadow-xs motion-reduce:transition-none",
          indicator?.animate &&
            "transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          options.find((option) => option.value === value)?.disabled &&
            "opacity-50",
        )}
        style={
          indicator
            ? {
                transform: `translateX(${indicator.left}px)`,
                top: indicator.top,
                width: indicator.width,
                height: indicator.height,
              }
            : { display: "none" }
        }
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={option.value === focusableValue ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => navigateOptions(event, option.value)}
            className={cn(
              "relative z-[1] inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[transform,color] duration-140 motion-reduce:transition-none motion-reduce:transform-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:focus-visible:ring-brand-soft disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm" ? "px-3 text-xs" : "px-3.5 text-sm",
              fullWidth && "grow",
              selected
                ? "text-white dark:text-midnight font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
              selected && !indicator && "bg-brand shadow-xs",
            )}
          >
            {option.icon && (
              <span
                aria-hidden="true"
                className="shrink-0 text-current [&>svg]:h-4 [&>svg]:w-4"
              >
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
