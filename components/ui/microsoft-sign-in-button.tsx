"use client";

import React, { useState } from "react";
import { signIn } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";
import { cn } from "cn";

export function MicrosoftLogo({ className = "size-5 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export interface MicrosoftSignInButtonProps {
  onSignInError?: (message: string) => void;
  callbackURL?: string;
  disabled?: boolean;
  className?: string;
}

export function MicrosoftSignInButton({
  onSignInError,
  callbackURL = "/go",
  disabled = false,
  className,
}: MicrosoftSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);

    try {
      const res = await signIn.social({
        provider: "microsoft",
        callbackURL,
      });

      if (res && "error" in res && res.error) {
        onSignInError?.("Microsoft sign-in failed. Try again.");
      }
    } catch {
      onSignInError?.("Microsoft sign-in failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-label="Sign in with Microsoft"
        className={cn(
          "w-full h-12 min-h-[48px] px-4 rounded-xl",
          // Light theme: solid navy brand with subtle inner highlight and brand shadow
          "bg-[#0F3056] text-white border border-[#173e6d]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_14px_rgba(15,48,86,0.22)]",
          "hover:bg-[#153e6d] hover:border-[#1d4f8b] hover:shadow-lg hover:shadow-[#0F3056]/25 hover:-translate-y-0.5",
          // Dark theme: white button with near-black text (Microsoft dark theme convention)
          "dark:bg-white dark:text-[#0A1E38] dark:border-transparent",
          "dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)] dark:hover:bg-slate-100 dark:hover:shadow-white/10 dark:hover:-translate-y-0.5",
          // Interactions & Focus
          "active:scale-[0.99] active:translate-y-0 dark:active:translate-y-0 transition-all duration-150",
          "flex items-center justify-center gap-3 font-semibold text-sm select-none",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F3056] dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-zinc-900",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100"
        )}
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-white dark:text-[#0A1E38]" />
        ) : (
          <span className="size-6 rounded-md bg-white flex items-center justify-center shadow-xs shrink-0">
            <MicrosoftLogo className="size-4" />
          </span>
        )}
        <span className="truncate">Continue with Microsoft</span>
      </button>
    </div>
  );
}
