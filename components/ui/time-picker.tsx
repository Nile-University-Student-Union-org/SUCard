"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useId,
} from "react";
import { Clock, X, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { datePickerPlacement } from "@/lib/date-picker-placement";
import { ValidationBubble } from "./validation-bubble";

export interface TimePickerProps {
  label?: string;
  ariaLabel?: string;
  value?: string; // Format: "HH:mm" (24h)
  onChange?: (time: string) => void;
  placeholder?: string;
  minTime?: string; // "HH:mm"
  maxTime?: string; // "HH:mm"
  step?: number; // Minute step, e.g. 1, 5, 10, 15, 30 (default: 5)
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  name?: string;
  error?: string;
  helperText?: string;
  validationBubble?: React.ReactNode;
  onDismissValidationBubble?: () => void;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
  align?: "left" | "right" | "center";
  placement?: "bottom" | "top" | "auto";
  id?: string;
}

/**
 * Parses "HH:mm" into hours and minutes numbers.
 */
export function parseTime(timeStr?: string | null): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return { hours, minutes };
}

/**
 * Formats hours and minutes into "HH:mm".
 */
export function formatTime(hours: number, minutes: number): string {
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Formats "HH:mm" for display with 12h/24h readability or clean 24h format.
 */
export function formatDisplayTime(timeStr?: string | null): string {
  const parsed = parseTime(timeStr);
  if (!parsed) return "";
  return formatTime(parsed.hours, parsed.minutes);
}

export function getCurrentTimeCairo(): string {
  const now = new Date();
  const cairoFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = cairoFormatter.format(now);
  return parts;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  ariaLabel,
  value = "",
  onChange,
  placeholder = "--:--",
  minTime,
  maxTime,
  step = 5,
  disabled = false,
  clearable = false,
  required = false,
  name,
  error,
  helperText,
  validationBubble,
  onDismissValidationBubble,
  className = "",
  buttonClassName = "",
  labelClassName = "",
  align = "left",
  placement = "auto",
  id,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const panelId = `${inputId}-panel`;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoursColRef = useRef<HTMLDivElement>(null);
  const minutesColRef = useRef<HTMLDivElement>(null);

  const parsedValue = parseTime(value);
  const [prevPropValue, setPrevPropValue] = useState(value);
  const [selectedHours, setSelectedHours] = useState<number>(parsedValue?.hours ?? 12);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(parsedValue?.minutes ?? 0);

  if (value !== prevPropValue) {
    setPrevPropValue(value);
    if (parsedValue) {
      setSelectedHours(parsedValue.hours);
      setSelectedMinutes(parsedValue.minutes);
    }
  }

  // Position popover relative to trigger button
  const updatePosition = useCallback(() => {
    if (!isOpen || !panelRef.current || !triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();

    const result = datePickerPlacement({
      anchor: {
        left: triggerRect.left,
        right: triggerRect.right,
        top: triggerRect.top,
        bottom: triggerRect.bottom,
      },
      panel: { width: panelRect.width || 240, height: panelRect.height || 280 },
      bounds: {
        left: 8,
        right: window.innerWidth - 8,
        top: 8,
        bottom: window.innerHeight - 8,
      },
      align,
      placement,
    });

    panelRef.current.style.left = `${result.left}px`;
    panelRef.current.style.top = `${result.top}px`;
  }, [isOpen, align, placement]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      const onResizeOrScroll = () => updatePosition();
      window.addEventListener("resize", onResizeOrScroll);
      window.addEventListener("scroll", onResizeOrScroll, true);
      return () => {
        window.removeEventListener("resize", onResizeOrScroll);
        window.removeEventListener("scroll", onResizeOrScroll, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Scroll active hour and minute buttons into view when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const activeHour = hoursColRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
        if (activeHour && hoursColRef.current) {
          hoursColRef.current.scrollTop = activeHour.offsetTop - hoursColRef.current.offsetTop - 40;
        }
        const activeMinute = minutesColRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
        if (activeMinute && minutesColRef.current) {
          minutesColRef.current.scrollTop = activeMinute.offsetTop - minutesColRef.current.offsetTop - 40;
        }
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Escape key close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const commitTime = (h: number, m: number) => {
    const formatted = formatTime(h, m);
    onChange?.(formatted);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHours(h);
    commitTime(h, selectedMinutes);
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinutes(m);
    commitTime(selectedHours, m);
  };

  const handleSetNow = () => {
    const nowTime = getCurrentTimeCairo();
    const parsed = parseTime(nowTime);
    if (parsed) {
      setSelectedHours(parsed.hours);
      // Snap to step
      const snappedMinutes = Math.round(parsed.minutes / step) * step % 60;
      setSelectedMinutes(snappedMinutes);
      commitTime(parsed.hours, snappedMinutes);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  // Generate hours (0..23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate minutes according to step
  const minuteStep = Math.max(1, Math.min(60, step));
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep
  );

  const isTimeDisabled = (h: number, m: number): boolean => {
    const t = formatTime(h, m);
    if (minTime && t < minTime) return true;
    if (maxTime && t > maxTime) return true;
    return false;
  };

  return (
    <div
      className={cn("w-full text-left space-y-1.5 font-sans relative", className)}
      ref={containerRef}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-xs font-bold text-slate-700 dark:text-zinc-300",
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <div className="relative w-full">
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          aria-label={ariaLabel || (label ? `${label}: ${value ? formatDisplayTime(value) : placeholder}` : undefined)}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
            }
          }}
          className={cn(
            "w-full min-h-[44px] px-3.5 py-2.5 rounded-[12px] text-sm font-medium",
            "bg-white dark:bg-zinc-900 border-2",
            error
              ? "border-destructive focus:border-destructive text-destructive"
              : "border-slate-300 dark:border-zinc-700 text-charcoal dark:text-white hover:border-brand/50 dark:hover:border-brand-soft/50",
            "focus:outline-none focus:border-brand dark:focus:border-brand-soft focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand-soft/20",
            "flex items-center justify-between gap-2.5 transition-all duration-150 select-none shadow-xs cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "motion-reduce:transition-none motion-reduce:transform-none",
            buttonClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 truncate">
            <Clock
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                value
                  ? "text-brand dark:text-brand-soft"
                  : "text-ash dark:text-zinc-400"
              )}
            />
            <span
              className={cn(
                "truncate min-w-0 font-medium",
                value
                  ? "font-bold text-charcoal dark:text-white font-mono text-sm tracking-wide"
                  : "text-ash dark:text-zinc-500 font-normal"
              )}
            >
              {value ? formatDisplayTime(value) : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {clearable && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear time"
                className="p-1 rounded-full text-ash hover:text-charcoal dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </button>

        {/* Popover */}
        {isOpen && (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Choose time"
            aria-modal="true"
            className={cn(
              "fixed z-50 w-64 rounded-2xl p-3",
              "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md backdrop-saturate-150",
              "border-2 border-slate-300 dark:border-zinc-700",
              "shadow-2xl shadow-slate-900/20 dark:shadow-black/70",
              "animate-in fade-in-0 zoom-in-95 duration-150"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span className="flex items-center gap-1.5 text-brand dark:text-brand-soft">
                <Clock className="w-3.5 h-3.5" />
                <span>Select Time (24h)</span>
              </span>
              <span className="font-mono text-charcoal dark:text-white text-sm font-black">
                {formatTime(selectedHours, selectedMinutes)}
              </span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold text-muted-foreground pb-1">
              <span>Hour</span>
              <span>Minute</span>
            </div>

            {/* Hours & Minutes List */}
            <div className="grid grid-cols-2 gap-2 h-44">
              {/* Hours Column */}
              <div
                ref={hoursColRef}
                className="overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700"
              >
                {hours.map((h) => {
                  const isSelected = h === selectedHours;
                  const isDisabled = isTimeDisabled(h, selectedMinutes);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isDisabled}
                      data-active={isSelected}
                      onClick={() => handleHourSelect(h)}
                      className={cn(
                        "w-full h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer",
                        isSelected
                          ? "bg-brand text-white shadow-xs"
                          : "text-charcoal dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800",
                        isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              {/* Minutes Column */}
              <div
                ref={minutesColRef}
                className="overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700"
              >
                {minutes.map((m) => {
                  const isSelected = m === selectedMinutes;
                  const isDisabled = isTimeDisabled(selectedHours, m);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isDisabled}
                      data-active={isSelected}
                      onClick={() => handleMinuteSelect(m)}
                      className={cn(
                        "w-full h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer",
                        isSelected
                          ? "bg-brand text-white shadow-xs"
                          : "text-charcoal dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800",
                        isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-200/80 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleSetNow}
                className="px-2.5 py-1 text-xs font-bold text-brand dark:text-brand-soft hover:bg-brand/10 dark:hover:bg-brand/20 rounded-lg transition-colors cursor-pointer"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-xs font-bold bg-brand text-white hover:bg-brand-soft rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Check className="w-3 h-3" />
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {validationBubble && (
        <div className="pt-0.5">
          <ValidationBubble
            message={validationBubble}
            placement="bottom-left"
            variant="warning"
            onDismiss={onDismissValidationBubble}
            dismissible={!!onDismissValidationBubble}
          />
        </div>
      )}

      {error && !validationBubble ? (
        <p className="text-xs font-bold text-destructive flex items-center gap-1 animate-in fade-in-0 duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText && !validationBubble ? (
        <p className="text-xs font-medium text-ash dark:text-zinc-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
