"use client";

import React, { useMemo } from "react";
import { Check, X as XIcon, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "cn";

export interface PasswordRules {
  length: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  matches?: boolean;
}

export interface PasswordStrengthMeterProps {
  password?: string;
  confirmPassword?: string;
  className?: string;
  showMatch?: boolean;
  /** Whether to always display the criteria grid even when empty (prevents CLS) */
  alwaysVisible?: boolean;
}

export function evaluatePasswordRules(password: string = "", confirmPassword?: string): PasswordRules {
  return {
    length: password.length >= 10 && password.length <= 128,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    matches: confirmPassword !== undefined && confirmPassword.length > 0 ? password === confirmPassword : undefined,
  };
}

interface RequirementItemProps {
  satisfied: boolean;
  label: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ satisfied, label }) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200">
      <div
        className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
          satisfied
            ? "bg-emerald-500 text-white shadow-xs scale-100 ring-2 ring-emerald-500/20"
            : "border border-slate-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50"
        )}
      >
        {satisfied ? (
          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3.5]" />
        ) : (
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
        )}
      </div>
      <span
        className={cn(
          "text-[11px] sm:text-xs font-semibold tracking-tight transition-colors duration-200 select-none truncate",
          satisfied
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-ash/90 dark:text-zinc-400"
        )}
      >
        {label}
      </span>
    </div>
  );
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = "",
  confirmPassword,
  className,
  showMatch = true,
  alwaysVisible = true,
}) => {
  const rules = useMemo(
    () => evaluatePasswordRules(password, confirmPassword),
    [password, confirmPassword]
  );

  // Compute strength score (0 to 4)
  const score = useMemo(() => {
    let count = 0;
    if (rules.length) count++;
    if (rules.hasLower) count++;
    if (rules.hasUpper) count++;
    if (rules.hasDigit) count++;
    return count;
  }, [rules]);

  // Determine strength label & color tokens
  const { label, barColor, badgeBg } = useMemo(() => {
    if (password.length === 0) {
      return {
        label: "Enter password",
        barColor: "bg-slate-200 dark:bg-zinc-800",
        badgeBg: "bg-slate-100 dark:bg-zinc-800 text-ash dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
      };
    }
    if (score <= 1) {
      return {
        label: "Weak",
        barColor: "bg-rose-500 shadow-rose-500/20",
        badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
      };
    }
    if (score === 2) {
      return {
        label: "Fair",
        barColor: "bg-amber-500 shadow-amber-500/20",
        badgeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
      };
    }
    if (score === 3) {
      return {
        label: "Good",
        barColor: "bg-sky-500 shadow-sky-500/20",
        badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60",
      };
    }
    return {
      label: "Strong",
      barColor: "bg-emerald-500 shadow-emerald-500/20",
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
    };
  }, [password, score]);

  if (!alwaysVisible && password.length === 0 && (!confirmPassword || confirmPassword.length === 0)) {
    return null;
  }

  const isAllValid = score === 4;
  const hasConfirmInput = confirmPassword !== undefined && confirmPassword.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50/75 dark:bg-zinc-900/60 backdrop-blur-sm p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 transition-all duration-200 shadow-2xs",
        className
      )}
    >
      {/* Header: Label + Strength Gauge Bar + Dynamic Status Badge */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400 select-none">
            Password Strength
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider border transition-all duration-200 select-none",
              badgeBg
            )}
          >
            {isAllValid ? (
              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : score <= 1 && password.length > 0 ? (
              <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : null}
            <span>{label}</span>
          </span>
        </div>

        {/* 4-Segment Animated Progress Bar */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = password.length > 0 && score >= step;
            return (
              <div
                key={step}
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  isFilled
                    ? cn(barColor, "shadow-2xs")
                    : "bg-slate-200/80 dark:bg-zinc-800"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Structured 2-Column Requirements Checklist */}
      <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 pt-0.5 border-t border-slate-200/60 dark:border-zinc-800/60">
        <RequirementItem
          satisfied={rules.length}
          label="10–128 characters"
        />
        <RequirementItem
          satisfied={rules.hasLower}
          label="Lowercase (a–z)"
        />
        <RequirementItem
          satisfied={rules.hasUpper}
          label="Uppercase (A–Z)"
        />
        <RequirementItem
          satisfied={rules.hasDigit}
          label="Number (0–9)"
        />
      </div>

      {/* Match Status Banner (Shown when confirm password has input) */}
      {showMatch && hasConfirmInput && (
        <div
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all duration-200 animate-in fade-in-0",
            rules.matches
              ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300"
          )}
        >
          <div
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0",
              rules.matches ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}
          >
            {rules.matches ? (
              <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3.5]" />
            ) : (
              <XIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3.5]" />
            )}
          </div>
          <span className="truncate">{rules.matches ? "Passwords match" : "Passwords do not match"}</span>
        </div>
      )}
    </div>
  );
};
