"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useId,
} from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { datePickerPlacement } from "@/lib/date-picker-placement";
import { ValidationBubble } from "./validation-bubble";

export interface DatePickerProps {
  label?: string;
  value?: string; // Format: "YYYY-MM-DD"
  onChange?: (date: string) => void;
  placeholder?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  name?: string;
  error?: string;
  helperText?: string;
  /** Custom validation bubble message */
  validationBubble?: React.ReactNode;
  onDismissValidationBubble?: () => void;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
  align?: "left" | "right" | "center";
  placement?: "bottom" | "top" | "auto";
  id?: string;
  rightElement?: React.ReactNode;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Parses an ISO date string ("YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss...")
 * into a Date object representing the calendar year, month, and day.
 */
export function parseISODate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const cleanStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = cleanStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

/** Formats a Date object to "YYYY-MM-DD" */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Formats an ISO date string for display (e.g. "10 Oct 2026") */
export function formatDisplayDate(dateStr?: string): string {
  const parsed = parseISODate(dateStr);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Returns today's ISO date string ("YYYY-MM-DD") in Africa/Cairo timezone.
 */
export function getCairoTodayString(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return formatISODate(new Date());
  }
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value = "",
  onChange,
  placeholder = "Select date...",
  minDate,
  maxDate,
  disabled = false,
  clearable = true,
  required = false,
  name,
  error,
  helperText,
  validationBubble,
  onDismissValidationBubble,
  className = "",
  buttonClassName = "",
  labelClassName,
  align = "left",
  placement = "bottom",
  id,
  rightElement,
}) => {
  const generatedId = useId();
  const inputId = id || (label ? `datepicker-${label.toLowerCase().replace(/\s+/g, "-")}` : generatedId);
  const panelId = `${inputId}-panel`;

  const containerRef = useRef<HTMLDivElement>(null);
  const yearsListRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // View modes: "days" | "months" | "years"
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  const minParsed = useMemo(() => parseISODate(minDate), [minDate]);
  const maxParsed = useMemo(() => parseISODate(maxDate), [maxDate]);

  const [viewYear, setViewYear] = useState<number>(() => {
    const init = parseISODate(value) || parseISODate(maxDate) || parseISODate(getCairoTodayString()) || new Date();
    return init.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const init = parseISODate(value) || parseISODate(maxDate) || parseISODate(getCairoTodayString()) || new Date();
    return init.getMonth();
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = panel?.offsetParent;
    if (!isOpen || !panel || !(anchor instanceof HTMLElement)) return;
    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const scrollParent = anchor.closest(".overflow-y-auto, [role='dialog']");
      const parentRect = scrollParent?.getBoundingClientRect();
      const bounds = {
        left: Math.max(8, (parentRect?.left ?? 0) + 8),
        right: Math.min(
          document.documentElement.clientWidth - 8,
          (parentRect?.right ?? document.documentElement.clientWidth) - 8,
        ),
        top: Math.max(8, (parentRect?.top ?? 0) + 8),
        bottom: Math.min(
          document.documentElement.clientHeight - 8,
          (parentRect?.bottom ?? document.documentElement.clientHeight) - 8,
        ),
      };
      const position = datePickerPlacement({
        anchor: rect,
        panel: { width: panel.offsetWidth, height: Math.max(panel.offsetHeight, panel.scrollHeight) },
        bounds,
        align,
        placement,
      });
      setPanelStyle({
        left: position.left - rect.left,
        top: position.top - rect.top,
        maxWidth: bounds.right - bounds.left,
        maxHeight: position.maxHeight,
      });
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(anchor);
    observer.observe(panel);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, placement, isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setViewMode("days");
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

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setViewMode("days");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Scroll to active year when years view opens
  useEffect(() => {
    if (viewMode === "years" && yearsListRef.current) {
      const activeYearBtn = yearsListRef.current.querySelector(
        `[data-year="${viewYear}"]`,
      );
      if (activeYearBtn) {
        activeYearBtn.scrollIntoView({ block: "center", behavior: "auto" });
      }
    }
  }, [viewMode, viewYear]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const isDateDisabled = useCallback(
    (d: Date) => {
      if (
        minParsed &&
        d <
          new Date(
            minParsed.getFullYear(),
            minParsed.getMonth(),
            minParsed.getDate(),
          )
      ) {
        return true;
      }
      if (
        maxParsed &&
        d >
          new Date(
            maxParsed.getFullYear(),
            maxParsed.getMonth(),
            maxParsed.getDate(),
          )
      ) {
        return true;
      }
      return false;
    },
    [minParsed, maxParsed],
  );

  const daysInGrid = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    const todayStr = getCairoTodayString();

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      const iso = formatISODate(date);
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: !!value && iso === value,
        isToday: iso === todayStr,
        isDisabled: isDateDisabled(date),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const iso = formatISODate(date);
      days.push({
        date,
        isCurrentMonth: true,
        isSelected: !!value && iso === value,
        isToday: iso === todayStr,
        isDisabled: isDateDisabled(date),
      });
    }

    // Next month padding days to make 42 total cells (6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      const iso = formatISODate(date);
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: !!value && iso === value,
        isToday: iso === todayStr,
        isDisabled: isDateDisabled(date),
      });
    }

    return days;
  }, [viewYear, viewMonth, value, isDateDisabled]);

  const handleSelectDay = (date: Date) => {
    const iso = formatISODate(date);
    onChange?.(iso);
    setIsOpen(false);
    setViewMode("days");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleSelectToday = () => {
    const todayStr = getCairoTodayString();
    const today = parseISODate(todayStr) || new Date();
    if (!isDateDisabled(today)) {
      onChange?.(todayStr);
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setIsOpen(false);
      setViewMode("days");
    }
  };

  const yearRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = minParsed ? minParsed.getFullYear() : 1920;
    const endYear = maxParsed ? maxParsed.getFullYear() : currentYear + 10;
    const years: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      years.push(y);
    }
    return years;
  }, [minParsed, maxParsed]);

  return (
    <div
      className={cn("w-full text-left space-y-1.5 font-sans", className)}
      ref={containerRef}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-xs font-bold text-slate-700 dark:text-zinc-300",
            labelClassName,
          )}
        >
          {label}
        </label>
      )}

      {/* Hidden input for standard HTML form submission if name is provided */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <div className="relative w-full">
        {/* Trigger Button */}
        <button
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          aria-label={label ? `${label}: ${value ? formatDisplayDate(value) : placeholder}` : undefined}
          onClick={() => {
            if (!disabled) {
              if (!isOpen) {
                const cur =
                  parseISODate(value) ||
                  parseISODate(maxDate) ||
                  parseISODate(getCairoTodayString()) ||
                  new Date();
                setViewYear(cur.getFullYear());
                setViewMonth(cur.getMonth());
              }
              setIsOpen(!isOpen);
              setViewMode("days");
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
            buttonClassName,
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 truncate">
            <CalendarIcon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                value
                  ? "text-brand dark:text-brand-soft"
                  : "text-ash dark:text-zinc-400",
              )}
            />
            <span
              className={cn(
                "truncate min-w-0 font-medium",
                value
                  ? "font-bold text-charcoal dark:text-white"
                  : "text-ash dark:text-zinc-500 font-normal",
              )}
            >
              {value ? formatDisplayDate(value) : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {rightElement}
            {clearable && !!value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleClear(e as unknown as React.MouseEvent)
                }
                aria-label="Clear selected date"
                className="min-h-[44px] min-w-[44px] -my-2.5 -mr-1.5 rounded-lg flex items-center justify-center text-ash dark:text-zinc-400 hover:text-charcoal dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-90 motion-reduce:active:scale-100 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            id={panelId}
            ref={panelRef}
            style={panelStyle}
            role="dialog"
            aria-modal="false"
            aria-label={label ? `${label} calendar` : "Calendar"}
            className={cn(
              "absolute z-50 w-[300px] sm:w-[310px] max-w-[calc(100vw-1rem)] overflow-y-auto",
              "rounded-[16px] p-3 sm:p-3.5",
              "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md backdrop-saturate-150",
              "border-2 border-slate-200/90 dark:border-zinc-800/90",
              "shadow-2xl shadow-slate-900/10 dark:shadow-black/60",
              "animate-in fade-in-0 duration-150 motion-reduce:animate-none",
            )}
          >
            {/* Popover Header Navigation */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={viewMode === "years"}
                aria-label="Previous month"
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-ash dark:text-zinc-400 hover:text-charcoal dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-90 motion-reduce:active:scale-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Switch view between Days, Month selection, and Year selection */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode(viewMode === "months" ? "days" : "months")
                  }
                  aria-label={`Month view: ${MONTH_NAMES[viewMonth]}`}
                  className={cn(
                    "px-2 py-1 rounded-[8px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer font-sans",
                    viewMode === "months"
                      ? "bg-brand text-white shadow-xs"
                      : "text-charcoal dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800",
                  )}
                >
                  {MONTH_NAMES[viewMonth]}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewMode(viewMode === "years" ? "days" : "years")
                  }
                  aria-label={`Year view: ${viewYear}`}
                  className={cn(
                    "px-2 py-1 rounded-[8px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer font-sans",
                    viewMode === "years"
                      ? "bg-brand text-white shadow-xs"
                      : "text-charcoal dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800",
                  )}
                >
                  {viewYear}
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={viewMode === "years"}
                aria-label="Next month"
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-ash dark:text-zinc-400 hover:text-charcoal dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-90 motion-reduce:active:scale-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* VIEW: DAYS GRID */}
            {viewMode === "days" && (
              <div className="space-y-1">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center" aria-hidden="true">
                  {WEEKDAY_NAMES.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-black uppercase text-ash dark:text-zinc-500 py-1"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1 text-center" role="grid">
                  {daysInGrid.map((item, idx) => {
                    const dayNum = item.date.getDate();
                    const fullDateStr = item.date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={item.isDisabled}
                        onClick={() => handleSelectDay(item.date)}
                        aria-label={fullDateStr}
                        aria-pressed={item.isSelected}
                        className={cn(
                          "w-8 h-8 mx-auto rounded-[8px] text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative",
                          item.isSelected
                            ? "bg-brand text-white shadow-md shadow-brand/30 scale-105 motion-reduce:scale-100"
                            : item.isToday
                              ? "border-2 border-brand text-brand dark:text-brand-soft hover:bg-brand/10"
                              : item.isCurrentMonth
                                ? "text-charcoal dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                : "text-slate-300 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800/40",
                          item.isDisabled &&
                            "opacity-25 pointer-events-none cursor-not-allowed hover:bg-transparent",
                          !item.isDisabled &&
                            !item.isSelected &&
                            "active:scale-95 motion-reduce:active:scale-100",
                        )}
                      >
                        <span>{dayNum}</span>
                        {item.isToday && !item.isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand dark:bg-brand-soft" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW: MONTHS SELECTION */}
            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {SHORT_MONTHS.map((m, idx) => {
                  const isCurrent = idx === viewMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setViewMode("days");
                      }}
                      className={cn(
                        "py-2.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer",
                        isCurrent
                          ? "bg-brand text-white shadow-md shadow-brand/20"
                          : "text-charcoal dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}

            {/* VIEW: YEARS SELECTION */}
            {viewMode === "years" && (
              <div
                ref={yearsListRef}
                className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto py-1 pr-1"
              >
                {yearRange.map((y) => {
                  const isSelectedYear = y === viewYear;
                  return (
                    <button
                      key={y}
                      data-year={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setViewMode("months");
                      }}
                      className={cn(
                        "py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer",
                        isSelectedYear
                          ? "bg-brand text-white shadow-md shadow-brand/20 font-black"
                          : "text-charcoal dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800",
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Popover Footer Shortcuts */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={handleSelectToday}
                className="inline-flex items-center gap-1 font-bold text-brand dark:text-brand-soft hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Today</span>
              </button>

              {value && clearable && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="font-bold text-ash hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 rounded-[8px] bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 font-bold text-charcoal dark:text-white transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Validation Bubble */}
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
