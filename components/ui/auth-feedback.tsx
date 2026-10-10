"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "cn";

export interface AuthFeedbackProps {
  variant?: "error" | "lockout" | "success" | "warning";
  title?: string;
  message?: string;
  attemptsRemaining?: number;
  lockoutMinutes?: number;
  className?: string;
}

export const AuthFeedback: React.FC<AuthFeedbackProps> = ({
  variant = "error",
  title,
  message,
  attemptsRemaining,
  lockoutMinutes,
  className,
}) => {
  const defaultTitle =
    variant === "lockout"
      ? "Security Lockout Active"
      : variant === "success"
      ? "Authentication Successful"
      : "Authentication Failed";

  const isLockout = variant === "lockout";
  const isSuccess = variant === "success";

  const displayMessage =
    typeof attemptsRemaining === "number" && attemptsRemaining > 0 && message
      ? message.replace(/\s*\d+\s+attempts?\s+remaining\.?/i, "").trim()
      : message;

  return (
    <div
      role="alert"
      className={cn(
        "w-full p-3.5 sm:p-4 rounded-tactile border-2 flex items-start gap-3 transition-all duration-200 select-none shadow-2xs text-left",
        isLockout
          ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200"
          : isSuccess
          ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
          : variant === "warning"
          ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60 text-amber-950 dark:text-amber-200"
          : "bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200",
        className
      )}
    >
      {/* Visual Indicator Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
          isLockout || variant === "error"
            ? "bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400"
            : isSuccess
            ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"
        )}
      >
        {isLockout ? (
          <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
        ) : isSuccess ? (
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
        ) : (
          <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
        )}
      </div>

      {/* Message and Attempt Pill */}
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs sm:text-sm font-black tracking-tight leading-tight">
            {title || defaultTitle}
          </span>

          {typeof attemptsRemaining === "number" && attemptsRemaining > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
              {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} left
            </span>
          )}

          {typeof lockoutMinutes === "number" && lockoutMinutes > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
              Lockout: {lockoutMinutes}m
            </span>
          )}
        </div>

        {displayMessage && (
          <p
            className={cn(
              "text-xs font-medium leading-relaxed [overflow-wrap:anywhere]",
              isSuccess
                ? "text-emerald-800 dark:text-emerald-200"
                : variant === "warning"
                ? "text-amber-800 dark:text-amber-200"
                : "text-rose-700 dark:text-rose-300"
            )}
          >
            {displayMessage}
          </p>
        )}
      </div>
    </div>
  );
};
