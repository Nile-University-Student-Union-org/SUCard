"use client";

import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 text-foreground overflow-hidden selection:bg-brand selection:text-white">
      {/* Ambient background brand glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-brand/10 dark:bg-brand/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[32rem] rounded-full bg-brand/10 dark:bg-brand-soft/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[40rem] rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ButtonLink
            href="/login"
            variant="outline"
            size="sm"
            className="normal-case"
          >
            <ShieldCheck className="size-4 text-brand dark:text-brand-soft" />
            <span>Staff portal</span>
          </ButtonLink>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 text-center max-w-4xl mx-auto">
        {/* Card Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/25 dark:border-brand-soft/30 backdrop-blur-md text-xs sm:text-sm font-bold text-brand dark:text-brand-soft mb-8 shadow-2xs">
          <span className="size-2 rounded-full bg-brand dark:bg-brand-soft animate-pulse" />
          Official Membership System
        </div>

        {/* Hero Title in Anton */}
        <h1 className="font-heading text-6xl sm:text-8xl md:text-9xl tracking-wider uppercase text-charcoal dark:text-white font-normal drop-shadow-xs mb-4">
          SU CARD
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-ash dark:text-zinc-300 font-normal max-w-2xl mx-auto mb-10 leading-relaxed">
          Nile University Student Union membership card
        </p>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none">
          <ButtonLink
            href="/login"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto h-12 px-8 text-base font-bold normal-case shadow-md"
          >
            <span>Staff sign in</span>
            <ArrowRight className="size-5 ml-1.5" />
          </ButtonLink>
        </div>

        {/* Decorative Card preview silhouette with tactile styling */}
        <div className="mt-14 w-full max-w-md p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border-2 border-slate-200 dark:border-zinc-800 backdrop-blur-xl shadow-md text-left flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-brand dark:text-brand-soft font-bold">
              Nile University Student Union
            </span>
            <span className="text-xs font-mono font-bold text-ash dark:text-zinc-400">2026/2027</span>
          </div>
          <div className="h-16 flex items-center justify-between pt-2">
            <div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md mb-2" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800/60 rounded-md" />
            </div>
            <div className="size-12 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20 p-2 flex items-center justify-center">
              <div className="size-8 border-2 border-brand dark:border-brand-soft rounded-sm border-dashed" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-ash dark:text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Nile University Student Union (NUSU). All rights reserved.</p>
      </footer>
    </div>
  );
}
