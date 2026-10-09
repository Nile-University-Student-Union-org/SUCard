"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";

export interface PinInputProps {
  length?: number;
  value: string;
  onChange: (pin: string) => void;
  onComplete?: (pin: string) => void;
  isError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  maskByDefault?: boolean;
  allowToggleMask?: boolean;
  ariaLabelPrefix?: string;
  className?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  isError = false,
  disabled = false,
  autoFocus = true,
  maskByDefault = false,
  allowToggleMask = false,
  ariaLabelPrefix = "Digit",
  className,
}) => {
  const [isMasked, setIsMasked] = useState(maskByDefault);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of characters
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // Auto-focus first empty input (or first input) on mount if requested
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [autoFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigitChange = (index: number, val: string) => {
    // Extract only digits
    const cleanVal = val.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      const newPin = newDigits.join("");
      onChange(newPin);
      return;
    }

    // Take the last digit typed if multiple
    const lastDigit = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = lastDigit;
    const newPin = newDigits.join("");
    onChange(newPin);

    // Auto-advance to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger complete callback if full
    if (newPin.length === length && !newDigits.includes("") && onComplete) {
      onComplete(newPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3 w-full", className)}>
      <div
        key={isError ? "pin-error" : "pin-idle"}
        className={cn(
          "flex items-center justify-center w-full",
          length > 4 ? "gap-1.5 sm:gap-2.5" : "gap-2.5 sm:gap-3.5",
          isError && "animate-shake motion-reduce:animate-none"
        )}
        onPaste={handlePaste}
      >
        {digits.map((digit, idx) => {
          const isFocused = focusedIndex === idx;
          const isFilled = Boolean(digit);

          return (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type={isMasked ? "password" : "text"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete={idx === 0 ? "one-time-code" : "off"}
              value={digit}
              onFocus={() => setFocusedIndex(idx)}
              onBlur={() => setFocusedIndex(null)}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={disabled}
              className={cn(
                length > 4
                  ? "w-11 sm:w-13 h-13 sm:h-16 text-center text-xl sm:text-2xl font-heading uppercase rounded-xl"
                  : "w-12 sm:w-16 h-14 sm:h-20 text-center text-2xl sm:text-3xl font-heading uppercase rounded-2xl",
                "border-2 outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 select-none cursor-text shadow-xs font-mono motion-reduce:transition-none motion-reduce:transform-none",
                "bg-white dark:bg-zinc-900 text-charcoal dark:text-white",
                // Empty & Unfocused
                !isFilled && !isFocused && "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700",
                // Filled & Unfocused
                isFilled && !isFocused && "border-brand dark:border-brand-soft bg-brand/5 dark:bg-brand/10 text-brand dark:text-brand-soft",
                // Focused
                isFocused && "border-brand dark:border-brand-soft bg-white dark:bg-zinc-900 ring-4 ring-ring/25 -translate-y-0.5 motion-reduce:translate-none shadow-md",
                // Error state
                isError && "border-destructive text-destructive bg-rose-50/50 dark:bg-rose-950/20",
                disabled && "opacity-50 pointer-events-none"
              )}
              aria-label={`${ariaLabelPrefix} ${idx + 1}`}
            />
          );
        })}
      </div>

      {allowToggleMask && (
        <button
          type="button"
          onClick={() => setIsMasked(!isMasked)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-zinc-300 hover:text-brand dark:hover:text-brand-soft transition-colors min-h-[44px] px-2 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
          aria-label={isMasked ? "Show code digits" : "Hide code digits"}
        >
          {isMasked ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          <span>{isMasked ? "Show digits" : "Hide digits"}</span>
        </button>
      )}
    </div>
  );
};
