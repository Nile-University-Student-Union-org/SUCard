"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";

export interface ErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  portalName?: string;
}

export function ErrorView({
  error,
  reset,
  title = "SOMETHING WENT WRONG",
  description = "An unexpected error occurred while loading this page. Please try again.",
  homeHref = "/",
  homeLabel = "Back to home",
  portalName,
}: ErrorViewProps) {
  useEffect(() => {
    // Log runtime error for debugging
    console.error("Runtime error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-foreground flex flex-col justify-between relative isolate overflow-hidden selection:bg-brand selection:text-white">
      <AmbientBackdrop />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
          aria-label="SU Card Home"
        >
          <Image
            src="/brand/su-logo-color.png"
            alt="Nile University Student Union"
            width={160}
            height={48}
            className="h-9 w-auto object-contain dark:hidden"
            priority
          />
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="Nile University Student Union"
            width={160}
            height={48}
            className="h-9 w-auto object-contain hidden dark:block"
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          {portalName && (
            <span className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400 font-mono">
              {portalName}
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Centered Main Error Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 relative z-10 text-center max-w-2xl mx-auto">
        {/* Large Branded Error Graphic */}
        <div className="relative mb-6 select-none flex items-center justify-center">
          {/* Subtle back-glow */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-tr from-rose-500/20 via-[#0F3056]/20 to-transparent blur-2xl rounded-full scale-125"
            aria-hidden="true"
          />

          {/* Stylized circle with branded arcs */}
          <div className="relative size-20 sm:size-28 md:size-32 flex items-center justify-center">
            <svg
              className="size-full animate-spin-slow motion-reduce:animate-none"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray="160 80"
                className="text-rose-500/80 dark:text-rose-400/80"
              />
              <circle
                cx="50"
                cy="50"
                r="26"
                stroke="#018BCE"
                strokeWidth="6"
                strokeDasharray="70 40"
                className="text-[#018BCE]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="size-8 sm:size-10 md:size-12 text-rose-600 dark:text-rose-400 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4">
          <span className="size-1.5 rounded-full bg-rose-500" />
          APPLICATION ERROR
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl sm:text-5xl uppercase tracking-wider text-charcoal dark:text-white mb-3">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-ash dark:text-zinc-300 max-w-md mx-auto mb-4 leading-relaxed">
          {description}
        </p>

        {/* Error Digest if available */}
        {error.digest && (
          <div className="mb-6 px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-muted-foreground">
            Error ID: <span className="select-all font-semibold text-foreground">{error.digest}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-md">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => reset()}
            className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-bold normal-case shadow-xs"
          >
            <RotateCcw className="size-4 mr-2" />
            <span>Try again</span>
          </Button>

          <ButtonLink
            href={homeHref}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-bold normal-case shadow-2xs"
          >
            <Home className="size-4 mr-2" />
            <span>{homeLabel}</span>
          </ButtonLink>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-ash dark:text-zinc-500 relative z-10">
        <p>SU Card &bull; Nile University Student Union (NUSU)</p>
      </footer>
    </div>
  );
}
