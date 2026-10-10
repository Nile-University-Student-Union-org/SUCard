"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";

/** `embedded`: rendered inside an area layout that already has its own nav, logo and theme toggle. */
export function NotFoundView({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const hero = (
    <>
      {/* Centered Main 404 Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 relative z-10 text-center max-w-2xl mx-auto">
        {/* Large Branded 404 Graphic */}
        <div className="relative mb-6 select-none flex items-center justify-center gap-1 sm:gap-2">
          {/* Subtle back-glow */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-tr from-brand/20 via-macaw-blue/20 to-transparent blur-2xl rounded-full scale-125 pointer-events-none"
            aria-hidden="true"
          />

          {/* Digit 4 */}
          <span className="font-heading text-7xl sm:text-9xl md:text-[10rem] text-brand dark:text-brand-soft leading-none drop-shadow-sm">
            4
          </span>

          {/* Stylized '0' ring echoing NUSU brand curves */}
          <div className="relative size-16 sm:size-24 md:size-28 mx-1 flex items-center justify-center">
            <svg
              className="size-full"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
            >
              {/* Outer brand arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="180 70"
                className="text-brand dark:text-brand-soft"
              />
              {/* Inner Sky accent arc */}
              <circle
                cx="50"
                cy="50"
                r="24"
                stroke="#018BCE"
                strokeWidth="8"
                strokeDasharray="90 50"
                className="text-macaw-blue"
              />
            </svg>
            <div className="absolute size-3 sm:size-4 rounded-full bg-macaw-blue shadow-xs" />
          </div>

          {/* Digit 4 */}
          <span className="font-heading text-7xl sm:text-9xl md:text-[10rem] text-brand dark:text-brand-soft leading-none drop-shadow-sm">
            4
          </span>
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/20 text-brand dark:text-brand-soft text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4">
          <span className="size-1.5 rounded-full bg-[#018BCE]" />
          ERROR 404
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl sm:text-5xl uppercase tracking-wider text-charcoal dark:text-white mb-3">
          PAGE NOT FOUND
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-ash dark:text-zinc-300 max-w-md mx-auto mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-md">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoBack}
            className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-bold normal-case shadow-2xs"
          >
            <ArrowLeft className="size-4 mr-2" />
            <span>Go back</span>
          </Button>

          <ButtonLink
            href="/"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-bold normal-case shadow-xs"
          >
            <Home className="size-4 mr-2" />
            <span>Back to home</span>
          </ButtonLink>
        </div>
      </main>
    </>
  );

  if (embedded) return hero;

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
          <ThemeToggle />
        </div>
      </header>

      {hero}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-ash dark:text-zinc-500 relative z-10">
        <p>SU Card &bull; Nile University Student Union (NUSU)</p>
      </footer>
    </div>
  );
}
