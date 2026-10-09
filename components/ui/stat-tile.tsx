"use client";

import React from "react";
import { cn } from "cn";

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  subText?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "brand" | "blue" | "orange" | "green" | "emerald" | "amber" | "rose" | "violet" | "neutral";
  badge?: React.ReactNode;
  variant?: "default" | "hero" | "compact";
  className?: string;
  children?: React.ReactNode;
}

const accentIconStyles = {
  brand: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  blue: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  orange: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  green: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  emerald: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  amber: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  rose: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  violet: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
  neutral: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/60",
};

function parseNumberString(str: string): { prefix: string; num: number; suffix: string; hasCommas: boolean; decimals: number } | null {
  const match = str.match(/^([^\d.-]*)([0-9,.]+)(.*)$/);
  if (!match) return null;
  const prefix = match[1];
  const numStr = match[2];
  const suffix = match[3];
  const hasCommas = numStr.includes(",");
  const clean = numStr.replaceAll(",", "");
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  const parts = clean.split(".");
  const decimals = parts.length > 1 ? parts[1].length : 0;
  return { prefix, num, suffix, hasCommas, decimals };
}

function CountUpValue({ value }: { value: React.ReactNode }) {
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const animatedRef = React.useRef(false);

  React.useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let parsed: ReturnType<typeof parseNumberString> = null;
    if (typeof value === "number") {
      parsed = { prefix: "", num: value, suffix: "", hasCommas: false, decimals: 0 };
    } else if (typeof value === "string") {
      parsed = parseNumberString(value);
    }

    if (!parsed || parsed.num === 0 || !spanRef.current) {
      return;
    }

    const { prefix, num: target, suffix, hasCommas, decimals } = parsed;
    const duration = 280;
    const startTime = performance.now();
    const el = spanRef.current;

    // Start counter from 0
    el.textContent = `${prefix}0${suffix}`;

    let rafId: number;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;

      const formattedNum = decimals > 0
        ? current.toFixed(decimals)
        : Math.round(current).toString();

      const withCommas = hasCommas
        ? formattedNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        : formattedNum;

      el.textContent = `${prefix}${withCommas}${suffix}`;

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Ensure final value matches original exactly
        el.textContent = typeof value === "string" || typeof value === "number" ? String(value) : `${prefix}${withCommas}${suffix}`;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return <span ref={spanRef}>{value}</span>;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subText,
  icon,
  accent = "brand",
  badge,
  variant = "default",
  className,
  children,
}) => {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs transition-[border-color,background-color] duration-140 motion-reduce:transition-none",
        isHero ? "p-4 sm:p-5" : isCompact ? "p-3 sm:p-3.5" : "p-4 sm:p-5",
        className
      )}
    >
      {/* Top row: Label + Icon */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium text-slate-500 dark:text-zinc-400 leading-snug break-normal hyphens-none",
              isCompact ? "text-[11px]" : "text-xs"
            )}
          >
            {label}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg border p-1.5 shrink-0",
              accentIconStyles[accent],
              isCompact ? "h-6 w-6 [&>svg]:h-3 [&>svg]:w-3" : "h-7 w-7 sm:h-8 sm:w-8 [&>svg]:h-3.5 sm:[&>svg]:h-4 [&>svg]:w-3.5 sm:[&>svg]:w-4"
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main value display */}
      <div className={cn("min-w-0 flex-1", isCompact ? "mt-1" : "mt-2")}>
        <div
          className={cn(
            "font-semibold tracking-tight text-charcoal dark:text-white tabular-nums font-sans whitespace-nowrap overflow-hidden text-ellipsis",
            isHero
              ? "text-2xl sm:text-3xl"
              : isCompact
              ? "text-base sm:text-lg"
              : "text-xl sm:text-2xl"
          )}
          title={typeof value === "string" ? value : undefined}
        >
          <CountUpValue value={value} />
        </div>

        {/* Badge on its own dedicated row under the value */}
        {badge && (
          <div className="mt-1 flex items-center">
            {badge}
          </div>
        )}

        {subText && (
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-normal break-words [overflow-wrap:anywhere]">
            {subText}
          </p>
        )}
      </div>

      {children && <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">{children}</div>}
    </div>
  );
};
