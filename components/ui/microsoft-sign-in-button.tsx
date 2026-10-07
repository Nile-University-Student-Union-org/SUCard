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
          "w-full min-h-[48px] px-4 py-3 rounded-xl border-2 border-b-4",
          "border-slate-300 dark:border-zinc-700 active:border-b-2",
          "bg-white dark:bg-zinc-900 text-charcoal dark:text-white",
          "hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:border-slate-400 dark:hover:border-zinc-600",
          "active:translate-y-[2px] transition-all duration-150",
          "flex items-center justify-center gap-3 font-bold text-sm select-none shadow-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-sky-400",
          "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 disabled:active:border-b-4"
        )}
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-brand dark:text-brand-soft" />
        ) : (
          <MicrosoftLogo className="size-5" />
        )}
        <span className="truncate">Sign in with Microsoft</span>
      </button>
    </div>
  );
}
