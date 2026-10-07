"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "cn";

const emptySubscribe = () => () => {};

export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { resolvedTheme, setTheme } = useTheme();

  const handleToggle = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setTheme(nextTheme);
      });
    } else {
      setTheme(nextTheme);
    }
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-11 h-11 rounded-[12px] border-2 border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      data-theme-toggle
      onClick={handleToggle}
      aria-label="Toggle color theme"
      title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
      className={cn(
        "w-11 h-11 rounded-[12px] border-2 border-slate-200 dark:border-zinc-800",
        "flex items-center justify-center text-charcoal dark:text-zinc-200",
        "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm",
        "hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 active:scale-90 transition-all duration-150 cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-brand-soft dark:focus-visible:ring-offset-zinc-900",
        className
      )}
    >
      <div className="relative w-5 h-5 flex items-center justify-center pointer-events-none">
        {/* Sun icon (visible in dark mode) */}
        <Sun
          className={cn(
            "w-5 h-5 text-amber-400 absolute transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            resolvedTheme === "dark"
              ? "scale-100 rotate-0 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]"
              : "scale-0 -rotate-90 opacity-0 pointer-events-none"
          )}
        />
        {/* Moon icon (visible in light mode) */}
        <Moon
          className={cn(
            "w-5 h-5 text-slate-700 dark:text-zinc-200 absolute transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            resolvedTheme === "light"
              ? "scale-100 rotate-0 opacity-100 drop-shadow-[0_0_8px_rgba(1,139,206,0.35)]"
              : "scale-0 rotate-90 opacity-0 pointer-events-none"
          )}
        />
      </div>
    </button>
  );
}
