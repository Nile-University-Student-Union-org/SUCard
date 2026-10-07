"use client";

import React from "react";
import { cn } from "cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?:
    | "rectangular"
    | "rounded"
    | "circular"
    | "text"
    | "button"
    | "badge";
  width?: string | number;
  height?: string | number;
  animate?: "pulse" | "shimmer" | "none";
}

/**
 * Standardized universal Skeleton component for zero-flicker loading states.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rounded",
  width,
  height,
  animate = "pulse",
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "text":
        return "h-4 rounded-md my-1";
      case "button":
        return "h-11 min-h-[44px] rounded-xl";
      case "badge":
        return "h-6 rounded-full";
      case "rectangular":
        return "rounded-none";
      case "rounded":
      default:
        return "rounded-xl";
    }
  };

  const getAnimationStyles = () => {
    switch (animate) {
      case "shimmer":
        return "relative overflow-hidden bg-slate-200 dark:bg-zinc-800 after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/25 dark:after:via-white/10 after:to-transparent";
      case "none":
        return "bg-slate-200/90 dark:bg-zinc-800/90";
      case "pulse":
      default:
        return "animate-pulse bg-slate-200 dark:bg-zinc-800";
    }
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined
      ? { width: typeof width === "number" ? `${width}px` : width }
      : {}),
    ...(height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height }
      : {}),
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("select-none", getVariantStyles(), getAnimationStyles(), className)}
      style={inlineStyles}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonCard: React.FC<{
  className?: string;
  animate?: "pulse" | "shimmer" | "none";
}> = ({ className = "", animate = "shimmer" }) => (
  <div
    className={cn(
      "flex h-full flex-col p-4 bg-white dark:bg-zinc-900 border-2 border-slate-200/80 dark:border-zinc-800 rounded-[16px] shadow-xs",
      className
    )}
    role="status"
    aria-label="Loading card content"
  >
    <div className="space-y-3.5">
      <Skeleton animate={animate} className="w-full aspect-[16/9] rounded-xl" />
      <div className="space-y-2 pt-1">
        <Skeleton animate={animate} variant="text" className="w-1/3 h-3.5" />
        <Skeleton animate={animate} variant="text" className="w-4/5 h-5 font-bold" />
      </div>
    </div>
  </div>
);

export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 5, className = "" }) => (
  <tr
    className={cn("border-b border-slate-100 dark:border-zinc-800/80", className)}
  >
    {Array.from({ length: columns }).map((_, idx) => (
      <td key={idx} className="p-4">
        <Skeleton
          variant="text"
          className={cn("h-4", idx === 0 ? "w-3/4" : idx === columns - 1 ? "w-1/2 ml-auto" : "w-2/3")}
        />
      </td>
    ))}
  </tr>
);
