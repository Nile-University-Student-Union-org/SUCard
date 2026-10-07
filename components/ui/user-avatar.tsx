"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "cn";

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type UserAvatarShape = "rounded" | "circle" | "square";

export interface UserAvatarProps {
  /** Raw avatar URL */
  src?: string | null;
  /** Full name used for initials fallback and accessible alt text */
  name?: string | null;
  /** Preset size or numeric pixel dimension (defaults to "md" = 40px) */
  size?: UserAvatarSize | number;
  /** Rendered image width when responsive CSS overrides the size preset. */
  sizes?: string;
  /** Shape style: "rounded" (squircle), "circle" (round), or "square" */
  shape?: UserAvatarShape;
  /** Additional container classes */
  className?: string;
  /** Additional classes applied directly to next/image */
  imageClassName?: string;
  /** Custom fallback styling for initials container */
  fallbackClassName?: string;
  /** Next.js image loading priority */
  priority?: boolean;
  /** Accessible image alt attribute override */
  alt?: string;
  /** Optional overlay badge */
  badge?: React.ReactNode;
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "SU";
  const trimmed = name.trim();
  if (!trimmed) return "SU";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CONFIGS: Record<UserAvatarSize, { container: string; pixels: number; text: string; radius: string }> = {
  xs: { container: "w-6 h-6", pixels: 24, text: "text-[10px]", radius: "rounded-md" },
  sm: { container: "w-8 h-8", pixels: 32, text: "text-xs", radius: "rounded-xl" },
  md: { container: "w-10 h-10", pixels: 40, text: "text-sm", radius: "rounded-xl" },
  lg: { container: "w-12 h-12", pixels: 48, text: "text-base", radius: "rounded-2xl" },
  xl: { container: "w-16 h-16", pixels: 64, text: "text-lg", radius: "rounded-2xl" },
  "2xl": { container: "w-20 h-20 sm:w-24 sm:h-24", pixels: 96, text: "text-xl", radius: "rounded-2xl sm:rounded-3xl" },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = "md",
  sizes,
  shape = "rounded",
  className,
  imageClassName,
  fallbackClassName,
  priority = false,
  alt,
  badge,
}) => {
  const [loadError, setLoadError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setLoadError(false);
  }

  const initials = getInitials(name);
  const accessibleAlt = alt || name || "User Avatar";

  const sizePreset = typeof size === "string" ? SIZE_CONFIGS[size] : null;
  const pixelSize = typeof size === "number" ? size : sizePreset?.pixels ?? 40;

  const shapeRadius =
    shape === "circle"
      ? "rounded-full"
      : shape === "square"
      ? "rounded-none"
      : sizePreset?.radius ?? "rounded-xl";

  const shouldRenderImage = Boolean(src) && !loadError;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden select-none bg-slate-200 dark:bg-zinc-800 transition-colors",
        shapeRadius,
        sizePreset?.container,
        className
      )}
      style={typeof size === "number" ? { width: pixelSize, height: pixelSize } : undefined}
      aria-label={accessibleAlt}
    >
      {shouldRenderImage && src ? (
        <Image
          src={src}
          alt={accessibleAlt}
          fill
          sizes={sizes ?? `${pixelSize}px`}
          quality={90}
          priority={priority}
          onError={() => setLoadError(true)}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center font-black tracking-tight",
            "bg-gradient-to-br from-brand/15 via-brand/10 to-slate-200 dark:from-brand/25 dark:via-zinc-800 dark:to-zinc-900",
            "text-brand dark:text-brand-soft",
            sizePreset?.text ?? "text-sm",
            fallbackClassName
          )}
        >
          {initials}
        </div>
      )}

      {badge && <div className="absolute z-10 pointer-events-none">{badge}</div>}
    </div>
  );
};
